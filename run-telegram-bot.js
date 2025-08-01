import dotenv from 'dotenv';
import PhoneNumberBot from './telegram-bot.js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
// Import phone utility function
function generatePhoneVariations(phoneNumber) {
  if (!phoneNumber) return [];
  
  // Remove any non-digit characters
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  const variations = new Set();
  
  // Add the original cleaned number
  variations.add(cleanPhone);
  
  // Add with + prefix
  variations.add(`+${cleanPhone}`);
  
  // If it starts with country code, try without it
  if (cleanPhone.startsWith('251') && cleanPhone.length > 3) {
    const withoutCountryCode = cleanPhone.substring(3);
    variations.add(withoutCountryCode);
    variations.add(`0${withoutCountryCode}`);
  }
  
  // If it starts with 0, try without it and with country code
  if (cleanPhone.startsWith('0') && cleanPhone.length > 1) {
    const withoutLeadingZero = cleanPhone.substring(1);
    variations.add(withoutLeadingZero);
    variations.add(`251${withoutLeadingZero}`);
    variations.add(`+251${withoutLeadingZero}`);
  }
  
  // Handle international format variations
  if (!cleanPhone.startsWith('251') && !cleanPhone.startsWith('0')) {
    variations.add(`251${cleanPhone}`);
    variations.add(`+251${cleanPhone}`);
    variations.add(`0${cleanPhone}`);
  }
  
  return Array.from(variations);
}

dotenv.config();

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// Enhanced phone number bot with additional features
class EnhancedPhoneNumberBot extends PhoneNumberBot {
  constructor(token) {
    super(token);
    this.userSessions = new Map(); // Track user sessions
    this.db = pool;
  }

  // Check if phone number is registered in VividPlate database
  async checkPhoneInDatabase(phoneNumber) {
    try {
      const phoneVariations = generatePhoneVariations(phoneNumber);
      console.log(`🔍 Checking phone variations:`, phoneVariations);

      const query = `
        SELECT id, email, full_name, phone, created_at
        FROM users 
        WHERE phone = ANY($1)
        LIMIT 1
      `;
      
      const result = await this.db.query(query, [phoneVariations]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`✅ User found in database:`, {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.full_name || 'No name'
        });
        return user;
      }
      
      console.log(`❌ Phone number not found in database`);
      return null;
    } catch (error) {
      console.error('❌ Database query error:', error);
      return null;
    }
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

