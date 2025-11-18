/**
 * Direct SQL script to add missing columns to donors table
 * This will work even if Sequelize sync fails
 */

require('dotenv').config();
const { sequelize } = require('./config/db');
const { QueryTypes } = require('sequelize');

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to donors table...\n');

    // Add email column
    try {
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN IF NOT EXISTS email VARCHAR(255)
      `, { type: QueryTypes.RAW });
      console.log('✅ Email column added/verified');
    } catch (err) {
      console.log('ℹ️  Email column:', err.message.includes('already exists') ? 'already exists' : err.message);
    }

    // Add age column
    try {
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN IF NOT EXISTS age INTEGER
      `, { type: QueryTypes.RAW });
      console.log('✅ Age column added/verified');
    } catch (err) {
      console.log('ℹ️  Age column:', err.message.includes('already exists') ? 'already exists' : err.message);
    }

    // Add weight column
    try {
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN IF NOT EXISTS weight INTEGER
      `, { type: QueryTypes.RAW });
      console.log('✅ Weight column added/verified');
    } catch (err) {
      console.log('ℹ️  Weight column:', err.message.includes('already exists') ? 'already exists' : err.message);
    }

    // Add city column if missing (used in model)
    try {
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN IF NOT EXISTS city VARCHAR(100)
      `, { type: QueryTypes.RAW });
      console.log('✅ City column added/verified');
    } catch (err) {
      console.log('ℹ️  City column:', err.message.includes('already exists') ? 'already exists' : err.message);
    }

    // Add total_donated_ml if missing
    try {
      await sequelize.query(`
        ALTER TABLE donors 
        ADD COLUMN IF NOT EXISTS total_donated_ml INTEGER DEFAULT 0
      `, { type: QueryTypes.RAW });
      console.log('✅ total_donated_ml column added/verified');
    } catch (err) {
      console.log('ℹ️  total_donated_ml column:', err.message.includes('already exists') ? 'already exists' : err.message);
    }

    // Try to add unique constraint on email (only if no duplicates)
    try {
      // First check for duplicates
      const duplicateCheck = await sequelize.query(`
        SELECT COUNT(*) as total, COUNT(DISTINCT email) as distinct_emails
        FROM donors
        WHERE email IS NOT NULL
      `, { type: QueryTypes.SELECT });

      if (duplicateCheck[0].total === duplicateCheck[0].distinct_emails || duplicateCheck[0].total === 0) {
        // No duplicates, safe to add constraint
        await sequelize.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'Donors_email_key'
            ) THEN
              ALTER TABLE donors ADD CONSTRAINT Donors_email_key UNIQUE (email);
            END IF;
          END $$;
        `, { type: QueryTypes.RAW });
        console.log('✅ Unique constraint on email added/verified');
      } else {
        console.log('⚠️  Duplicate emails found, skipping unique constraint');
      }
    } catch (err) {
      console.log('ℹ️  Unique constraint:', err.message);
    }

    // Verify columns now exist
    console.log('\n🔍 Verifying columns...');
    const columns = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'donors' 
      ORDER BY ordinal_position
    `, { type: QueryTypes.SELECT });

    console.log('\nCurrent columns in donors table:');
    columns.forEach(col => {
      console.log(`  ✓ ${col.column_name}`);
    });

    const required = ['id', 'name', 'email', 'blood_type', 'contact', 'age', 'weight', 'available'];
    const existing = columns.map(c => c.column_name);
    const missing = required.filter(col => !existing.includes(col));

    if (missing.length === 0) {
      console.log('\n✅ All required columns exist!');
      console.log('   Please restart your backend server for changes to take effect.\n');
    } else {
      console.log(`\n❌ Still missing: ${missing.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addMissingColumns();

