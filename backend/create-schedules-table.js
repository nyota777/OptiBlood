/**
 * Script to create donation_schedules table
 * Run with: node create-schedules-table.js
 */

require('dotenv').config();
const { sequelize } = require('./config/db');
const DonationSchedule = require('./models/DonationSchedule');

async function createSchedulesTable() {
  try {
    console.log('🔧 Creating donation_schedules table...\n');

    // Sync the DonationSchedule model
    await DonationSchedule.sync({ alter: true });
    
    console.log('✅ Donation schedules table created/verified successfully!');
    console.log('   You can now restart the server.\n');

  } catch (error) {
    console.error('❌ Error creating donation_schedules table:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createSchedulesTable();

