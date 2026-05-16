import TelegramBot from 'node-telegram-bot-api';

class PhoneNumberBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
  }

  setupHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      this.handleStart(msg);
    });

    // Handle contact sharing
    this.bot.on('contact', (msg) => {
      this.handleContact(msg);
    });

    // Handle errors
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });

    console.log('Telegram bot is running...');
  }

  handleStart(msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    
    const welcomeMessage = `Hello ${firstName}! 👋\n\nWelcome to the Phone Number Bot. To get started, please share your phone number by tapping the button below.`;
    
    // Create custom keyboard with phone number request button
    const keyboard = {
      keyboard: [
        [
          {
            text: '📞 Share Phone Number',
            request_contact: true
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };

    this.bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard
    });
  }

  handleContact(msg) {
    const chatId = msg.chat.id;
    const contact = msg.contact;
    
    if (contact) {
      const phoneNumber = contact.phone_number;
      const firstName = contact.first_name || 'User';
      const lastName = contact.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Confirmation message
      const confirmationMessage = `✅ Thank you for sharing your contact!\n\n` +
        `📱 Phone Number: ${phoneNumber}\n` +
        `👤 Name: ${fullName}\n\n` +
        `Your phone number has been received successfully.`;

      // Remove the custom keyboard after contact is shared
      const removeKeyboard = {
        remove_keyboard: true
      };

      this.bot.sendMessage(chatId, confirmationMessage, {
        reply_markup: removeKeyboard
      });

      // Log the received contact for debugging
      console.log('Contact received:', {
        chatId,
        phoneNumber,
        name: fullName,
        userId: msg.from.id
      });
    }
  }

  // Method to send a custom message to request phone number
  requestPhoneNumber(chatId, customMessage = null) {
    const message = customMessage || 'Please share your phone number to continue:';
    
    const keyboard = {
      keyboard: [
        [
          {
            text: '📞 Share My Phone Number',
            request_contact: true
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

  // Method to stop the bot
  stopPolling() {
    this.bot.stopPolling();
    console.log('Bot polling stopped.');
  }
}

export default PhoneNumberBot;