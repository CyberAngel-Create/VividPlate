import axios from 'axios';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

const TELEGRAM_BOT_TOKEN = '8489095054:AAGWvYjcHg3L8-JXnhEJo3OGgA9HWuwEIAI';
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

// Handle password reset via phone number
export async function handleTelegramPasswordReset(phoneNumber: string): Promise<{ success: boolean; message: string; newPassword?: string }> {
  try {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Find user by phone number
    const user = await storage.getUserByPhone(cleanedPhone);
    
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
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text.trim();
      
      // Check if message starts with /reset command
      if (messageText.startsWith('/reset')) {
        const phoneNumber = messageText.replace('/reset', '').trim();
        
        if (!phoneNumber) {
          await sendTelegramMessage(chatId, 
            '📱 <b>VividPlate Password Reset</b>\n\n' +
            'Please send your phone number after the /reset command.\n\n' +
            'Example: <code>/reset +1234567890</code>\n\n' +
            'Make sure to include the phone number you used when registering your account.'
          );
          return;
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
          await sendTelegramMessage(chatId,
            '❌ <b>Invalid Phone Number</b>\n\n' +
            'Please provide a valid phone number.\n\n' +
            'Example: <code>/reset +1234567890</code>'
          );
          return;
        }

        // Process password reset
        const resetResult = await handleTelegramPasswordReset(phoneNumber);
        
        if (resetResult.success && resetResult.newPassword) {
          await sendTelegramMessage(chatId,
            '✅ <b>Password Reset Successful!</b>\n\n' +
            `Your new password is: <code>${resetResult.newPassword}</code>\n\n` +
            '⚠️ <b>Important:</b>\n' +
            '• Please login and change this password immediately\n' +
            '• Keep this password secure\n' +
            '• Delete this message after logging in\n\n' +
            '🔗 Login at: https://vividplate.com/login'
          );
        } else {
          await sendTelegramMessage(chatId,
            '❌ <b>Password Reset Failed</b>\n\n' +
            resetResult.message
          );
        }
      } 
      // Help command
      else if (messageText.startsWith('/help') || messageText.startsWith('/start')) {
        await sendTelegramMessage(chatId,
          '🤖 <b>VividPlate Password Reset Bot</b>\n\n' +
          '<b>Available Commands:</b>\n' +
          '• <code>/reset [phone_number]</code> - Reset your password\n' +
          '• <code>/help</code> - Show this help message\n\n' +
          '<b>How to reset your password:</b>\n' +
          '1. Send: <code>/reset +1234567890</code>\n' +
          '2. Replace +1234567890 with your registered phone number\n' +
          '3. You\'ll receive a new temporary password\n' +
          '4. Login and change your password immediately\n\n' +
          '📞 Make sure to use the same phone number you registered with.'
        );
      }
      // Unknown command
      else {
        await sendTelegramMessage(chatId,
          '❓ <b>Unknown Command</b>\n\n' +
          'Send <code>/help</code> to see available commands.\n\n' +
          'To reset your password, use: <code>/reset [your_phone_number]</code>'
        );
      }
    }
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
  }
}