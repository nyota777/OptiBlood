/**
 * Quick script to verify donors table structure
 */

require('dotenv').config();
const { sequelize } = require('./config/db');
const { QueryTypes } = require('sequelize');

async function verifyTable() {
  try {
    console.log('🔍 Verifying donors table structure...\n');

    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'donors' 
      ORDER BY ordinal_position
    `, { type: QueryTypes.SELECT });

    console.log('Current columns in donors table:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    const requiredColumns = ['id', 'name', 'email', 'blood_type', 'contact', 'age', 'weight', 'available'];
    const existingColumns = columns.map(c => c.column_name);
    const missing = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missing.length > 0) {
      console.log(`\n❌ Missing columns: ${missing.join(', ')}`);
    } else {
      console.log('\n✅ All required columns exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyTable();

