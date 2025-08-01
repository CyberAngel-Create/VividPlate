import dotenv from 'dotenv';
import PhoneNumberBot from './telegram-bot.js';

dotenv.config();

// Test the bot functionality
async function testBot() {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    return;
  }

  console.log('🧪 Testing Telegram Phone Number Bot...');
  
  try {
    // Create bot instance
    const bot = new PhoneNumberBot(BOT_TOKEN);
    
    // Test bot info
    const botInfo = await bot.bot.getMe();
    console.log('✅ Bot connected successfully!');
    console.log(`🤖 Bot Name: ${botInfo.first_name}`);
    console.log(`📝 Username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    
    // Test webhook info (if using webhooks)
    try {
      const webhookInfo = await bot.bot.getWebHookInfo();
      if (webhookInfo.url) {
        console.log(`🔗 Webhook URL: ${webhookInfo.url}`);
      } else {
        console.log('📡 Using polling mode (no webhook set)');
      }
    } catch (error) {
      console.log('📡 Using polling mode');
    }
    
    console.log('\n📱 Phone Number Bot Features:');
    console.log('  • /start command with welcome message');
    console.log('  • Custom keyboard with "Share Phone Number" button');
    console.log('  • request_contact: true for phone number access');
    console.log('  • Contact confirmation message');
    console.log('  • Works in one-on-one chats');
    console.log('  • Graceful error handling');
    
    console.log('\n🚀 Bot is ready to receive messages!');
    console.log('💡 Send /start to the bot to test phone number sharing');
    
  } catch (error) {
    console.error('❌ Error testing bot:', error.message);
    
    if (error.code === 'ETELEGRAM') {
      console.log('🔧 Common solutions:');
      console.log('  • Check if bot token is correct');
      console.log('  • Ensure bot is not already running elsewhere');
      console.log('  • Verify internet connection');
    }
  }
}

// Run the test
testBot();