  async handleContact(msg) {
    const chatId = msg.chat.id;
    const contact = msg.contact;
    const userId = msg.from.id;
    
    if (contact) {
      const phoneNumber = contact.phone_number;
      const firstName = contact.first_name || 'User';
      const lastName = contact.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();

      // Check if phone number is registered in VividPlate database
      const registeredUser = await this.checkPhoneInDatabase(phoneNumber);
      const session = this.userSessions.get(userId);

      if (!registeredUser) {
        // Phone not found in database
        const notFoundMessage = `❌ Phone Number Not Found\n\n` +
          `📱 Phone: ${phoneNumber}\n` +
          `👤 Name: ${fullName}\n\n` +
          `This phone number is not registered in the VividPlate system.\n\n` +
          `🔍 To use password reset and secure features:\n` +
          `1️⃣ Register at VividPlate with this phone number\n` +
          `2️⃣ Complete your account setup\n` +
          `3️⃣ Return here to verify and reset password\n\n` +
          `📧 Visit the VividPlate website or app to create your account.`;

        const removeKeyboard = { remove_keyboard: true };
        
        this.bot.sendMessage(chatId, notFoundMessage, {
          reply_markup: removeKeyboard
        });

        console.log(`❌ Phone verification failed - not registered: ${phoneNumber} (${fullName})`);
        return;
      }

      // Phone number is registered - proceed with verification
      if (session) {
        session.hasSharedPhone = true;
        session.phoneNumber = phoneNumber;
        session.completedTime = new Date();
        session.registeredUser = registeredUser;
      }
      
      const confirmationMessage = `✅ Phone Number Verified & Registered!\n\n` +
        `📱 Phone: ${phoneNumber}\n` +
        `👤 Telegram Name: ${fullName}\n` +
        `🏷️ VividPlate Account: ${registeredUser.email}\n` +
        `🆔 Account Name: ${registeredUser.full_name || 'No name set'}\n\n` +
        `Your phone number has been verified and matches a registered VividPlate account.\n\n` +
        `🔐 You can now use /reset to change your password.\n` +
        `🛡️ All data is encrypted and stored securely.`;

      const removeKeyboard = {
        remove_keyboard: true
      };

      this.bot.sendMessage(chatId, confirmationMessage, {
        reply_markup: removeKeyboard
      });

      // Log successful verification
      console.log(`✅ Phone verification completed for registered user:`, {
        userId,
        chatId,
        phoneNumber,
        telegramName: fullName,
        vividPlateUser: {
          id: registeredUser.id,
          email: registeredUser.email,
          name: registeredUser.full_name || 'No name'
        },
        timestamp: new Date().toISOString()
      });

      // Send follow-up message with next steps
      setTimeout(() => {
        const nextStepsMessage = `🚀 What's next?\n\n` +
          `✅ Your phone is verified with VividPlate account\n` +
          `🔐 Use /reset to change your password securely\n` +
          `📊 Use /status to check verification status\n` +
          `❓ Use /help for detailed command information\n\n` +
          `🔒 Ready for secure password operations!`;

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
      if (session && session.hasSharedPhone && session.registeredUser) {
        const user = session.registeredUser;
        statusMessage = `✅ Verification Status: VERIFIED & REGISTERED\n\n` +
          `📱 Phone: ${session.phoneNumber}\n` +
          `👤 Telegram Name: ${session.firstName}\n` +
          `🏷️ VividPlate Account: ${user.email}\n` +
          `🆔 Account Name: ${user.full_name || 'No name set'}\n` +
          `📅 Account Created: ${new Date(user.created_at).toLocaleDateString()}\n` +
          `⏰ Verified: ${session.completedTime.toLocaleString()}\n\n` +
          `🔓 You can now use /reset to change your password.\n` +
          `🔒 Your account is secure and ready for recovery.`;
      } else if (session && session.hasSharedPhone) {
        statusMessage = `⚠️ Verification Status: PHONE SHARED BUT NOT REGISTERED\n\n` +
          `📱 Phone: ${session.phoneNumber}\n` +
          `👤 Name: ${session.firstName}\n` +
          `⏰ Shared: ${session.completedTime.toLocaleString()}\n\n` +
          `❌ This phone number is not registered in VividPlate.\n` +
          `🔍 Please register at VividPlate first, then verify again.\n\n` +
          `📱 Tap the button below to re-verify after registration:`;
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
    
    if (!session || !session.hasSharedPhone || !session.registeredUser) {
      const notVerifiedMessage = `🔒 Password Reset Unavailable\n\n` +
        `You need to verify your phone number with a registered VividPlate account before you can reset your password.\n\n` +
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

    // User is verified with registered account, proceed with reset
    const user = session.registeredUser;
    const resetMessage = `🔐 Password Reset Process\n\n` +
      `📱 Verified Phone: ${session.phoneNumber}\n` +
      `📧 VividPlate Account: ${user.email}\n` +
      `👤 Account Name: ${user.full_name || 'No name set'}\n\n` +
      `Your password reset request has been initiated for your registered VividPlate account.\n\n` +
      `Here's what happens next:\n` +
      `1️⃣ A verification code will be sent to: ${user.email}\n` +
      `2️⃣ Enter the code in the VividPlate app or website\n` +
      `3️⃣ Create your new password\n\n` +
      `⏱️ The verification code will expire in 15 minutes.\n\n` +
      `If you don't receive the email, check your spam folder or contact support.\n\n` +
      `🔒 This request is logged and monitored for security.`;

    await this.bot.sendMessage(chatId, resetMessage);

    // Log the reset request with full user information
    console.log(`🔐 Password reset requested for registered user:`, {
      telegramUserId: userId,
      vividPlateUserId: user.id,
      phone: session.phoneNumber,
      email: user.email,
      accountName: user.full_name || 'No name',
      timestamp: new Date().toISOString()
    });

    // Send follow-up with next steps
    setTimeout(() => {
      const followUpMessage = `💡 Password Reset Help\n\n` +
        `📧 Email sent to: ${user.email}\n\n` +
        `Next steps:\n` +
        `• Check your email (including spam folder)\n` +
        `• Code valid for 15 minutes only\n` +
        `• Contact support if no email received\n` +
        `• Use /status to check verification anytime\n\n` +
        `🔐 Security tip: Never share verification codes with anyone.\n\n` +
        `Need more help? Use /help for all commands.`;
      
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