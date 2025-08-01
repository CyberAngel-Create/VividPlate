import dotenv from 'dotenv';
import PhoneNumberBot from './telegram-bot.js';

dotenv.config();

// Get the bot token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is required');
  console.log('Please set your Telegram bot token in the environment variables.');
  console.log('You can get a bot token by messaging @BotFather on Telegram.');
  process.exit(1);
}

// Create and start the bot
const phoneBot = new PhoneNumberBot(BOT_TOKEN);

console.log('🤖 Phone Number Bot started successfully!');
console.log('📱 The bot will request phone numbers from users in one-on-one chats');
console.log('🔹 Users can start by sending /start command');
console.log('🔹 Bot will show a custom button to share phone number');
console.log('🔹 After sharing, bot will confirm with the received number');
console.log('\nPress Ctrl+C to stop the bot.');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  phoneBot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  phoneBot.stopPolling();
  process.exit(0);
});