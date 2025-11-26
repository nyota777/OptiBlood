const { sequelize } = require('./config/db');
const { connectDB } = require('./config/db');

async function addGenderColumn() {
  try {
    await connectDB();
    console.log('🔧 Adding gender column to donors table...\n');

    // Add gender column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE donors 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other'))
    `);

    console.log('✅ Gender column added successfully!');
    console.log('   You can now update donor records with gender information.\n');
  } catch (error) {
    console.error('❌ Error adding gender column:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addGenderColumn();

