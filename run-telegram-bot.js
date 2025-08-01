import dotenv from 'dotenv';
import PhoneNumberBot from './telegram-bot.js';

dotenv.config();

// Enhanced phone number bot with additional features
class EnhancedPhoneNumberBot extends PhoneNumberBot {
  constructor(token) {
    super(token);
    this.userSessions = new Map(); // Track user sessions
  }

  handleStart(msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    const userId = msg.from.id;
    
    // Track user session
    this.userSessions.set(userId, {
      chatId,
      firstName,
      startTime: new Date(),
      hasSharedPhone: false
    });
    
    const welcomeMessage = `Hello ${firstName}! 👋\n\n` +
      `Welcome to VividPlate Phone Verification Bot.\n\n` +
      `To verify your account and enable password reset via Telegram, ` +
      `please share your phone number by tapping the button below.\n\n` +
      `🔒 Your phone number will be used only for account verification and security purposes.`;
    
    const keyboard = {
      keyboard: [
        [
          {
            text: '📞 Share My Phone Number',
            request_contact: true
          }
        ],
        [
          {
            text: '❌ Cancel'
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };

    this.bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard
    });

    console.log(`📱 User ${firstName} (ID: ${userId}) started verification process`);
  }

  handleContact(msg) {
    const chatId = msg.chat.id;
    const contact = msg.contact;
    const userId = msg.from.id;
    
    if (contact) {
      const phoneNumber = contact.phone_number;
      const firstName = contact.first_name || 'User';
      const lastName = contact.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Update user session
      if (this.userSessions.has(userId)) {
        const session = this.userSessions.get(userId);
        session.hasSharedPhone = true;
        session.phoneNumber = phoneNumber;
        session.completedTime = new Date();
      }
      
      const confirmationMessage = `✅ Phone verification successful!\n\n` +
        `📱 Phone Number: ${phoneNumber}\n` +
        `👤 Name: ${fullName}\n\n` +
        `Your phone number has been verified for account security.\n\n` +
        `You can now use Telegram for password reset and account recovery. ` +
        `If you forget your password, you can reset it through this bot using your verified phone number.\n\n` +
        `🔒 Your information is secure and will only be used for authentication purposes.`;

      const removeKeyboard = {
        remove_keyboard: true
      };

      this.bot.sendMessage(chatId, confirmationMessage, {
        reply_markup: removeKeyboard
      });

      // Log successful verification
      console.log(`✅ Phone verification completed:`, {
        userId,
        chatId,
        phoneNumber,
        name: fullName,
        timestamp: new Date().toISOString()
      });

      // Send follow-up message with next steps
      setTimeout(() => {
        const nextStepsMessage = `🚀 What's next?\n\n` +
          `• Your phone number is now linked to your VividPlate account\n` +
          `• Use /reset command if you need to reset your password\n` +
          `• You'll receive important notifications here\n` +
          `• Type /help for more commands`;

        this.bot.sendMessage(chatId, nextStepsMessage);
      }, 2000);
    }
  }

  // Handle cancel action
  setupHandlers() {
    super.setupHandlers();

    // Handle cancel button
    this.bot.onText(/❌ Cancel/, (msg) => {
      const chatId = msg.chat.id;
      const removeKeyboard = { remove_keyboard: true };
      
      this.bot.sendMessage(chatId, 
        '❌ Phone verification cancelled.\n\nYou can restart anytime by sending /start', 
        { reply_markup: removeKeyboard }
      );
    });

    // Handle help command
    this.bot.onText(/\/help/, (msg) => {
      const helpMessage = `🤖 VividPlate Bot Commands:\n\n` +
        `/start - Begin phone verification\n` +
        `/help - Show this help message\n` +
        `/reset - Reset your password (requires verified phone)\n` +
        `/status - Check your verification status\n\n` +
        `📞 This bot helps you verify your phone number for account security and password recovery.`;
      
      this.bot.sendMessage(msg.chat.id, helpMessage);
    });

    // Handle status command
    this.bot.onText(/\/status/, (msg) => {
      const userId = msg.from.id;
      const session = this.userSessions.get(userId);
      
      let statusMessage;
      if (session && session.hasSharedPhone) {
        statusMessage = `✅ Verification Status: VERIFIED\n\n` +
          `📱 Phone: ${session.phoneNumber}\n` +
          `⏰ Verified: ${session.completedTime.toLocaleString()}\n\n` +
          `Your phone is verified and ready for password recovery.`;
      } else {
        statusMessage = `❌ Verification Status: NOT VERIFIED\n\n` +
          `Please send /start to begin phone verification.`;
      }
      
      this.bot.sendMessage(msg.chat.id, statusMessage);
    });
  }

  // Get verification statistics
  getStats() {
    const totalUsers = this.userSessions.size;
    const verifiedUsers = Array.from(this.userSessions.values()).filter(s => s.hasSharedPhone).length;
    
    return {
      totalUsers,
      verifiedUsers,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// Start the enhanced bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is required');
  console.log('Please set your Telegram bot token in the environment variables.');
  process.exit(1);
}

const enhancedBot = new EnhancedPhoneNumberBot(BOT_TOKEN);

console.log('🚀 VividPlate Phone Verification Bot started!');
console.log('📋 Features:');
console.log('  • Phone number verification with custom buttons');
console.log('  • Contact confirmation and security messaging');
console.log('  • Cancel option for user convenience');
console.log('  • Help and status commands');
console.log('  • Session tracking and statistics');
console.log('  • Integration ready for VividPlate platform');
console.log('\n💬 Available commands:');
console.log('  /start - Begin verification');
console.log('  /help - Show help');
console.log('  /status - Check verification status');
console.log('\nPress Ctrl+C to stop the bot.');

// Log statistics every 5 minutes
setInterval(() => {
  const stats = enhancedBot.getStats();
  console.log(`📊 Bot Stats: ${stats.totalUsers} users, ${stats.verifiedUsers} verified (${stats.verificationRate})`);
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down VividPlate bot...');
  const stats = enhancedBot.getStats();
  console.log(`📊 Final Stats: ${stats.totalUsers} users, ${stats.verifiedUsers} verified (${stats.verificationRate})`);
  enhancedBot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down VividPlate bot...');
  enhancedBot.stopPolling();
  process.exit(0);
});