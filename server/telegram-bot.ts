import axios from 'axios';
import bcrypt from 'bcryptjs';
import { storage } from './storage.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8489095054:AAGWvYjcHg3L8-JXnhEJo3OGgA9HWuwEIAI';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Generate random password
function generateRandomPassword(length: number = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Send message via Telegram Bot API
export async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    console.log('Telegram message sent successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

// Send message with phone number request button
export async function sendTelegramMessageWithPhoneRequest(chatId: string, text: string, buttonText: string): Promise<boolean> {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [
            {
              text: buttonText,
              request_contact: true
            }
          ]
        ],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
    
    console.log('Telegram message with phone request sent successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message with phone request:', error);
    return false;
  }
}

// Normalize phone number - try multiple formats to find user
function normalizePhoneNumber(phoneNumber: string): string[] {
  const cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  const formats = [
    phoneNumber, // Original format
    cleaned, // Just numbers
    `+${cleaned}`, // With + prefix
    `251${cleaned.replace(/^0/, '')}`, // Ethiopia format (+251)
    `1${cleaned}`, // US format (+1)
    `44${cleaned.replace(/^0/, '')}`, // UK format (+44)
    `49${cleaned.replace(/^0/, '')}`, // Germany format (+49)
    `33${cleaned.replace(/^0/, '')}`, // France format (+33)
    `39${cleaned.replace(/^0/, '')}`, // Italy format (+39)
    `86${cleaned}`, // China format (+86)
    `91${cleaned}`, // India format (+91)
    `234${cleaned.replace(/^0/, '')}`, // Nigeria format (+234)
    `27${cleaned.replace(/^0/, '')}`, // South Africa format (+27)
    `254${cleaned.replace(/^0/, '')}`, // Kenya format (+254)
    `256${cleaned.replace(/^0/, '')}`, // Uganda format (+256)
    `255${cleaned.replace(/^0/, '')}`, // Tanzania format (+255)
  ];
  
  // Remove duplicates and return unique formats
  return [...new Set(formats)];
}

// Handle password reset via phone number (with optional chat ID for Telegram sending)
export async function handleTelegramPasswordReset(phoneNumber: string, chatId?: string): Promise<{ success: boolean; message: string; newPassword?: string }> {
  try {
    console.log('Attempting password reset for phone:', phoneNumber);
    
    // Try multiple phone number formats
    const phoneFormats = normalizePhoneNumber(phoneNumber);
    console.log('Trying phone formats:', phoneFormats);
    
    let user = null;
    for (const format of phoneFormats) {
      user = await storage.getUserByPhone(format);
      if (user) {
        console.log('Found user with phone format:', format);
        break;
      }
    }
    
    if (!user) {
      return {
        success: false,
        message: 'No account found with this phone number. Please check your phone number and try again.'
      };
    }

    // Generate new password
    const newPassword = generateRandomPassword(10);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password in database
    const updateResult = await storage.updateUserPassword(user.id, hashedPassword);
    
    if (!updateResult) {
      return {
        success: false,
        message: 'Failed to update password. Please try again later.'
      };
    }

    // If chatId is provided, send Telegram message
    if (chatId) {
      const telegramMessage = 
        '✅ <b>Password Reset Successful!</b>\n\n' +
        `Your new password is: <code>${newPassword}</code>\n\n` +
        '⚠️ <b>Important:</b>\n' +
        '• Please login and change this password immediately\n' +
        '• Keep this password secure\n' +
        '• Delete this message after logging in\n\n' +
        '🔗 Login at: https://vividplate.com/login';
      
      await sendTelegramMessage(chatId, telegramMessage);
    }

    return {
      success: true,
      message: 'Password reset successful',
      newPassword: newPassword
    };
    
  } catch (error) {
    console.error('Error in Telegram password reset:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password. Please try again later.'
    };
  }
}

