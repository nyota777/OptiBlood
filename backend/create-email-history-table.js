/**
 * Script to create email_history table
 * Run with: node create-email-history-table.js
 */

require('dotenv').config();
const { sequelize } = require('./config/db');
const EmailHistory = require('./models/EmailHistory');

async function createEmailHistoryTable() {
  try {
    console.log('🔧 Creating email_history table...\n');

    // Sync the EmailHistory model
    await EmailHistory.sync({ alter: true });
    
    console.log('✅ Email history table created/verified successfully!');
    console.log('   You can now restart the server.\n');

  } catch (error) {
    console.error('❌ Error creating email_history table:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createEmailHistoryTable();

