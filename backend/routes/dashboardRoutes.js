const express = require('express');
const router = express.Router();
const { Donor, Inventory, DonationRecord, Alert, DonationSchedule } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const hospital_id = req.user.id;

    // Get total donors
    const totalDonors = await Donor.count();

    // Get total blood units available
    const inventory = await Inventory.findAll({
      where: {
        hospital_id,
        status: 'available',
        expiry_date: {
          [Op.gt]: new Date()
        }
      }
    });
    const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);

    // Get donations this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const donationsThisMonth = await DonationRecord.count({
      where: {
        hospital_id,
        donation_date: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Get shortage alerts (alerts are global, not per-hospital)
    // Filter by type='shortage' and unread status
    const shortageAlerts = await Alert.count({
      where: {
        type: 'shortage',
        notified: false
      }
    });

    // Get blood inventory by type - use raw query for better compatibility
    const bloodInventoryRaw = await Inventory.sequelize.query(`
      SELECT 
        blood_type,
        COALESCE(SUM(units), 0) as total_units
      FROM inventory
      WHERE hospital_id = :hospital_id
        AND status = 'available'
        AND expiry_date > NOW()
      GROUP BY blood_type
    `, {
      replacements: { hospital_id },
      type: Inventory.sequelize.QueryTypes.SELECT
    });

    // Ensure all blood types are represented (even with 0 units)
    const allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodInventoryMap = new Map(bloodInventoryRaw.map((item) => [item.blood_type, parseInt(item.total_units) || 0]));
    
    const bloodInventory = allBloodTypes.map(type => ({
      blood_type: type,
      total_units: bloodInventoryMap.get(type) || 0
    }));

    // Get critical blood types (less than 10 units)
    const criticalBloodTypes = [];
    const lowBloodTypes = [];
    const safeBloodTypes = [];

    for (const item of bloodInventory) {
      const units = item.total_units;
      if (units < 5) {
        criticalBloodTypes.push(item.blood_type);
      } else if (units < 10) {
        lowBloodTypes.push(item.blood_type);
      } else {
        safeBloodTypes.push(item.blood_type);
      }
    }

    // Get recent donations (last 5)
    const recentDonations = await DonationRecord.findAll({
      where: { hospital_id },
      include: [
        {
          model: Donor,
          as: 'donor',
          attributes: ['id', 'name', 'blood_type']
        }
      ],
      order: [['donation_date', 'DESC']],
      limit: 5
    });

    // Get upcoming appointments (next 5)
    const upcomingAppointments = await DonationSchedule.findAll({
      where: {
        hospital_id,
        status: 'scheduled',
        scheduled_date: {
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: Donor,
          as: 'donor',
          attributes: ['id', 'name', 'blood_type', 'email']
        }
      ],
      order: [['scheduled_date', 'ASC'], ['scheduled_time', 'ASC']],
      limit: 5
    });

    // Get donation trends (last 6 months) - use raw query for better compatibility
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const donationTrendsRaw = await DonationRecord.sequelize.query(`
      SELECT 
        DATE_TRUNC('month', donation_date) as month,
        COUNT(*) as donations
      FROM donation_records
      WHERE hospital_id = :hospital_id
        AND donation_date >= :sixMonthsAgo
      GROUP BY DATE_TRUNC('month', donation_date)
      ORDER BY month ASC
    `, {
      replacements: { hospital_id, sixMonthsAgo },
      type: DonationRecord.sequelize.QueryTypes.SELECT
    });

    // Generate last 6 months with data (fill missing months with 0)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      months.push(date);
    }

    const trendsMap = new Map(
      donationTrendsRaw.map((item) => [
        new Date(item.month).toISOString().split('T')[0].substring(0, 7),
        parseInt(item.donations) || 0
      ])
    );

    const donationTrends = months.map(date => {
      const monthKey = date.toISOString().split('T')[0].substring(0, 7);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        donations: trendsMap.get(monthKey) || 0
      };
    });

    // For usage trends, we'll use a simplified approach based on inventory changes
    // In a real system, you'd track withdrawals separately
    const usageTrends = donationTrends.map(t => ({
      month: t.month,
      usage: Math.max(0, t.donations - 2) // Simplified: assume some usage
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDonors,
          totalUnits,
          donationsThisMonth,
          shortageAlerts
        },
        bloodInventory: bloodInventory.map(item => ({
          type: item.blood_type,
          units: item.total_units,
          status: criticalBloodTypes.includes(item.blood_type) ? 'critical' :
                  lowBloodTypes.includes(item.blood_type) ? 'low' : 'safe'
        })),
        criticalBloodTypes,
        recentDonations: recentDonations.map(d => ({
          id: d.id,
          name: d.donor?.name || 'Unknown',
          type: d.blood_type,
          date: d.donation_date.toISOString().split('T')[0],
          time: d.donation_date.toTimeString().split(' ')[0].substring(0, 5)
        })),
        upcomingAppointments: upcomingAppointments.map(a => ({
          id: a.id,
          name: a.donor?.name || 'Unknown',
          type: a.donor?.blood_type || 'Unknown',
          date: a.scheduled_date.toISOString().split('T')[0],
          time: a.scheduled_time || '09:00'
        })),
        trends: {
          donations: donationTrends,
          usage: usageTrends
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;

