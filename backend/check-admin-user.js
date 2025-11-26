/**
 * Check Admin User Script
 * Verifies admin user exists and can login
 * Run: node check-admin-user.js
 */

require('dotenv').config();
const { connectDB } = require('./config/db');
const { User } = require('./models');
const bcrypt = require('bcrypt');

const checkAdminUser = async () => {
  try {
    console.log('🔍 Checking admin user...');

    // Connect to database
    await connectDB();

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin1234';

    // Find admin user
    const adminUser = await User.findOne({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('   Creating admin user...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        hospital_name: 'OptiBlood System',
        role: 'admin',
        email_verified: true
      });
      
      console.log('✅ Admin user created!');
      console.log(`   ID: ${newAdmin.id}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   Email Verified: ${newAdmin.email_verified}`);
    } else {
      console.log('✅ Admin user found!');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Email Verified: ${adminUser.email_verified}`);
      console.log(`   Has Password: ${!!adminUser.password}`);
      console.log(`   OAuth Provider: ${adminUser.oauth_provider || 'None'}`);
      
      // Test password
      if (adminUser.password) {
        const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
        console.log(`   Password Match: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
        
        if (!isPasswordValid) {
          console.log('\n⚠️  Password mismatch! Updating password...');
          // Set as plain text - the beforeUpdate hook will hash it
          adminUser.password = adminPassword;
          await adminUser.save();
          console.log('✅ Password updated!');
        }
      } else {
        console.log('\n⚠️  No password set! Setting password...');
        // Set as plain text - the beforeUpdate hook will hash it
        adminUser.password = adminPassword;
        await adminUser.save();
        console.log('✅ Password set!');
      }
      
      // Ensure email is verified
      if (!adminUser.email_verified) {
        console.log('\n⚠️  Email not verified! Verifying...');
        adminUser.email_verified = true;
        await adminUser.save();
        console.log('✅ Email verified!');
      }
      
      // Ensure role is admin
      if (adminUser.role !== 'admin') {
        console.log('\n⚠️  Role is not admin! Updating...');
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ Role updated to admin!');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 Admin Credentials:');
    console.log('='.repeat(50));
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run script
checkAdminUser();

