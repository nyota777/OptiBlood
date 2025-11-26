const express = require('express');
const router = express.Router();
const { Donor } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/donors
 * @desc    Fetch all donors
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { blood_type, available } = req.query;
    
    // Build filter object
    const where = {};
    if (blood_type) where.blood_type = blood_type;
    if (available !== undefined) where.available = available === 'true';

    const donors = await Donor.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: donors.length,
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
 * @route   POST /api/donors
 * @desc    Add new donor
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, blood_type, contact, city, age, weight, status, gender } = req.body;

    // Validate input
    if (!name || !email || !blood_type || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, blood_type, contact'
      });
    }

    // Check if email already exists
    const existingDonor = await Donor.findOne({ where: { email } });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: 'Donor with this email already exists'
      });
    }

    // Map status to available boolean
    // 'active' -> true, 'inactive' or 'deferred' -> false
    // Handle case-insensitive status values
    const statusLower = status ? status.toLowerCase() : 'active';
    const available = statusLower === 'active';

          const donor = await Donor.create({
            name,
            email,
            blood_type,
            contact,
            city: city || null,
            age: age || null,
            weight: weight || null,
            gender: gender || null,
            last_donation_date: null,
            total_donations: 0,
            total_donated_ml: 0,
            available
          });

    res.status(201).json({
      success: true,
      message: 'Donor added successfully',
      data: donor
    });
  } catch (error) {
    console.error('Error creating donor:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Donor with this email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`,
        errors: error.errors
      });
    }

    // Handle database connection errors
    if (error.name === 'SequelizeConnectionError') {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please check database configuration.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add donor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/donors/:id
 * @desc    Update donor information
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, blood_type, contact, city, available, status, age, weight, gender } = req.body;

    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== donor.email) {
      const existingDonor = await Donor.findOne({ where: { email } });
      if (existingDonor) {
        return res.status(400).json({
          success: false,
          message: 'Donor with this email already exists'
        });
      }
    }

    // Update fields
    if (name) donor.name = name;
    if (email) donor.email = email;
    if (blood_type) donor.blood_type = blood_type;
    if (contact) donor.contact = contact;
    if (city !== undefined) donor.city = city;
    if (age !== undefined) donor.age = age;
    if (weight !== undefined) donor.weight = weight;
    if (gender !== undefined) donor.gender = gender;
    // Handle both status (string) and available (boolean) for backward compatibility
    if (status !== undefined) {
      donor.available = status === 'active';
    } else if (available !== undefined) {
      donor.available = available;
    }

    await donor.save();

    res.status(200).json({
      success: true,
      message: 'Donor updated successfully',
      data: donor
    });
  } catch (error) {
    console.error('Error updating donor:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Donor with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update donor',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/donors/:id
 * @desc    Remove donor
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    await donor.destroy();

    res.status(200).json({
      success: true,
      message: 'Donor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete donor',
      error: error.message
    });
  }
});

module.exports = router;

