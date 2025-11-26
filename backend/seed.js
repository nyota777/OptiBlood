/**
 * Database Seeder - Populate with sample data for testing
 * Run: node seed.js
 */

require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
const { User, Donor, DonationRecord, Inventory } = require('./models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED');
    await DonationRecord.destroy({ where: {}, force: true });
    await Inventory.destroy({ where: {}, force: true });
    await Donor.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create sample users
    console.log('👥 Creating sample users...');
    const users = await User.bulkCreate([
      {
        name: 'Dr. John Smith',
        email: 'john.smith@hospital.com',
        password: 'password123',
        hospital_name: 'City General Hospital',
        role: 'admin'
      },
      {
        name: 'Nurse Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        password: 'password123',
        hospital_name: 'City General Hospital',
        role: 'staff'
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@medical.com',
        password: 'password123',
        hospital_name: 'Central Medical Center',
        role: 'admin'
      }
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Create sample donors
    console.log('🩸 Creating sample donors...');
    const donors = await Donor.bulkCreate([
      { name: 'Alice Williams', blood_type: 'A+', contact: '555-0101', total_donations: 5, available: true },
      { name: 'Bob Martinez', blood_type: 'O+', contact: '555-0102', total_donations: 3, available: true },
      { name: 'Carol Davis', blood_type: 'B+', contact: '555-0103', total_donations: 7, available: true },
      { name: 'David Brown', blood_type: 'AB+', contact: '555-0104', total_donations: 2, available: true },
      { name: 'Emma Wilson', blood_type: 'A-', contact: '555-0105', total_donations: 4, available: true },
      { name: 'Frank Taylor', blood_type: 'O-', contact: '555-0106', total_donations: 6, available: true },
      { name: 'Grace Lee', blood_type: 'B-', contact: '555-0107', total_donations: 3, available: true },
      { name: 'Henry Garcia', blood_type: 'AB-', contact: '555-0108', total_donations: 2, available: false },
      { name: 'Ivy Rodriguez', blood_type: 'A+', contact: '555-0109', total_donations: 8, available: true },
      { name: 'Jack Anderson', blood_type: 'O+', contact: '555-0110', total_donations: 5, available: true },
      { name: 'Karen Thomas', blood_type: 'B+', contact: '555-0111', total_donations: 4, available: true },
      { name: 'Leo Martinez', blood_type: 'A-', contact: '555-0112', total_donations: 3, available: true },
      { name: 'Maria Lopez', blood_type: 'O-', contact: '555-0113', total_donations: 9, available: true },
      { name: 'Nathan White', blood_type: 'AB+', contact: '555-0114', total_donations: 2, available: true },
      { name: 'Olivia Harris', blood_type: 'B-', contact: '555-0115', total_donations: 5, available: true }
    ]);
    console.log(`✅ Created ${donors.length} donors`);

    // Create sample donation records
    console.log('📝 Creating donation records...');
    const donationRecords = [];
    for (let i = 0; i < 20; i++) {
      const randomDonor = donors[Math.floor(Math.random() * donors.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
      
      donationRecords.push({
        donor_id: randomDonor.id,
        hospital_id: randomUser.id,
        blood_type: randomDonor.blood_type,
        quantity: 450, // Standard donation unit
        donation_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    }
    await DonationRecord.bulkCreate(donationRecords);
    console.log(`✅ Created ${donationRecords.length} donation records`);

    // Create sample inventory
    console.log('📦 Creating inventory...');
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventoryItems = [];
    
    for (const user of users) {
      for (const bloodType of bloodTypes) {
        // Create 2-3 inventory entries per blood type per hospital
        const numEntries = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < numEntries; i++) {
          const units = Math.floor(Math.random() * 30) + 1; // 1-30 units
          const collectionDaysAgo = Math.floor(Math.random() * 20); // 0-20 days ago
          const expiryDaysAhead = 35 - collectionDaysAgo + Math.floor(Math.random() * 5); // ~35 days from collection
          
          const collectionDate = new Date(Date.now() - collectionDaysAgo * 24 * 60 * 60 * 1000);
          const expiryDate = new Date(collectionDate.getTime() + expiryDaysAhead * 24 * 60 * 60 * 1000);
          
          // Some items should trigger low stock alerts (< 10 units)
          const adjustedUnits = Math.random() > 0.7 ? Math.floor(Math.random() * 8) + 1 : units;
          
          inventoryItems.push({
            hospital_id: user.id,
            blood_type: bloodType,
            units: adjustedUnits,
            status: expiryDate < new Date() ? 'expired' : 'available',
            expiry_date: expiryDate,
            collection_date: collectionDate
          });
        }
      }
    }
    
    await Inventory.bulkCreate(inventoryItems);
    console.log(`✅ Created ${inventoryItems.length} inventory items`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database seeding completed successfully!');
    console.log('='.repeat(50));
    console.log(`👥 Users: ${users.length}`);
    console.log(`🩸 Donors: ${donors.length}`);
    console.log(`📝 Donation Records: ${donationRecords.length}`);
    console.log(`📦 Inventory Items: ${inventoryItems.length}`);
    console.log('='.repeat(50));
    console.log('\n📋 Test Credentials:');
    console.log('Email: john.smith@hospital.com');
    console.log('Password: password123');
    console.log('\nEmail: sarah.johnson@hospital.com');
    console.log('Password: password123');
    console.log('\nEmail: michael.chen@medical.com');
    console.log('Password: password123');
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();

