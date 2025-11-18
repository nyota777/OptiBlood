const express = require('express');
const router = express.Router();
const { DonationSchedule, Donor, User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

/**
 * @route   GET /api/schedules
 * @desc    Get donation schedules
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, start_date, end_date, donor_id } = req.query;
    const hospital_id = req.user.id;

    const where = { hospital_id };
    if (status) where.status = status;
    if (donor_id) where.donor_id = donor_id;
    if (start_date || end_date) {
      where.scheduled_date = {};
      if (start_date) where.scheduled_date[Op.gte] = new Date(start_date);
      if (end_date) where.scheduled_date[Op.lte] = new Date(end_date);
    }

    const schedules = await DonationSchedule.findAll({
      where,
      include: [
        {
          model: Donor,
          as: 'donor',
          attributes: ['id', 'name', 'blood_type', 'email', 'contact']
        }
      ],
      order: [['scheduled_date', 'ASC'], ['scheduled_time', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/schedules
 * @desc    Schedule a donation appointment
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { donor_id, scheduled_date, scheduled_time, notes } = req.body;
    const hospital_id = req.user.id;

    // Validate input
    if (!donor_id || !scheduled_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide donor_id and scheduled_date'
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

    // Check if donor is eligible (3 days since last donation - reduced for testing)
    if (donor.last_donation_date) {
      const daysSinceDonation = Math.floor(
        (new Date() - new Date(donor.last_donation_date)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDonation < 3) {
        return res.status(400).json({
          success: false,
          message: `Donor is not eligible yet. Next eligible date: ${new Date(new Date(donor.last_donation_date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
        });
      }
    }

    // Create schedule
    const schedule = await DonationSchedule.create({
      donor_id,
      hospital_id,
      scheduled_date: new Date(scheduled_date),
      scheduled_time: scheduled_time || null,
      notes: notes || null,
      status: 'scheduled'
    });

    // Fetch with donor details
    const scheduleWithDonor = await DonationSchedule.findByPk(schedule.id, {
      include: [
        {
          model: Donor,
          as: 'donor',
          attributes: ['id', 'name', 'blood_type', 'email', 'contact']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Donation scheduled successfully',
      data: scheduleWithDonor
    });
  } catch (error) {
    console.error('Error scheduling donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule donation',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/schedules/:id
 * @desc    Update donation schedule
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_date, scheduled_time, status, notes } = req.body;
    const hospital_id = req.user.id;

    const schedule = await DonationSchedule.findOne({
      where: { id, hospital_id }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (scheduled_date) schedule.scheduled_date = new Date(scheduled_date);
    if (scheduled_time !== undefined) schedule.scheduled_time = scheduled_time;
    if (status) schedule.status = status;
    if (notes !== undefined) schedule.notes = notes;

    await schedule.save();

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Cancel/delete donation schedule
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const hospital_id = req.user.id;

    const schedule = await DonationSchedule.findOne({
      where: { id, hospital_id }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    await schedule.destroy();

    res.status(200).json({
      success: true,
      message: 'Schedule cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel schedule',
      error: error.message
    });
  }
});

module.exports = router;

