#!/usr/bin/env node

/**
 * Simple Telegram bot test to verify basic functionality
 */

import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found');
  process.exit(1);
}

console.log('🤖 Starting simple Telegram bot test...');
console.log('Bot Token length:', BOT_TOKEN.length);

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Test basic command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  
  console.log(`📱 Received /start from ${firstName} (ID: ${msg.from.id})`);
  
  const message = `Hello ${firstName}! 👋\n\nThis is a test bot. Commands:\n/start - This message\n/test - Test command\n/phone - Request phone`;
  
  bot.sendMessage(chatId, message);
});

// Test command
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`🧪 Test command from user ${msg.from.id}`);
  bot.sendMessage(chatId, '✅ Test command works!');
});

// Phone request
bot.onText(/\/phone/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`📞 Phone request from user ${msg.from.id}`);
  
  const keyboard = {
    keyboard: [
      [
        {
          text: '📞 Share Phone Number',
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
  
  bot.sendMessage(chatId, 'Please share your phone number:', {
    reply_markup: keyboard
  });
});

// Handle contact sharing
bot.on('contact', (msg) => {
  const contact = msg.contact;
  console.log(`📱 Contact received:`, {
    phone: contact.phone_number,
    name: contact.first_name,
    userId: msg.from.id
  });
  
  const removeKeyboard = {
    remove_keyboard: true
  };
  
  bot.sendMessage(msg.chat.id, `✅ Contact received!\nPhone: ${contact.phone_number}\nName: ${contact.first_name}`, {
    reply_markup: removeKeyboard
  });
});

// Handle regular messages
bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/') || msg.contact) return;
  
  console.log(`💬 Message: ${msg.text} from ${msg.from.first_name}`);
  bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

console.log('✅ Simple bot started successfully!');
console.log('Available commands: /start, /test, /phone');
console.log('Press Ctrl+C to stop');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stopPolling();
  process.exit(0);
});