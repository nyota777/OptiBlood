/**
 * Create Admin User Script
 * Creates an admin user with email: admin@gmail.com, password: admin1234
 * Run: node create-admin-user.js
 */

require('dotenv').config();
const { connectDB } = require('./config/db');
const { User } = require('./models');
const bcrypt = require('bcrypt');

const createAdminUser = async () => {
  try {
    console.log('👤 Creating admin user...');

    // Connect to database
    await connectDB();

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin1234';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      // Update existing admin user
      // Set password as plain text - the beforeUpdate hook will hash it
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'admin';
      existingAdmin.name = 'System Administrator';
      existingAdmin.hospital_name = 'OptiBlood System';
      existingAdmin.email_verified = true;
      await existingAdmin.save();
      console.log('✅ Updated existing admin user');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      // Create new admin user
      // Set password as plain text - the beforeCreate hook will hash it
      const adminUser = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword, // Plain text - hook will hash
        hospital_name: 'OptiBlood System',
        role: 'admin',
        email_verified: true
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   User ID: ${adminUser.id}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 Admin Credentials:');
    console.log('='.repeat(50));
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('='.repeat(50));
    console.log('\n✅ You can now login with these credentials');
    console.log('   The admin will be redirected to the Admin Dashboard');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
};

// Run script
createAdminUser();

