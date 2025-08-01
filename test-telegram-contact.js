import axios from 'axios';

// Test the contact sharing functionality
async function testContactSharing() {
  console.log('🧪 Testing Telegram Bot Contact Sharing');
  
  const testUpdate = {
    message: {
      chat: {
        id: 123456789
      },
      contact: {
        phone_number: '+251977816299',
        first_name: 'Test User',
        user_id: 123456789
      }
    }
  };

  try {
    const response = await axios.post('http://localhost:5000/webhook/telegram', testUpdate, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Contact sharing test result:', response.data);
  } catch (error) {
    console.error('❌ Error testing contact sharing:', error.response?.data || error.message);
  }
}

// Test the /start command with phone request
async function testStartCommand() {
  console.log('🧪 Testing /start Command with Phone Request');
  
  const testUpdate = {
    message: {
      chat: {
        id: 123456789
      },
      text: '/start',
      from: {
        id: 123456789,
        first_name: 'Test User'
      }
    }
  };

  try {
    const response = await axios.post('http://localhost:5000/webhook/telegram', testUpdate, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Start command test result:', response.data);
  } catch (error) {
    console.error('❌ Error testing start command:', error.response?.data || error.message);
  }
}

// Run tests
setTimeout(async () => {
  await testStartCommand();
  await new Promise(resolve => setTimeout(resolve, 1000));
  await testContactSharing();
}, 2000);