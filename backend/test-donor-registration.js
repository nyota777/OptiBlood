/**
 * Test Script: Donor Registration Flow
 * 
 * This script demonstrates the complete flow:
 * 1. Hospital staff login
 * 2. Register a new donor
 * 3. Verify donor was registered
 * 
 * Run with: node test-donor-registration.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test credentials (update these with your actual staff credentials)
const STAFF_EMAIL = 'staff@hospital.com';
const STAFF_PASSWORD = 'staffpassword123';

// Test donor data
const TEST_DONOR = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@test.com',
  blood_type: 'O+',
  contact: '+1234567890',
  city: 'New York'
};

async function testDonorRegistration() {
  try {
    console.log('🧪 Starting Donor Registration Test...\n');

    // Step 1: Login as hospital staff
    console.log('📝 Step 1: Logging in as hospital staff...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful!');
    console.log('   Token received:', token.substring(0, 20) + '...\n');

    // Step 2: Register a new donor
    console.log('📝 Step 2: Registering new donor...');
    console.log('   Donor data:', TEST_DONOR);
    
    const registerResponse = await axios.post(
      `${API_BASE_URL}/donors`,
      TEST_DONOR,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!registerResponse.data.success) {
      throw new Error('Donor registration failed: ' + registerResponse.data.message);
    }

    const donor = registerResponse.data.data;
    console.log('✅ Donor registered successfully!');
    console.log('   Donor ID:', donor.id);
    console.log('   Name:', donor.name);
    console.log('   Email:', donor.email);
    console.log('   Blood Type:', donor.blood_type);
    console.log('   Available:', donor.available);
    console.log('   Total Donations:', donor.total_donations);
    console.log('   Total Donated (ml):', donor.total_donated_ml);
    console.log('');

    // Step 3: Verify donor was added
    console.log('📝 Step 3: Verifying donor in database...');
    const verifyResponse = await axios.get(
      `${API_BASE_URL}/donors`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const donors = verifyResponse.data.data;
    const foundDonor = donors.find(d => d.email === TEST_DONOR.email);

    if (foundDonor) {
      console.log('✅ Donor found in database!');
      console.log('   Total donors in system:', donors.length);
      console.log('   Found donor:', foundDonor.name);
    } else {
      console.log('⚠️  Donor not found in database');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      // Server responded with error
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message || error.response.data.error);
      console.error('   Full error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Request made but no response
      console.error('   No response from server');
      console.error('   Make sure backend is running on http://localhost:5001');
    } else {
      // Error setting up request
      console.error('   Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDonorRegistration();
}

module.exports = { testDonorRegistration };





