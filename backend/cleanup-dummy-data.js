/**
 * Cleanup Script - Remove Dummy Data
 * This script removes all dummy/test data from the database
 * Run: node cleanup-dummy-data.js
 */

require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
const { User, Donor, DonationRecord, Inventory } = require('./models');

const cleanupDummyData = async () => {
  try {
    console.log('🧹 Starting cleanup of dummy data...');

    // Connect to database
    await connectDB();

    // List of dummy user emails to remove
    const dummyUserEmails = [
      'john.smith@hospital.com',
      'sarah.johnson@hospital.com',
      'michael.chen@medical.com'
    ];

    // Find and delete dummy users
    console.log('👥 Removing dummy users...');
    const dummyUsers = await User.findAll({
      where: {
        email: {
          [require('sequelize').Op.in]: dummyUserEmails
        }
      }
    });

    if (dummyUsers.length > 0) {
      // Get user IDs
      const userIds = dummyUsers.map(u => u.id);
      
      // Delete related data first (to avoid foreign key constraints)
      console.log('   Deleting related inventory...');
      await Inventory.destroy({
        where: {
          hospital_id: {
            [require('sequelize').Op.in]: userIds
          }
        }
      });

      console.log('   Deleting related donation records...');
      await DonationRecord.destroy({
        where: {
          hospital_id: {
            [require('sequelize').Op.in]: userIds
          }
        }
      });

      // Delete the users
      await User.destroy({
        where: {
          id: {
            [require('sequelize').Op.in]: userIds
          }
        }
      });

      console.log(`✅ Removed ${dummyUsers.length} dummy users and their related data`);
    } else {
      console.log('ℹ️  No dummy users found to remove');
    }

    // Also remove any donors with test/dummy emails
    console.log('🩸 Checking for dummy donors...');
    const dummyDonorEmails = [
      '%@test.com',
      '%@example.com',
      '%@dummy.com',
      '%@walkin.optiblood.com'
    ];

    // Note: This is a simple check - you may want to be more specific
    const testDonors = await Donor.findAll({
      where: {
        email: {
          [require('sequelize').Op.like]: '%@test.com'
        }
      }
    });

    if (testDonors.length > 0) {
      const donorIds = testDonors.map(d => d.id);
      
      // Delete related donation records
      await DonationRecord.destroy({
        where: {
          donor_id: {
            [require('sequelize').Op.in]: donorIds
          }
        }
      });

      // Delete donors
      await Donor.destroy({
        where: {
          id: {
            [require('sequelize').Op.in]: donorIds
          }
        }
      });

      console.log(`✅ Removed ${testDonors.length} test donors`);
    } else {
      console.log('ℹ️  No test donors found to remove');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Cleanup completed successfully!');
    console.log('='.repeat(50));
    console.log('📋 Summary:');
    console.log(`   - Removed ${dummyUsers.length} dummy users`);
    console.log(`   - Removed ${testDonors.length} test donors`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

// Run cleanup
cleanupDummyData();

