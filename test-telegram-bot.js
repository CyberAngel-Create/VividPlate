// Test script for Telegram bot password reset functionality
import axios from 'axios';

const SERVER_URL = 'http://localhost:5000';

async function testTelegramPasswordReset() {
  console.log('🧪 Testing Telegram Password Reset Functionality\n');
  
  try {
    // Test with a sample phone number
    const testPhoneNumber = '+1234567890';
    
    console.log(`📱 Testing password reset for phone: ${testPhoneNumber}`);
    
    const response = await axios.post(`${SERVER_URL}/api/auth/telegram-reset`, {
      phoneNumber: testPhoneNumber
    });
    
    console.log('✅ API Response:', response.data);
    
    if (response.data.newPassword) {
      console.log(`🔑 New Password Generated: ${response.data.newPassword}`);
      console.log('\n📋 Instructions:');
      console.log('1. Use this password to login');
      console.log('2. Change password immediately after login');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data?.message === 'No account found with this phone number. Please check your phone number and try again.') {
      console.log('\n💡 This is expected if no user exists with this phone number.');
      console.log('   Try with a phone number from an existing user account.');
    }
  }
}

// Test with actual user phone number (from the logs, user 5 has phone: '0977816299')
async function testWithRealUser() {
  console.log('\n🧪 Testing with real user phone number\n');
  
  try {
    const realPhoneNumber = '0977816299'; // From the logs: entotocloudrestaurant@gmail.com
    
    console.log(`📱 Testing password reset for real user: ${realPhoneNumber}`);
    
    const response = await axios.post(`${SERVER_URL}/api/auth/telegram-reset`, {
      phoneNumber: realPhoneNumber
    });
    
    console.log('✅ API Response:', response.data);
    
    if (response.data.newPassword) {
      console.log(`🔑 New Password Generated: ${response.data.newPassword}`);
      console.log('\n📋 Reset Instructions:');
      console.log('1. Use this password to login with username: entotocloud');
      console.log('2. Login at: /login');
      console.log('3. Change password immediately after login');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests
testTelegramPasswordReset()
  .then(() => testWithRealUser())
  .catch(console.error);