// Process incoming Telegram webhook
export async function processTelegramWebhook(update: any): Promise<void> {
  try {
    // Handle phone number contact sharing
    if (update.message && update.message.contact) {
      const chatId = update.message.chat.id;
      const contact = update.message.contact;
      const phoneNumber = contact.phone_number;
      
      console.log('User shared contact:', { chatId, phoneNumber, firstName: contact.first_name });
      
      // Automatically reset password using shared phone number
      const resetResult = await handleTelegramPasswordReset(phoneNumber, chatId.toString());
      
      if (resetResult.success) {
        await sendTelegramMessage(chatId.toString(),
          '🎉 <b>Phone Number Registered Successfully!</b>\n\n' +
          'Your phone number has been verified and your password has been reset automatically.\n\n' +
          '<b>What\'s next:</b>\n' +
          '• Check your new temporary password above\n' +
          '• Login to your VividPlate account\n' +
          '• Change your password immediately\n\n' +
          '💡 <b>Future resets:</b> You can now use <code>/reset</code> without typing your phone number!'
        );
      } else {
        await sendTelegramMessage(chatId.toString(),
          '❌ <b>Phone Number Not Found</b>\n\n' +
          `We couldn't find a VividPlate account with phone number: <code>${phoneNumber}</code>\n\n` +
          '<b>Solutions:</b>\n' +
          '• Make sure you registered with this phone number\n' +
          '• Try registering a new account if needed\n' +
          '• Use <code>/register</code> for registration info\n' +
          '• Contact support if you need help\n\n' +
          '🔗 Register at: https://vividplate.com/register'
        );
      }
      return;
    }
    
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text.trim();
      
      // Check if message starts with /reset command (handles both /reset and /reset-password)
      if (messageText.startsWith('/reset')) {
        const phoneNumber = messageText.replace('/reset', '').trim();
        
        if (!phoneNumber) {
          await sendTelegramMessage(chatId.toString(), 
            '📱 <b>VividPlate Password Reset</b>\n\n' +
            'Please send your phone number after the /reset command.\n\n' +
            'Example: <code>/reset +1234567890</code>\n\n' +
            'Make sure to include the phone number you used when registering your account.'
          );
          return;
        }

        // Validate phone number format (more flexible validation)
        const phoneRegex = /^\+?[0-9\s\-\(\)]{7,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
          await sendTelegramMessage(chatId.toString(),
            '❌ <b>Invalid Phone Number Format</b>\n\n' +
            'Please provide a valid phone number in one of these formats:\n' +
            '• <code>/reset +1234567890</code> (International)\n' +
            '• <code>/reset 0912345678</code> (Local Ethiopian)\n' +
            '• <code>/reset +251912345678</code> (Ethiopian with country code)\n' +
            '• <code>/reset 1234567890</code> (Without symbols)\n\n' +
            'The bot will try multiple formats to find your account.'
          );
          return;
        }

        // Process password reset with chat ID for messaging
        const resetResult = await handleTelegramPasswordReset(phoneNumber, chatId.toString());
        
        if (!resetResult.success) {
          await sendTelegramMessage(chatId.toString(),
            '❌ <b>Password Reset Failed</b>\n\n' +
            resetResult.message + '\n\n' +
            '<b>Troubleshooting:</b>\n' +
            '• Make sure you use the same phone number from your account\n' +
            '• Try different formats: +251912345678 or 0912345678\n' +
            '• Contact support if the issue persists'
          );
        }
      } 
      // Help and start commands
      else if (messageText.startsWith('/help') || messageText.startsWith('/start')) {
        // Check if this is the first time user is starting the bot
        if (messageText.startsWith('/start')) {
          // Send welcome message with phone number request
          await sendTelegramMessageWithPhoneRequest(chatId.toString(),
            '🤖 <b>Welcome to VividPlate Password Reset Bot!</b>\n\n' +
            'To get started and enable automatic password resets, please share your phone number by clicking the button below.\n\n' +
            '<b>Why we need your phone number:</b>\n' +
            '• Automatic password reset without typing commands\n' +
            '• Secure verification of your VividPlate account\n' +
            '• Instant access to your account recovery\n\n' +
            '🔒 <b>Your privacy is protected:</b> We only use your phone number for account verification and password resets.',
            '📱 Share Phone Number'
          );
        } else {
          // Regular help command
          await sendTelegramMessage(chatId.toString(),
            '🤖 <b>VividPlate Password Reset Bot</b>\n\n' +
            '<b>Available Commands:</b>\n' +
            '• <code>/start</code> - Start conversation with bot\n' +
            '• <code>/help</code> - Show this help message\n' +
            '• <code>/reset [phone_number]</code> - Reset your password\n' +
            '• <code>/register</code> - Get registration information\n' +
            '• <code>/reset-password</code> - Alternative reset command\n\n' +
            '<b>How to reset your password:</b>\n' +
            '1. Send: <code>/reset [your_phone_number]</code>\n' +
            '2. Use any of these formats:\n' +
            '   • <code>/reset +251912345678</code> (International)\n' +
            '   • <code>/reset 0912345678</code> (Ethiopian local)\n' +
            '   • <code>/reset +1234567890</code> (US/International)\n' +
            '3. You\'ll receive a new temporary password\n' +
            '4. Login and change your password immediately\n\n' +
            '📞 Make sure to use the same phone number you registered with.'
          );
        }
      }
      // Register command
      else if (messageText.startsWith('/register')) {
        await sendTelegramMessage(chatId.toString(),
          '📝 <b>VividPlate Registration</b>\n\n' +
          'To create a new account on VividPlate:\n\n' +
          '1. Visit: <a href="https://vividplate.com/register">vividplate.com/register</a>\n' +
          '2. Fill in your details:\n' +
          '   • Username\n' +
          '   • Email address\n' +
          '   • Phone number (required for password reset)\n' +
          '   • Password\n' +
          '3. Complete registration\n' +
          '4. Start creating your digital restaurant menu\n\n' +
          '<b>Features Available:</b>\n' +
          '• Digital menu creation\n' +
          '• QR code generation\n' +
          '• Multi-language support\n' +
          '• Mobile-responsive design\n' +
          '• Real-time menu updates\n\n' +
          '💡 <b>Tip:</b> Make sure to add your phone number during registration so you can use this bot for password resets!'
        );
      }
      // Alternative reset-password command
      else if (messageText.startsWith('/reset-password')) {
        await sendTelegramMessage(chatId.toString(),
          '🔑 <b>Password Reset Instructions</b>\n\n' +
          'To reset your password, use this command:\n' +
          '<code>/reset [your_phone_number]</code>\n\n' +
          '<b>Examples:</b>\n' +
          '• <code>/reset +251912345678</code>\n' +
          '• <code>/reset 0912345678</code>\n' +
          '• <code>/reset +1234567890</code>\n\n' +
          '<b>Alternative Methods:</b>\n' +
          '1. Visit: <a href="https://vividplate.com/forgot-password">vividplate.com/forgot-password</a>\n' +
          '2. Use email reset option\n' +
          '3. Contact support if needed\n\n' +
          '⚠️ <b>Important:</b> Use the same phone number you registered with.'
        );
      }
      // Unknown command
      else {
        await sendTelegramMessage(chatId.toString(),
          '❓ <b>Unknown Command</b>\n\n' +
          '<b>Available Commands:</b>\n' +
          '• <code>/start</code> - Start conversation\n' +
          '• <code>/help</code> - Show help\n' +
          '• <code>/reset [phone]</code> - Reset password\n' +
          '• <code>/register</code> - Registration info\n' +
          '• <code>/reset-password</code> - Password reset help\n\n' +
          'Send <code>/help</code> for detailed instructions.'
        );
      }
    }
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
  }
}