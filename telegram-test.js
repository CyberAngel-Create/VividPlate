import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8489095054:AAGWvYjcHg3L8-JXnhEJo3OGgA9HWuwEIAI';

async function testTelegramBot() {
  console.log('🤖 Testing Telegram Bot Connectivity');
  
  try {
    // Get bot info
    const botInfo = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    console.log('✅ Bot Info:', botInfo.data.result);
    
    // Get recent updates to find active chats
    const updates = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=10`);
    console.log('\n📨 Recent Chat Activity:');
    
    if (updates.data.result.length === 0) {
      console.log('❌ No recent messages found. You need to:');
      console.log('1. Open Telegram');
      console.log('2. Search for @Vividplatebot');
      console.log('3. Start a conversation by clicking START');
      console.log('4. Send: /start');
      console.log('5. Then try: /reset +251977816299');
    } else {
      updates.data.result.forEach((update, index) => {
        if (update.message) {
          console.log(`${index + 1}. Chat ID: ${update.message.chat.id}`);
          console.log(`   From: ${update.message.from.first_name || 'Unknown'}`);
          console.log(`   Text: "${update.message.text}"`);
          console.log('');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testTelegramBot();