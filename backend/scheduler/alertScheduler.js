const cron = require('node-cron');
const { Inventory, Alert, User } = require('../models');
const { sendLowStockAlert, sendExpiryAlert } = require('../utils/emailService');
const { Op } = require('sequelize');
require('dotenv').config();

/**
 * Check inventory for low stock and expiring items
 * Creates alerts and sends email notifications
 */
const checkInventoryAlerts = async () => {
  try {
    console.log('🔍 Running scheduled inventory check...');

    const lowThreshold = parseInt(process.env.ALERT_LOW_THRESHOLD) || 10;
    const expiryDays = parseInt(process.env.ALERT_EXPIRY_DAYS) || 3;

    // Get all hospital staff emails for notifications
    const users = await User.findAll({
      attributes: ['email', 'hospital_name']
    });
    const emailRecipients = users.map(u => u.email);

    if (emailRecipients.length === 0) {
      console.log('⚠️ No email recipients found. Skipping notifications.');
      return;
    }

    // Check for low stock
    const lowStockItems = await Inventory.findAll({
      where: {
        units: {
          [Op.lt]: lowThreshold
        },
        status: 'available'
      }
    });

    console.log(`📊 Found ${lowStockItems.length} low stock items`);

    // Create alerts and send emails for low stock
    for (const item of lowStockItems) {
      // Check if alert already exists for this item recently
      const existingAlert = await Alert.findOne({
        where: {
          type: 'low_stock',
          blood_type: item.blood_type,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (!existingAlert) {
        // Create new alert
        await Alert.create({
          type: 'low_stock',
          blood_type: item.blood_type,
          message: `Low stock alert: ${item.blood_type} has only ${item.units} units available (threshold: ${lowThreshold})`,
          notified: false
        });

        // Send email notification
        try {
          await sendLowStockAlert(emailRecipients, item.blood_type, item.units);
          console.log(`✉️ Low stock alert sent for ${item.blood_type}`);
        } catch (error) {
          console.error(`❌ Failed to send low stock email for ${item.blood_type}:`, error.message);
        }
      }
    }

    // Check for expiring items
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const expiringItems = await Inventory.findAll({
      where: {
        expiry_date: {
          [Op.lte]: expiryDate,
          [Op.gt]: new Date()
        },
        status: 'available'
      }
    });

    console.log(`⏰ Found ${expiringItems.length} items expiring soon`);

    // Create alerts and send emails for expiring items
    for (const item of expiringItems) {
      // Check if alert already exists for this item recently
      const existingAlert = await Alert.findOne({
        where: {
          type: 'expiry',
          blood_type: item.blood_type,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (!existingAlert) {
        // Create new alert
        await Alert.create({
          type: 'expiry',
          blood_type: item.blood_type,
          message: `Expiry warning: ${item.units} units of ${item.blood_type} will expire on ${item.expiry_date.toLocaleDateString()}`,
          notified: false
        });

        // Send email notification
        try {
          await sendExpiryAlert(emailRecipients, item.blood_type, item.expiry_date, item.units);
          console.log(`✉️ Expiry alert sent for ${item.blood_type}`);
        } catch (error) {
          console.error(`❌ Failed to send expiry email for ${item.blood_type}:`, error.message);
        }
      }
    }

    console.log('✅ Inventory check completed');
  } catch (error) {
    console.error('❌ Error in scheduled inventory check:', error);
  }
};

/**
 * Initialize scheduled tasks
 */
const initializeScheduler = () => {
  // Run every 6 hours by default (or use custom cron schedule from .env)
  const cronSchedule = process.env.ALERT_CRON_SCHEDULE || '0 */6 * * *';
  
  console.log(`⏰ Initializing alert scheduler with schedule: ${cronSchedule}`);
  
  cron.schedule(cronSchedule, () => {
    console.log('⏰ Scheduled task triggered');
    checkInventoryAlerts();
  });

  console.log('✅ Alert scheduler initialized');

  // Run initial check on startup (after 30 seconds)
  setTimeout(() => {
    console.log('🚀 Running initial inventory check...');
    checkInventoryAlerts();
  }, 30000);
};

module.exports = { initializeScheduler, checkInventoryAlerts };

