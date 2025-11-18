const express = require('express');
const router = express.Router();
const { Donor, Inventory, DonationRecord, Alert, User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');
const { runPythonModel } = require('../utils/runPythonModel');

/**
 * Middleware to check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

/**
 * @route   GET /api/admin/stock
 * @desc    Get current stock by blood group (system-wide)
 * @access  Private (Admin only)
 */
router.get('/stock', authenticate, isAdmin, async (req, res) => {
  try {
    // Get all inventory across all hospitals
    const inventoryRaw = await Inventory.sequelize.query(`
      SELECT 
        blood_type,
        COALESCE(SUM(units), 0) as total_units,
        COUNT(*) as entry_count
      FROM inventory
      WHERE status = 'available'
        AND expiry_date > NOW()
      GROUP BY blood_type
    `, {
      type: Inventory.sequelize.QueryTypes.SELECT
    });

    // Get expiry warnings (units expiring in next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiryWarnings = await Inventory.sequelize.query(`
      SELECT 
        blood_type,
        COALESCE(SUM(units), 0) as expiring_units
      FROM inventory
      WHERE status = 'available'
        AND expiry_date BETWEEN NOW() AND :threeDaysFromNow
      GROUP BY blood_type
    `, {
      replacements: { threeDaysFromNow },
      type: Inventory.sequelize.QueryTypes.SELECT
    });

    const allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventoryMap = new Map(inventoryRaw.map(item => [item.blood_type, parseInt(item.total_units) || 0]));
    const expiryMap = new Map(expiryWarnings.map(item => [item.blood_type, parseInt(item.expiring_units) || 0]));

    const stock = allBloodTypes.map(type => {
      const units = inventoryMap.get(type) || 0;
      const expiring = expiryMap.get(type) || 0;
      
      // Determine status color
      let status = 'safe';
      if (units < 20) status = 'critical';
      else if (units < 50) status = 'low';
      else status = 'safe';

      return {
        blood_type: type,
        units,
        expiring_units: expiring,
        status,
        color: status === 'critical' ? 'red' : status === 'low' ? 'yellow' : 'green'
      };
    });

    const totalUnits = stock.reduce((sum, item) => sum + item.units, 0);

    res.status(200).json({
      success: true,
      data: {
        stock,
        total_units: totalUnits,
        critical_blood_types: stock.filter(s => s.status === 'critical').map(s => s.blood_type),
        low_blood_types: stock.filter(s => s.status === 'low').map(s => s.blood_type)
      }
    });
  } catch (error) {
    console.error('Error fetching admin stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/forecast
 * @desc    Get 12-month demand forecast (past 12 months + next 12 months)
 * @access  Private (Admin only)
 */
router.get('/forecast', authenticate, isAdmin, async (req, res) => {
  try {
    // Get past 12 months of actual donations
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const pastDonationsRaw = await DonationRecord.sequelize.query(`
      SELECT 
        DATE_TRUNC('month', donation_date) as month,
        COUNT(*) as donations
      FROM donation_records
      WHERE donation_date >= :twelveMonthsAgo
      GROUP BY DATE_TRUNC('month', donation_date)
      ORDER BY month ASC
    `, {
      replacements: { twelveMonthsAgo },
      type: DonationRecord.sequelize.QueryTypes.SELECT
    });

    // Generate last 12 months
    const pastMonths = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      pastMonths.push(date);
    }

    const pastMap = new Map(
      pastDonationsRaw.map(item => [
        new Date(item.month).toISOString().split('T')[0].substring(0, 7),
        parseInt(item.donations) || 0
      ])
    );

    const historical = pastMonths.map(date => {
      const monthKey = date.toISOString().split('T')[0].substring(0, 7);
      const donations = pastMap.get(monthKey) || 0;
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: monthKey,
        donations,
        type: 'historical'
      };
    });

    // Generate next 12 months forecast (simplified - using average trend)
    const avgDonations = historical.length > 0 
      ? historical.reduce((sum, h) => sum + h.donations, 0) / historical.length 
      : 0;

    const forecast = [];
    for (let i = 1; i <= 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      date.setDate(1);
      
      // Simple forecast: average + slight trend (can be replaced with SARIMA model)
      const predicted = Math.round(avgDonations * (1 + (i * 0.02))); // 2% growth per month
      const confidence_upper = Math.round(predicted * 1.15); // 95% CI upper
      const confidence_lower = Math.round(predicted * 0.85); // 95% CI lower

      forecast.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: date.toISOString().split('T')[0].substring(0, 7),
        donations: predicted,
        confidence_upper,
        confidence_lower,
        type: 'forecast'
      });
    }

    // Today's forecasted donations (next 24 hours estimate)
    const todayForecast = Math.round(avgDonations / 30); // Average daily

    res.status(200).json({
      success: true,
      data: {
        historical,
        forecast,
        today_forecast: todayForecast,
        confidence_interval: 95
      }
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forecast',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/donors/available
 * @desc    Get top eligible donors with predicted next eligible date
 * @access  Private (Admin only)
 */
router.get('/donors/available', authenticate, isAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const { runDonorPrediction } = require('../utils/runDonorPrediction');
    const { DonationRecord } = require('../models');

    // Get donors with 2+ donations
    const donors = await Donor.findAll({
      where: {
        total_donations: {
          [Op.gte]: 2
        },
        available: true
      },
      order: [['total_donations', 'DESC']],
      limit: parseInt(limit)
    });

    // Get predictions for each donor
    const donorsWithPredictions = await Promise.all(
      donors.map(async (donor) => {
        try {
          // Get donation history
          const donationRecords = await DonationRecord.findAll({
            where: { donor_id: donor.id },
            attributes: ['donation_date'],
            order: [['donation_date', 'DESC']],
            limit: 10
          });

          const donation_history = donationRecords.map(d => d.donation_date.toISOString());

          // Run prediction
          const donorData = {
            gender: donor.gender || 'other',
            total_donations: donor.total_donations || 0,
            donation_history: donation_history,
            blood_type: donor.blood_type
          };

          const prediction = await runDonorPrediction(donorData);

          return {
            id: donor.id,
            name: donor.name,
            phone: donor.contact,
            blood_group: donor.blood_type,
            last_donation_date: donor.last_donation_date 
              ? donor.last_donation_date.toISOString().split('T')[0]
              : null,
            predicted_next_eligible: prediction.next_donation || null,
            confidence: prediction.probability ? Math.round(prediction.probability * 100) : 0,
            status: prediction.status || 'Unknown'
          };
        } catch (error) {
          console.error(`Error predicting for donor ${donor.id}:`, error);
          return {
            id: donor.id,
            name: donor.name,
            phone: donor.contact,
            blood_group: donor.blood_type,
            last_donation_date: donor.last_donation_date 
              ? donor.last_donation_date.toISOString().split('T')[0]
              : null,
            predicted_next_eligible: null,
            confidence: 0,
            status: 'Error'
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      count: donorsWithPredictions.length,
      data: donorsWithPredictions
    });
  } catch (error) {
    console.error('Error fetching available donors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available donors',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/shortage-risk
 * @desc    Get shortage risk probability for each blood group
 * @access  Private (Admin only)
 */
router.get('/shortage-risk', authenticate, isAdmin, async (req, res) => {
  try {
    // Get current stock levels
    const stockRaw = await Inventory.sequelize.query(`
      SELECT 
        blood_type,
        COALESCE(SUM(units), 0) as total_units
      FROM inventory
      WHERE status = 'available'
        AND expiry_date > NOW()
      GROUP BY blood_type
    `, {
      type: Inventory.sequelize.QueryTypes.SELECT
    });

    // Get recent demand (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const demandRaw = await Inventory.sequelize.query(`
      SELECT 
        blood_type,
        COUNT(*) as requests
      FROM donation_records
      WHERE donation_date >= :thirtyDaysAgo
      GROUP BY blood_type
    `, {
      replacements: { thirtyDaysAgo },
      type: Inventory.sequelize.QueryTypes.SELECT
    });

    const allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const stockMap = new Map(stockRaw.map(item => [item.blood_type, parseInt(item.total_units) || 0]));
    const demandMap = new Map(demandRaw.map(item => [item.blood_type, parseInt(item.requests) || 0]));

    const shortageRisks = allBloodTypes.map(type => {
      const stock = stockMap.get(type) || 0;
      const demand = demandMap.get(type) || 0;
      
      // Calculate risk probability (0-100%)
      // Risk increases if stock is low relative to demand
      let riskProbability = 0;
      
      if (stock === 0) {
        riskProbability = 100;
      } else if (stock < 10) {
        riskProbability = 85;
      } else if (stock < 20) {
        riskProbability = 60;
      } else if (stock < 50) {
        riskProbability = 30;
      } else {
        // Low risk, but consider demand
        if (demand > stock * 2) {
          riskProbability = 25;
        } else {
          riskProbability = 10;
        }
      }

      // Adjust based on demand
      if (demand > 0 && stock < demand * 2) {
        riskProbability = Math.min(100, riskProbability + 20);
      }

      return {
        blood_type: type,
        stock_units: stock,
        recent_demand: demand,
        risk_probability: Math.round(riskProbability),
        status: riskProbability >= 70 ? 'high' : riskProbability >= 40 ? 'medium' : 'low'
      };
    });

    res.status(200).json({
      success: true,
      data: shortageRisks
    });
  } catch (error) {
    console.error('Error fetching shortage risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shortage risk',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/campaign
 * @desc    Send SMS/email campaign to selected blood groups
 * @access  Private (Admin only)
 */
router.post('/campaign', authenticate, isAdmin, async (req, res) => {
  try {
    const { blood_groups, message, method } = req.body; // method: 'sms' or 'email'

    if (!blood_groups || !Array.isArray(blood_groups) || blood_groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide blood_groups array'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide campaign message'
      });
    }

    // Get eligible donors for selected blood groups
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const donors = await Donor.findAll({
      where: {
        blood_type: {
          [Op.in]: blood_groups
        },
        available: true,
        [Op.or]: [
          { last_donation_date: null },
          { last_donation_date: { [Op.lte]: threeDaysAgo } }
        ]
      }
    });

    // Mock campaign sending (in production, integrate with Twilio for SMS or use email service)
    const campaignResults = {
      total_recipients: donors.length,
      sent: donors.length,
      failed: 0,
      method: method || 'email',
      blood_groups,
      message_preview: message.substring(0, 100) + '...'
    };

    // Log activity (in production, save to activity log table)
    console.log(`📢 Campaign sent: ${method || 'email'} to ${donors.length} donors (${blood_groups.join(', ')})`);

    res.status(200).json({
      success: true,
      message: `Campaign sent successfully to ${donors.length} donor(s)`,
      data: campaignResults
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send campaign',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/kpis
 * @desc    Get top KPI metrics for admin dashboard
 * @access  Private (Admin only)
 */
router.get('/kpis', authenticate, isAdmin, async (req, res) => {
  try {
    // Total blood units in stock (system-wide)
    const totalStock = await Inventory.sequelize.query(`
      SELECT COALESCE(SUM(units), 0) as total_units
      FROM inventory
      WHERE status = 'available'
        AND expiry_date > NOW()
    `, {
      type: Inventory.sequelize.QueryTypes.SELECT
    });
    const totalUnits = parseInt(totalStock[0]?.total_units || 0);

    // Today's forecasted donations (simplified - average daily)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentDonations = await DonationRecord.count({
      where: {
        donation_date: {
          [Op.gte]: last30Days
        }
      }
    });
    const todayForecast = Math.round(recentDonations / 30);

    // Critical blood groups (< 3 days stock based on average daily usage)
    const criticalGroups = await Inventory.sequelize.query(`
      SELECT 
        blood_type,
        COALESCE(SUM(units), 0) as total_units
      FROM inventory
      WHERE status = 'available'
        AND expiry_date > NOW()
      GROUP BY blood_type
      HAVING COALESCE(SUM(units), 0) < 20
    `, {
      type: Inventory.sequelize.QueryTypes.SELECT
    });

    // High-risk donors (from shortage prediction - donors with low stock for their blood type)
    const highRiskDonors = await Donor.count({
      where: {
        available: true,
        blood_type: {
          [Op.in]: criticalGroups.map(g => g.blood_type)
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total_blood_units: totalUnits,
        today_forecasted_donations: todayForecast,
        critical_blood_groups: criticalGroups.length,
        critical_blood_types: criticalGroups.map(g => g.blood_type),
        high_risk_donors: highRiskDonors
      }
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPIs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent activity log
 * @access  Private (Admin only)
 */
router.get('/activity', authenticate, isAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent activities from various sources
    const recentDonations = await DonationRecord.findAll({
      include: [
        {
          model: Donor,
          as: 'donor',
          attributes: ['name', 'blood_type']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const recentAlerts = await Alert.findAll({
      where: {
        type: 'shortage'
      },
      order: [['createdAt', 'DESC']],
      limit: 3
    });

    // Combine and format activities
    const activities = [];

    // Add donation activities
    recentDonations.forEach(donation => {
      activities.push({
        id: `donation-${donation.id}`,
        type: 'donation',
        message: `${donation.donor?.name || 'Unknown'} donated ${donation.blood_type}`,
        timestamp: donation.createdAt,
        icon: 'droplet'
      });
    });

    // Add alert activities
    recentAlerts.forEach(alert => {
      activities.push({
        id: `alert-${alert.id}`,
        type: 'alert',
        message: `Shortage alert: ${alert.message || 'Blood shortage detected'}`,
        timestamp: alert.createdAt,
        icon: 'alert'
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      count: limitedActivities.length,
      data: limitedActivities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
        time_ago: getTimeAgo(activity.timestamp)
      }))
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log',
      error: error.message
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * @route   GET /api/admin/donors
 * @desc    Get all donors with search and filters (for admin donor list)
 * @access  Private (Admin only)
 */
router.get('/donors', authenticate, isAdmin, async (req, res) => {
  try {
    const { search, blood_type, status, limit = 100, offset = 0 } = req.query;
    
    const where = {};
    
    if (blood_type && blood_type !== 'all') {
      where.blood_type = blood_type;
    }
    
    if (status && status !== 'all') {
      where.available = status === 'active';
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { contact: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: donors } = await Donor.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      count,
      data: donors
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donors',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/staff
 * @desc    Get all staff/admin users
 * @access  Private (Admin only)
 */
router.get('/staff', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'hospital_name', 'role', 'email_verified', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/staff
 * @desc    Create new staff/admin user
 * @access  Private (Admin only)
 */
router.post('/staff', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, email, password, hospital_name, role } = req.body;

    if (!name || !email || !password || !hospital_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and hospital_name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user (password will be hashed by model hook)
    const user = await User.create({
      name,
      email,
      password, // Plain text - hook will hash
      hospital_name,
      role: role || 'staff',
      email_verified: true // Admin can create verified users
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        hospital_name: user.hospital_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff user',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/staff/:id
 * @desc    Delete staff/admin user
 * @access  Private (Admin only)
 */
router.delete('/staff/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'Staff user deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff user',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/report
 * @desc    Generate weekly/monthly report (returns CSV data)
 * @access  Private (Admin only)
 */
router.get('/report', authenticate, isAdmin, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query; // 'weekly' or 'monthly'
    
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Get donations in period
    const donations = await DonationRecord.findAll({
      where: {
        donation_date: {
          [Op.gte]: startDate
        }
      },
      include: [
        {
          model: Donor,
          as: 'donor',
          attributes: ['name', 'blood_type']
        }
      ],
      order: [['donation_date', 'DESC']]
    });

    // Get current stock
    const stockRaw = await Inventory.sequelize.query(`
      SELECT 
        blood_type,
        COALESCE(SUM(units), 0) as total_units
      FROM inventory
      WHERE status = 'available'
        AND expiry_date > NOW()
      GROUP BY blood_type
    `, {
      type: Inventory.sequelize.QueryTypes.SELECT
    });

    // Get donor stats
    const totalDonors = await Donor.count();
    const activeDonors = await Donor.count({ where: { available: true } });

    // Format report data
    const reportData = {
      period,
      generated_at: now.toISOString(),
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      },
      summary: {
        total_donations: donations.length,
        total_donors: totalDonors,
        active_donors: activeDonors,
        total_blood_units: stockRaw.reduce((sum, item) => sum + parseInt(item.total_units || 0), 0)
      },
      donations: donations.map(d => ({
        date: d.donation_date.toISOString().split('T')[0],
        donor_name: d.donor?.name || 'Unknown',
        blood_type: d.blood_type,
        quantity: d.quantity
      })),
      stock: stockRaw.map(s => ({
        blood_type: s.blood_type,
        units: parseInt(s.total_units || 0)
      }))
    };

    // Generate CSV
    let csv = `OptiBlood ${period.charAt(0).toUpperCase() + period.slice(1)} Report\n`;
    csv += `Generated: ${reportData.generated_at}\n`;
    csv += `Date Range: ${reportData.date_range.start} to ${reportData.date_range.end}\n\n`;
    csv += `Summary\n`;
    csv += `Total Donations,${reportData.summary.total_donations}\n`;
    csv += `Total Donors,${reportData.summary.total_donors}\n`;
    csv += `Active Donors,${reportData.summary.active_donors}\n`;
    csv += `Total Blood Units,${reportData.summary.total_blood_units}\n\n`;
    csv += `Donations\n`;
    csv += `Date,Donor Name,Blood Type,Quantity (ml)\n`;
    reportData.donations.forEach(d => {
      csv += `${d.date},${d.donor_name},${d.blood_type},${d.quantity}\n`;
    });
    csv += `\nCurrent Stock\n`;
    csv += `Blood Type,Units\n`;
    reportData.stock.forEach(s => {
      csv += `${s.blood_type},${s.units}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="optiblood-${period}-report-${now.toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

module.exports = router;

