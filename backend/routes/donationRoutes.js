const express = require('express');
const router = express.Router();
const { DonationRecord, Donor, Inventory, User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

/**
 * @route   GET /api/donations
 * @desc    View all donation history
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { blood_type, donor_id, start_date, end_date } = req.query;
    
    // Build filter object
    const where = {};
    if (blood_type) where.blood_type = blood_type;
    if (donor_id) where.donor_id = donor_id;
    if (start_date || end_date) {
      where.donation_date = {};
      if (start_date) where.donation_date[Op.gte] = new Date(start_date);
      if (end_date) where.donation_date[Op.lte] = new Date(end_date);
    }

    const donations = await DonationRecord.findAll({
      where,
      include: [
        {
          model: Donor,
          as: 'donor',
          attributes: ['id', 'name', 'blood_type', 'contact']
        },
        {
          model: User,
          as: 'hospital',
          attributes: ['id', 'hospital_name']
        }
      ],
      order: [['donation_date', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/donations
 * @desc    Add new donation (updates donor stats and inventory)
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { donor_id, blood_type, quantity } = req.body;
    const hospital_id = req.user.id;

    // Validate input
    if (!donor_id || !blood_type || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: donor_id, blood_type, quantity'
      });
    }

    // Check if donor exists
    const donor = await Donor.findByPk(donor_id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Create donation record
    const donation = await DonationRecord.create({
      donor_id,
      hospital_id,
      blood_type,
      quantity,
      donation_date: new Date()
    });

    // Update donor statistics
    donor.last_donation_date = new Date();
    donor.total_donations += 1;
    donor.total_donated_ml += quantity; // Track total volume in ml
    await donor.save();

    // Update or create inventory entry
    // Find existing inventory for this hospital and blood type
    let inventory = await Inventory.findOne({
      where: {
        hospital_id,
        blood_type,
        status: 'available',
        expiry_date: {
          [Op.gt]: new Date() // Not expired
        }
      },
      order: [['expiry_date', 'ASC']] // Get oldest first
    });

    if (inventory) {
      // Update existing inventory
      inventory.units += Math.floor(quantity / 450); // Convert ml to units (1 unit ≈ 450ml)
      await inventory.save();
    } else {
      // Create new inventory entry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 35); // Blood typically expires in 35 days

      inventory = await Inventory.create({
        hospital_id,
        blood_type,
        units: Math.floor(quantity / 450),
        status: 'available',
        expiry_date: expiryDate,
        collection_date: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully',
      data: {
        donation,
        inventory_updated: {
          id: inventory.id,
          units: inventory.units
        }
      }
    });
  } catch (error) {
    console.error('Error recording donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record donation',
      error: error.message
    });
  }
});

module.exports = router;

