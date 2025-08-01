#!/usr/bin/env node

/**
 * Complete working Telegram bot for VividPlate password reset
 * With database integration and phone verification
 */

import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();
neonConfig.webSocketConstructor = ws;

// Phone number variations generator
function generatePhoneVariations(phoneNumber) {
  if (!phoneNumber) return [];
  
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const variations = new Set();
  
  variations.add(cleanPhone);
  variations.add(`+${cleanPhone}`);
  
  if (cleanPhone.startsWith('251') && cleanPhone.length > 3) {
    const withoutCountryCode = cleanPhone.substring(3);
    variations.add(withoutCountryCode);
    variations.add(`0${withoutCountryCode}`);
  }
  
  if (cleanPhone.startsWith('0') && cleanPhone.length > 1) {
    const withoutLeadingZero = cleanPhone.substring(1);
    variations.add(withoutLeadingZero);
    variations.add(`251${withoutLeadingZero}`);
    variations.add(`+251${withoutLeadingZero}`);
  }
  
  if (!cleanPhone.startsWith('251') && !cleanPhone.startsWith('0')) {
    variations.add(`251${cleanPhone}`);
    variations.add(`+251${cleanPhone}`);
    variations.add(`0${cleanPhone}`);
  }
  
  return Array.from(variations);
}

class VividPlateBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.db = new Pool({ connectionString: process.env.DATABASE_URL });
    this.userSessions = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    console.log('🔧 Setting up bot handlers...');

    // Start command
    this.bot.onText(/\/start/, (msg) => {
      console.log(`📱 /start from ${msg.from.first_name} (ID: ${msg.from.id})`);
      
      const welcomeMessage = `Welcome to VividPlate Password Reset Bot! 🍽️\n\n` +
        `🔐 Secure password reset for VividPlate accounts\n` +
        `📱 Phone number verification required\n\n` +
        `Available commands:\n` +
        `🔹 /reset - Reset your password\n` +
        `🔹 /verify - Verify phone number\n` +
        `🔹 /status - Check verification status\n` +
        `🔹 /help - Get help\n\n` +
        `To get started, verify your phone number:`;
      
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
              text: '/help',
            },
            {
              text: '/status'
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      };
      
      this.bot.sendMessage(msg.chat.id, welcomeMessage, {
        reply_markup: keyboard
      });
    });

    // Reset command
    this.bot.onText(/\/reset/, (msg) => {
      console.log(`🔐 /reset from ${msg.from.first_name} (ID: ${msg.from.id})`);
      this.handlePasswordReset(msg);
    });

    // Verify command
    this.bot.onText(/\/verify/, (msg) => {
      console.log(`📞 /verify from ${msg.from.first_name} (ID: ${msg.from.id})`);
      this.requestPhoneVerification(msg.chat.id, msg.from.first_name);
    });

    // Status command
    this.bot.onText(/\/status/, (msg) => {
      console.log(`📊 /status from ${msg.from.first_name} (ID: ${msg.from.id})`);
      this.handleStatus(msg);
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      console.log(`❓ /help from ${msg.from.first_name} (ID: ${msg.from.id})`);
      
      const helpMessage = `🆘 VividPlate Bot Help\n\n` +
        `This bot helps you reset your VividPlate account password securely.\n\n` +
        `📋 Commands:\n` +
        `• /start - Show welcome message\n` +
        `• /verify - Start phone verification\n` +
        `• /reset - Reset password (requires verification)\n` +
        `• /status - Check verification status\n` +
        `• /help - Show this help\n\n` +
        `🔒 Security Features:\n` +
        `• Phone number verification required\n` +
        `• Only registered VividPlate users can reset\n` +
        `• Secure password generation\n` +
        `• Auto-deletion of sensitive messages\n\n` +
        `📱 How to use:\n` +
        `1. Share your phone number with /verify\n` +
        `2. Bot checks if you're registered in VividPlate\n` +
        `3. Use /reset to get new password\n` +
        `4. Log into VividPlate with new password\n\n` +
        `Need more help? Contact VividPlate support.`;
      
      this.bot.sendMessage(msg.chat.id, helpMessage);
    });

    // Contact sharing
    this.bot.on('contact', (msg) => {
      console.log(`📱 Contact from ${msg.from.first_name} (ID: ${msg.from.id})`);
      this.handleContact(msg);
    });

    // Cancel button
    this.bot.on('text', (msg) => {
      if (msg.text === '❌ Cancel') {
        const removeKeyboard = {
          remove_keyboard: true
        };
        
        this.bot.sendMessage(msg.chat.id, '❌ Cancelled. You can start again with /verify or /start.', {
          reply_markup: removeKeyboard
        });
      }
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('❌ Bot error:', error.message);
    });

    console.log('✅ Bot handlers configured');
  }

  async handleContact(msg) {
    const contact = msg.contact;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const phoneNumber = contact.phone_number;
    const firstName = contact.first_name || 'User';
    const fullName = `${firstName} ${contact.last_name || ''}`.trim();

    console.log(`📱 Processing contact: ${phoneNumber} from ${fullName}`);

    // Check if phone is registered in VividPlate
    const registeredUser = await this.checkPhoneInDatabase(phoneNumber);
    
    const removeKeyboard = {
      remove_keyboard: true
    };

    if (registeredUser) {
      // Phone is registered - success
      const successMessage = `✅ Phone Number Verified & Registered!\n\n` +
        `📱 Phone: ${phoneNumber}\n` +
        `👤 Telegram Name: ${fullName}\n` +
        `🏷️ VividPlate Account: ${registeredUser.email}\n` +
        `🆔 Account Name: ${registeredUser.full_name || 'No name set'}\n\n` +
        `Your phone number matches a registered VividPlate account!\n\n` +
        `🔐 You can now use /reset to change your password.`;

      await this.bot.sendMessage(chatId, successMessage, {
        reply_markup: removeKeyboard
      });

      // Store successful verification
      this.userSessions.set(userId, {
        phoneNumber,
        firstName: fullName,
        hasSharedPhone: true,
        registeredUser,
        completedTime: new Date(),
        chatId
      });

    } else {
      // Phone not registered
      const errorMessage = `❌ Phone Number Not Found\n\n` +
        `📱 Phone: ${phoneNumber}\n` +
        `👤 Name: ${fullName}\n\n` +
        `This phone number is not registered in VividPlate.\n\n` +
        `To use password reset:\n` +
        `1️⃣ Register at VividPlate with this phone number\n` +
        `2️⃣ Complete your account setup\n` +
        `3️⃣ Return here and verify again\n\n` +
        `Visit VividPlate to create an account first.`;

      await this.bot.sendMessage(chatId, errorMessage, {
        reply_markup: removeKeyboard
      });
    }
  }

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
        console.log(`✅ User found:`, {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.full_name || 'No name'
        });
        return user;
      } else {
        console.log(`❌ Phone not found in database`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Database error:`, error.message);
      return null;
    }
  }

  generateNewPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return password;
  }

  async handlePasswordReset(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const session = this.userSessions.get(userId);
    
    if (!session || !session.hasSharedPhone || !session.registeredUser) {
      const notVerifiedMessage = `🔒 Password Reset Unavailable\n\n` +
        `You need to verify your phone number first.\n\n` +
        `📱 Tap the button below to verify:`;
      
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

    try {
      const user = session.registeredUser;
      
      // Generate new password
      const newPassword = this.generateNewPassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password in database
      const updateQuery = `
        UPDATE users 
        SET password = $1, 
            reset_password_token = NULL, 
            reset_password_expires = NULL 
        WHERE id = $2
      `;
      
      await this.db.query(updateQuery, [hashedPassword, user.id]);
      
      // Send success message
      const resetSuccessMessage = `✅ Password Reset Successful!\n\n` +
        `📱 Verified Phone: ${session.phoneNumber}\n` +
        `📧 VividPlate Account: ${user.email}\n` +
        `👤 Account Name: ${user.full_name || 'No name set'}\n\n` +
        `🔑 Your new password is: \`${newPassword}\`\n\n` +
        `🔒 Important Security Steps:\n` +
        `1️⃣ Copy this password immediately\n` +
        `2️⃣ Log into VividPlate with your new password\n` +
        `3️⃣ Change to a custom password in your profile\n` +
        `4️⃣ This message will be deleted in 2 minutes\n\n` +
        `⚠️ Keep this password secure!`;

      const sentMessage = await this.bot.sendMessage(chatId, resetSuccessMessage, {
        parse_mode: 'Markdown'
      });

      console.log(`✅ Password reset completed for user ${user.email}`);

      // Auto-delete after 2 minutes
      setTimeout(() => {
        this.bot.deleteMessage(chatId, sentMessage.message_id).catch(() => {
          console.log('Could not delete password message');
        });
      }, 120000);

    } catch (error) {
      console.error('❌ Password reset failed:', error);
      
      const errorMessage = `❌ Password Reset Failed\n\n` +
        `There was an error resetting your password.\n` +
        `Please try again or contact support.`;
      
      await this.bot.sendMessage(chatId, errorMessage);
    }
  }

  handleStatus(msg) {
    const userId = msg.from.id;
    const session = this.userSessions.get(userId);
    
    let statusMessage;
    let keyboard = null;
    
    if (session && session.hasSharedPhone && session.registeredUser) {
      const user = session.registeredUser;
      statusMessage = `✅ Verification Status: VERIFIED & REGISTERED\n\n` +
        `📱 Phone: ${session.phoneNumber}\n` +
        `👤 Telegram Name: ${session.firstName}\n` +
        `🏷️ VividPlate Account: ${user.email}\n` +
        `🆔 Account Name: ${user.full_name || 'No name set'}\n` +
        `📅 Account Created: ${new Date(user.created_at).toLocaleDateString()}\n` +
        `⏰ Verified: ${session.completedTime.toLocaleString()}\n\n` +
        `🔓 You can now use /reset to change your password.`;
    } else {
      statusMessage = `❌ Verification Status: NOT VERIFIED\n\n` +
        `To use password reset, you need to verify your phone number first.\n\n` +
        `📱 Tap the button below to start:`;
      
      keyboard = {
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
    }
    
    this.bot.sendMessage(msg.chat.id, statusMessage, {
      reply_markup: keyboard
    });
  }

  requestPhoneVerification(chatId, firstName) {
    const message = `📞 Phone Number Verification\n\n` +
      `Hi ${firstName || 'there'}! To reset your VividPlate password, share your phone number.\n\n` +
      `🔒 Your phone number will be:\n` +
      `• Used only for account verification\n` +
      `• Checked against VividPlate database\n` +
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

  stopPolling() {
    this.bot.stopPolling();
    console.log('🛑 Bot stopped');
  }
}

// Start the bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found');
  process.exit(1);
}

const bot = new VividPlateBot(BOT_TOKEN);

console.log('🚀 VividPlate Bot Started!');
console.log('📋 Features: Phone verification, password reset, database integration');
console.log('💬 Available commands: /start, /verify, /reset, /status, /help');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  bot.stopPolling();
  process.exit(0);
});