/**
 * Script to clear all inventory data from the database
 * Run with: node clear-inventory.js
 * 
 * WARNING: This will delete ALL inventory records!
 */

require('dotenv').config();
const { sequelize } = require('./config/db');
const { Inventory } = require('./models');

async function clearInventory() {
  try {
    console.log('🗑️  Clearing all inventory data...\n');

    // Count current records
    const count = await Inventory.count();
    console.log(`   Found ${count} inventory record(s) to delete\n`);

    if (count === 0) {
      console.log('✅ Inventory table is already empty!\n');
      await sequelize.close();
      process.exit(0);
      return;
    }

    // Delete all inventory records
    await Inventory.destroy({
      where: {},
      truncate: true // Faster than delete for clearing all records
    });

    console.log(`✅ Successfully cleared ${count} inventory record(s)!`);
    console.log('   Your inventory is now empty and ready for real-time data.\n');

  } catch (error) {
    console.error('❌ Error clearing inventory:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Confirm before clearing
console.log('⚠️  WARNING: This will delete ALL inventory records!');
console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  clearInventory();
}, 3000);

