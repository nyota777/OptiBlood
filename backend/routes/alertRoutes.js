const express = require('express');
const router = express.Router();
const { Alert } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/alerts
 * @desc    Fetch active alerts
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, blood_type, notified } = req.query;
    
    // Build filter object
    const where = {};
    if (type) where.type = type;
    if (blood_type) where.blood_type = blood_type;
    if (notified !== undefined) where.notified = notified === 'true';

    const alerts = await Alert.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/alerts
 * @desc    Manually create alert
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, blood_type, message } = req.body;

    // Validate input
    if (!type || !blood_type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: type, blood_type, message'
      });
    }

    const alert = await Alert.create({
      type,
      blood_type,
      message,
      notified: false
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/alerts/:id
 * @desc    Mark alert as notified
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.notified = true;
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert marked as notified',
      data: alert
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete alert
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await alert.destroy();

    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message
    });
  }
});

module.exports = router;

