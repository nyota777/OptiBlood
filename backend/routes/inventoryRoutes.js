const express = require('express');
const router = express.Router();
const { Inventory, User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

/**
 * @route   GET /api/inventory
 * @desc    Get inventory by blood type or hospital
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { blood_type, status, hospital_id } = req.query;
    
    // Build filter object
    const where = {};
    if (blood_type) where.blood_type = blood_type;
    if (status) where.status = status;
    if (hospital_id) where.hospital_id = hospital_id;

    const inventory = await Inventory.findAll({
      where,
      include: [
        {
          model: User,
          as: 'hospital',
          attributes: ['id', 'hospital_name']
        }
      ],
      order: [['expiry_date', 'ASC']]
    });

    // Calculate totals by blood type
    const summary = {};
    inventory.forEach(item => {
      if (!summary[item.blood_type]) {
        summary[item.blood_type] = {
          blood_type: item.blood_type,
          total_units: 0,
          available_units: 0,
          reserved_units: 0,
          expired_units: 0
        };
      }
      
      summary[item.blood_type].total_units += item.units;
      
      if (item.status === 'available') {
        summary[item.blood_type].available_units += item.units;
      } else if (item.status === 'reserved') {
        summary[item.blood_type].reserved_units += item.units;
      } else if (item.status === 'expired') {
        summary[item.blood_type].expired_units += item.units;
      }
    });

    res.status(200).json({
      success: true,
      count: inventory.length,
      summary: Object.values(summary),
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/inventory
 * @desc    Add or update inventory
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { blood_type, units, expiry_date, collection_date } = req.body;
    const hospital_id = req.user.id;

    // Validate input
    if (!blood_type || !units || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: blood_type, units, expiry_date'
      });
    }

    const inventory = await Inventory.create({
      hospital_id,
      blood_type,
      units,
      status: 'available',
      expiry_date: new Date(expiry_date),
      collection_date: collection_date ? new Date(collection_date) : new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Inventory added successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add inventory',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory entry
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { units, status } = req.body;

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory entry not found'
      });
    }

    // Update fields
    if (units !== undefined) inventory.units = units;
    if (status) inventory.status = status;

    await inventory.save();

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/inventory/withdraw
 * @desc    Withdraw/subtract blood units from inventory
 * @access  Private
 */
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { blood_type, units, reason } = req.body;
    const hospital_id = req.user.id;

    // Validate input
    if (!blood_type || !units || units <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide blood_type and units (must be greater than 0)'
      });
    }

    // Find all available inventory entries for this blood type
    const inventoryEntries = await Inventory.findAll({
      where: {
        hospital_id,
        blood_type,
        status: 'available'
      },
      order: [['expiry_date', 'ASC']] // Use oldest first (FIFO)
    });

    // Calculate total available units
    const totalAvailable = inventoryEntries.reduce((sum, entry) => sum + entry.units, 0);

    if (totalAvailable < units) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${totalAvailable} units, Requested: ${units} units`
      });
    }

    // Withdraw units (FIFO - First In First Out)
    let remainingToWithdraw = units;
    const updatedEntries = [];
    const deletedEntries = [];

    for (const entry of inventoryEntries) {
      if (remainingToWithdraw <= 0) break;

      if (entry.units <= remainingToWithdraw) {
        // This entry will be fully consumed
        remainingToWithdraw -= entry.units;
        deletedEntries.push(entry);
      } else {
        // Partially consume this entry
        entry.units -= remainingToWithdraw;
        await entry.save();
        updatedEntries.push(entry);
        remainingToWithdraw = 0;
      }
    }

    // Delete fully consumed entries
    for (const entry of deletedEntries) {
      await entry.destroy();
    }

    res.status(200).json({
      success: true,
      message: `Successfully withdrew ${units} units of ${blood_type}`,
      data: {
        blood_type,
        units_withdrawn: units,
        reason: reason || 'Hospital usage',
        remaining_available: totalAvailable - units
      }
    });
  } catch (error) {
    console.error('Error withdrawing inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw inventory',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete inventory entry
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory entry not found'
      });
    }

    await inventory.destroy();

    res.status(200).json({
      success: true,
      message: 'Inventory deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory',
      error: error.message
    });
  }
});

module.exports = router;

