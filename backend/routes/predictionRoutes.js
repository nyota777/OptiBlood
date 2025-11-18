const express = require('express');
const router = express.Router();
const { Prediction, Inventory, Donor, Alert, User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { runPythonModel } = require('../utils/runPythonModel');
const { runDonorPrediction } = require('../utils/runDonorPrediction');
const { sendShortageAlert, sendDonorShortageAlert } = require('../utils/emailService');
const { Op } = require('sequelize');

/**
 * @route   GET /api/predictions
 * @desc    Get prediction history
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { blood_type, predicted_shortage } = req.query;
    
    // Build filter object
    const where = {};
    if (blood_type) where.blood_type = blood_type;
    if (predicted_shortage !== undefined) {
      where.predicted_shortage = predicted_shortage === 'true';
    }

    const predictions = await Prediction.findAll({
      where,
      order: [['run_date', 'DESC']],
      limit: 100
    });

    res.status(200).json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/predict-shortage
 * @desc    Run ML prediction model for blood shortage
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('🔮 Running ML prediction model...');

    // Gather current inventory data
    const inventory = await Inventory.findAll({
      where: {
        status: 'available',
        expiry_date: {
          [Op.gt]: new Date() // Not expired
        }
      }
    });

    // Gather donor data
    const donors = await Donor.findAll({
      where: {
        available: true
      }
    });

    // Prepare data for Python model
    const modelInput = {
      inventory: inventory.map(item => ({
        blood_type: item.blood_type,
        units: item.units,
        expiry_date: item.expiry_date,
        hospital_id: item.hospital_id
      })),
      donors: donors.map(donor => ({
        blood_type: donor.blood_type,
        total_donations: donor.total_donations,
        last_donation_date: donor.last_donation_date
      }))
    };

    // Run Python ML model
    const predictions = await runPythonModel(modelInput);

    if (!predictions || !predictions.predictions) {
      throw new Error('Invalid prediction response from ML model');
    }

    // Save predictions to database and create alerts
    const savedPredictions = [];
    const createdAlerts = [];

    for (const pred of predictions.predictions) {
      // Save prediction
      const prediction = await Prediction.create({
        run_date: new Date(),
        blood_type: pred.blood_type,
        predicted_shortage: pred.predicted_shortage,
        probability: pred.probability,
        model_accuracy: pred.model_accuracy,
        details: JSON.stringify(pred)
      });
      savedPredictions.push(prediction);

      // Create alert and send emails if shortage probability > 0.7
      if (pred.predicted_shortage && pred.probability > 0.7) {
        const alert = await Alert.create({
          type: 'shortage',
          blood_type: pred.blood_type,
          message: `⚠️ PREDICTED SHORTAGE: Blood type ${pred.blood_type} is predicted to have a shortage. Probability: ${(pred.probability * 100).toFixed(1)}%. Please take action.`,
          notified: false
        });
        createdAlerts.push(alert);

        // Get all hospital staff emails for notifications
        const hospitalStaff = await User.findAll({
          attributes: ['id', 'email', 'hospital_name'],
          where: {
            role: { [Op.in]: ['staff', 'admin'] }
          }
        });

        const staffEmails = hospitalStaff.map(user => user.email);
        const hospitalInfo = hospitalStaff[0]; // Use first hospital for donor emails

        // Send email alerts to hospital staff
        if (staffEmails.length > 0) {
          try {
            await sendShortageAlert(
              staffEmails,
              pred.blood_type,
              pred.probability,
              hospitalInfo?.hospital_name || 'Hospital'
            );
            console.log(`✉️ Shortage alerts sent to ${staffEmails.length} staff members for ${pred.blood_type}`);
            
            // Mark alert as notified
            alert.notified = true;
            await alert.save();
          } catch (error) {
            console.error(`❌ Failed to send staff shortage alerts for ${pred.blood_type}:`, error.message);
          }
        }

        // Find all available donors with matching blood type
        const matchingDonors = await Donor.findAll({
          where: {
            blood_type: pred.blood_type,
            available: true,
            email: { [Op.ne]: null } // Only donors with email
          },
          attributes: ['id', 'name', 'email', 'blood_type', 'city']
        });

        // Send email alerts to matching donors
        if (matchingDonors.length > 0) {
          console.log(`📧 Sending shortage alerts to ${matchingDonors.length} donors with blood type ${pred.blood_type}`);
          
          const donorEmailPromises = matchingDonors.map(async (donor) => {
            try {
              await sendDonorShortageAlert(
                donor.email,
                donor.name,
                donor.blood_type,
                hospitalInfo?.hospital_name || 'Hospital',
                hospitalInfo?.email || null
              );
              return { success: true, donor: donor.email };
            } catch (error) {
              console.error(`❌ Failed to send email to donor ${donor.email}:`, error.message);
              return { success: false, donor: donor.email, error: error.message };
            }
          });

          const donorEmailResults = await Promise.allSettled(donorEmailPromises);
          const successful = donorEmailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
          console.log(`✅ Sent shortage alerts to ${successful}/${matchingDonors.length} donors for ${pred.blood_type}`);
        } else {
          console.log(`⚠️ No available donors found with blood type ${pred.blood_type}`);
        }
      }
    }

    console.log(`✅ Prediction completed. ${savedPredictions.length} predictions saved, ${createdAlerts.length} alerts created.`);

    // Calculate overall summary for frontend
    const overallShortage = savedPredictions.some(p => p.predicted_shortage);
    const avgProbability = savedPredictions.length > 0
      ? savedPredictions.reduce((sum, p) => sum + (p.probability || 0), 0) / savedPredictions.length
      : 0;

    res.status(200).json({
      success: true,
      message: `Prediction complete. Analyzed ${predictions.predictions.length} blood types.`,
      data: {
        predictions: savedPredictions.map(p => ({
          id: p.id,
          blood_type: p.blood_type,
          predicted_shortage: p.predicted_shortage,
          probability: p.probability,
          model_accuracy: p.model_accuracy,
          current_units: predictions.predictions.find(pr => pr.blood_type === p.blood_type)?.current_units || 0,
          available_donors: predictions.predictions.find(pr => pr.blood_type === p.blood_type)?.available_donors || 0
        })),
        alerts: createdAlerts,
        summary: {
          total_predictions: savedPredictions.length,
          shortages_predicted: createdAlerts.length,
          overall_shortage: overallShortage,
          average_probability: avgProbability,
          run_date: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error running prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run prediction',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/predict-donor/:id
 * @desc    Predict donor availability for next donation (KNBTS Rules)
 * @access  Private
 */
router.get('/predict-donor/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { DonationRecord } = require('../models');

    // Get donor data
    const donor = await Donor.findByPk(id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Check if donor has enough donations (need at least 2)
    if (donor.total_donations < 2) {
      return res.status(200).json({
        success: true,
        data: {
          next_donation: null,
          status: 'Not enough data',
          message: `Need at least 2 donations. Current: ${donor.total_donations}`,
          days_until_eligible: null,
          knbts_rule: donor.gender === 'male' ? 'Men: 3 months | Women: 4 months' : 'Men: 3 months | Women: 4 months',
          can_predict: false
        }
      });
    }

    // Get donation history dates (sorted by date, newest first)
    const donationRecords = await DonationRecord.findAll({
      where: { donor_id: id },
      attributes: ['donation_date'],
      order: [['donation_date', 'DESC']],
      limit: 10
    });

    const donation_history = donationRecords.map(d => d.donation_date.toISOString());

    // Prepare donor data for prediction
    const donorData = {
      gender: donor.gender || 'other',
      total_donations: donor.total_donations || 0,
      donation_history: donation_history,
      blood_type: donor.blood_type,
      age: donor.age || null,
      weight: donor.weight || null
    };

    // Run prediction model
    const prediction = await runDonorPrediction(donorData);

    if (prediction.error) {
      return res.status(500).json({
        success: false,
        message: 'Prediction failed',
        error: prediction.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        next_donation: prediction.next_donation,
        status: prediction.status,
        message: prediction.message || prediction.status,
        days_until_eligible: prediction.days_until_eligible,
        knbts_rule: prediction.knbts_rule || 'Men: 3 months | Women: 4 months',
        can_predict: true
      }
    });
  } catch (error) {
    console.error('Error predicting donor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict donor availability',
      error: error.message
    });
  }
});

module.exports = router;

