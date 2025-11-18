const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'optiblood_db',
  process.env.DB_USER || 'optiblood_user',
  process.env.DB_PASSWORD || 'optiblood_pass',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Better handling of complex types
      prependSearchPath: true
    },
    define: {
      // Ensure we use the public schema
      schema: 'public'
    }
  }
);

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Database connected successfully!');
    
    // Sync models with database
    // Options:
    // 1. alter: true - Updates existing tables (can cause errors with complex changes)
    // 2. force: true - Drops and recreates tables (DELETES ALL DATA!)
    // 3. Don't sync - Manual migrations only
    
    // ✅ RECOMMENDED: Use alter only in development, disable in production
    if (process.env.NODE_ENV === 'development') {
      try {
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized!');
      } catch (syncError) {
        console.warn('⚠️  Database sync failed (this is normal for complex schema changes)');
        console.warn('   You may need to add columns manually using SQL');
        console.log('✅ Database connection active (sync skipped)');
      }
    } else {
      // Production - don't auto-sync (use migrations instead)
      console.log('✅ Database models loaded (production mode - no auto-sync)');
    }
    
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    process.exit(1);
  }
};

// ✅ NEW: Helper function to manually sync specific models
const syncModel = async (model, options = {}) => {
  try {
    await model.sync(options);
    console.log(`✅ Model ${model.name} synchronized`);
  } catch (error) {
    console.error(`❌ Failed to sync model ${model.name}:`, error.message);
  }
};

// ✅ NEW: Force recreate all tables (DANGEROUS - deletes data)
const resetDatabase = async () => {
  try {
    console.warn('⚠️  WARNING: This will delete all data!');
    await sequelize.sync({ force: true });
    console.log('✅ Database reset complete (all tables recreated)');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
  }
};

module.exports = { 
  sequelize, 
  connectDB,
  syncModel,
  resetDatabase 
};