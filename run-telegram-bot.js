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
      `Welcome to VividPlate Bot - Your restaurant management assistant.\n\n` +
      `Available Commands:\n\n` +
      `🔹 /start - Show this welcome message and commands\n` +
      `🔹 /reset - Reset your account password (requires phone verification)\n` +
      `🔹 /help - Get detailed help information\n` +
      `🔹 /status - Check your phone verification status\n` +
      `🔹 /verify - Start phone number verification process\n\n` +
      `To get started with password reset functionality, you'll need to verify your phone number first.\n\n` +
      `Type any command or tap the verification button below:`;
    
    const keyboard = {
      keyboard: [
        [
          {
            text: '📞 Verify Phone Number',
            request_contact: true
          }
        ],
        [
          {
            text: '/help'
          },
          {
            text: '/reset'
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };

    this.bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard
    });

    console.log(`📱 User ${firstName} (ID: ${userId}) started bot interaction`);
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

  // Enhanced command handlers
  setupHandlers() {
    super.setupHandlers();

    // Handle /verify command (same as phone verification)
    this.bot.onText(/\/verify/, (msg) => {
      this.requestPhoneVerification(msg.chat.id, msg.from.first_name);
    });

    // Handle /reset command
    this.bot.onText(/\/reset/, (msg) => {
      this.handlePasswordReset(msg);
    });

    // Handle /help command
    this.bot.onText(/\/help/, (msg) => {
      const helpMessage = `🤖 VividPlate Bot - Detailed Help\n\n` +
        `📋 Available Commands:\n\n` +
        `🔹 /start\n` +
        `   Show welcome message with all available commands\n\n` +
        `🔹 /reset\n` +
        `   Reset your VividPlate account password\n` +
        `   Requires phone verification first\n\n` +
        `🔹 /help\n` +
        `   Show this detailed help information\n\n` +
        `🔹 /status\n` +
        `   Check your phone verification status\n\n` +
        `🔹 /verify\n` +
        `   Start or restart phone number verification\n\n` +
        `📞 Phone Verification:\n` +
        `Your phone number is required for secure password reset. ` +
        `The bot will request contact permission when you tap the verification button.\n\n` +
        `🔒 Security:\n` +
        `All information is encrypted and used only for account verification. ` +
        `We never share your phone number with third parties.\n\n` +
        `Need more help? Contact support through the VividPlate app.`;
      
      this.bot.sendMessage(msg.chat.id, helpMessage);
    });

    // Handle /status command
    this.bot.onText(/\/status/, (msg) => {
      const userId = msg.from.id;
      const session = this.userSessions.get(userId);
      
      let statusMessage;
      if (session && session.hasSharedPhone) {
        statusMessage = `✅ Verification Status: VERIFIED\n\n` +
          `📱 Phone: ${session.phoneNumber}\n` +
          `👤 Name: ${session.firstName}\n` +
          `⏰ Verified: ${session.completedTime.toLocaleString()}\n\n` +
          `🔓 You can now use /reset to change your password.\n` +
          `🔒 Your account is secure and ready for recovery.`;
      } else {
        statusMessage = `❌ Verification Status: NOT VERIFIED\n\n` +
          `To use password reset and other secure features, you need to verify your phone number first.\n\n` +
          `📱 Tap the button below or send /verify to start:`;
        
        const keyboard = {
          keyboard: [
            [
              {
                text: '📞 Verify Phone Number',
                request_contact: true
              }
            ]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        };
        
        return this.bot.sendMessage(msg.chat.id, statusMessage, {
          reply_markup: keyboard
        });
      }
      
      this.bot.sendMessage(msg.chat.id, statusMessage);
    });

    // Handle unknown commands
    this.bot.on('message', (msg) => {
      if (msg.text && msg.text.startsWith('/') && !this.isKnownCommand(msg.text)) {
        const unknownMessage = `❓ Unknown command: ${msg.text}\n\n` +
          `Available commands:\n` +
          `• /start - Show welcome and commands\n` +
          `• /reset - Reset password\n` +
          `• /help - Detailed help\n` +
          `• /status - Check verification\n` +
          `• /verify - Verify phone number\n\n` +
          `Type /help for detailed information.`;
        
        this.bot.sendMessage(msg.chat.id, unknownMessage);
      }
    });
  }

  // Check if command is known
  isKnownCommand(text) {
    const knownCommands = ['/start', '/reset', '/help', '/status', '/verify'];
    return knownCommands.some(cmd => text.startsWith(cmd));
  }

  // Handle password reset
  async handlePasswordReset(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const session = this.userSessions.get(userId);
    
    if (!session || !session.hasSharedPhone) {
      const notVerifiedMessage = `🔒 Password Reset Unavailable\n\n` +
        `You need to verify your phone number before you can reset your password.\n\n` +
        `📱 Tap the button below to verify your phone number first:`;
      
      const keyboard = {
        keyboard: [
          [
            {
              text: '📞 Verify Phone Number',
              request_contact: true
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      };
      
      return this.bot.sendMessage(chatId, notVerifiedMessage, {
        reply_markup: keyboard
      });
    }

    // User is verified, proceed with reset
    const resetMessage = `🔐 Password Reset Process\n\n` +
      `📱 Verified Phone: ${session.phoneNumber}\n\n` +
      `Your password reset request has been initiated. Here's what happens next:\n\n` +
      `1️⃣ A verification code will be sent to your registered email\n` +
      `2️⃣ Enter the code in the VividPlate app or website\n` +
      `3️⃣ Create your new password\n\n` +
      `⏱️ The verification code will expire in 15 minutes.\n\n` +
      `If you don't receive the email, check your spam folder or contact support.\n\n` +
      `🔒 For security, this request is logged and monitored.`;

    await this.bot.sendMessage(chatId, resetMessage);

    // Log the reset request
    console.log(`🔐 Password reset requested:`, {
      userId,
      phone: session.phoneNumber,
      timestamp: new Date().toISOString()
    });

    // Send follow-up with next steps
    setTimeout(() => {
      const followUpMessage = `💡 Need help?\n\n` +
        `• Check your email (including spam folder)\n` +
        `• Code valid for 15 minutes only\n` +
        `• Contact support if no email received\n` +
        `• Use /status to check verification anytime\n\n` +
        `Security tip: Never share verification codes with anyone.`;
      
      this.bot.sendMessage(chatId, followUpMessage);
    }, 3000);
  }

  // Request phone verification
  requestPhoneVerification(chatId, firstName) {
    const message = `📞 Phone Number Verification\n\n` +
      `Hi ${firstName || 'there'}! To enable secure password reset, please share your phone number.\n\n` +
      `🔒 Your phone number will be:\n` +
      `• Used only for account verification\n` +
      `• Encrypted and stored securely\n` +
      `• Never shared with third parties\n\n` +
      `Tap the button below to share your contact:`;
    
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

    return this.bot.sendMessage(chatId, message, {
      reply_markup: keyboard
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
console.log('  /start - Show welcome and all commands');
console.log('  /reset - Reset account password');
console.log('  /help - Show detailed help');
console.log('  /status - Check verification status');
console.log('  /verify - Start phone verification');
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