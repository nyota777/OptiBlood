/**
 * Script to fix the donors table schema
 * This adds missing columns (email, age, weight) to match the model
 * 
 * Run with: node fix-donors-table.js
 */

require('dotenv').config();
const { sequelize } = require('./config/db');
const { QueryTypes } = require('sequelize');

async function fixDonorsTable() {
  try {
    console.log('🔧 Fixing donors table schema...\n');

    // Check current table structure
    const tableInfo = await sequelize.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'donors' 
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );

    console.log('Current columns:', tableInfo.map(col => col.column_name).join(', '));
    console.log('');

    // Add email column if it doesn't exist
    const hasEmail = tableInfo.some(col => col.column_name === 'email');
    if (!hasEmail) {
      console.log('➕ Adding email column...');
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN email VARCHAR(255)
      `);
      console.log('✅ Email column added');
    } else {
      console.log('✅ Email column already exists');
    }

    // Add age column if it doesn't exist
    const hasAge = tableInfo.some(col => col.column_name === 'age');
    if (!hasAge) {
      console.log('➕ Adding age column...');
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN age INTEGER
      `);
      console.log('✅ Age column added');
    } else {
      console.log('✅ Age column already exists');
    }

    // Add weight column if it doesn't exist
    const hasWeight = tableInfo.some(col => col.column_name === 'weight');
    if (!hasWeight) {
      console.log('➕ Adding weight column...');
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN weight INTEGER
      `);
      console.log('✅ Weight column added');
    } else {
      console.log('✅ Weight column already exists');
    }

    // Check for unique constraint on email
    const constraints = await sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'donors' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%email%'
    `, { type: QueryTypes.SELECT });

    if (constraints.length === 0) {
      console.log('➕ Adding unique constraint on email...');
      // Check if there are any NULL or duplicate emails
      const duplicateCheck = await sequelize.query(`
        SELECT COUNT(*) as count, COUNT(DISTINCT email) as distinct_count
        FROM donors
        WHERE email IS NOT NULL
      `, { type: QueryTypes.SELECT });

      if (duplicateCheck[0].count !== duplicateCheck[0].distinct_count) {
        console.warn('⚠️  Warning: Duplicate emails found. Please fix them before adding unique constraint.');
      } else {
        await sequelize.query(`
          ALTER TABLE donors 
          ADD CONSTRAINT Donors_email_key UNIQUE (email)
        `);
        console.log('✅ Unique constraint on email added');
      }
    } else {
      console.log('✅ Unique constraint on email already exists');
    }

    // Make email NOT NULL if there are no NULL values
    const nullCheck = await sequelize.query(`
      SELECT COUNT(*) as null_count 
      FROM donors 
      WHERE email IS NULL
    `, { type: QueryTypes.SELECT });

    if (nullCheck[0].null_count === 0) {
      try {
        await sequelize.query(`
          ALTER TABLE donors 
          ALTER COLUMN email SET NOT NULL
        `);
        console.log('✅ Email column set to NOT NULL');
      } catch (err) {
        console.log('ℹ️  Email column constraint already set');
      }
    } else {
      console.warn(`⚠️  Warning: ${nullCheck[0].null_count} donors have NULL emails. Update them before making email NOT NULL.`);
    }

    console.log('\n✅ Donors table schema fixed successfully!');
    console.log('   You can now restart the server.\n');

  } catch (error) {
    console.error('❌ Error fixing donors table:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the fix
fixDonorsTable();

