# Telegram Bot Commands Reference

## Available Commands

### `/start`
Initiates the bot interaction and shows the phone number request interface.

**Response:**
- Welcome message with user's first name
- Custom keyboard with "📞 Share Phone Number" button
- Instructions for sharing contact information

**Example:**
```
User: /start
Bot: Hello John! 👋

Welcome to the Phone Number Bot. To get started, please share your phone number by tapping the button below.

[📞 Share Phone Number]
```

## Contact Sharing Flow

### 1. Button Tap
When user taps the "📞 Share Phone Number" button:
- Telegram shows native permission dialog
- User must explicitly confirm to share contact
- Bot receives contact message if user approves

### 2. Confirmation Response
Bot processes the shared contact and responds with:

```
✅ Thank you for sharing your contact!

📱 Phone Number: +1234567890
👤 Name: John Doe

Your phone number has been received successfully.
```

## Technical Implementation

### Request Contact Button
```javascript
const keyboard = {
  keyboard: [
    [
      {
        text: '📞 Share Phone Number',
        request_contact: true  // This enables phone number access
      }
    ]
  ],
  resize_keyboard: true,      // Adjust keyboard size
  one_time_keyboard: true     // Hide keyboard after use
};
```

### Contact Message Handler
```javascript
bot.on('contact', (msg) => {
  const contact = msg.contact;
  const phoneNumber = contact.phone_number;
  const firstName = contact.first_name;
  const lastName = contact.last_name;
  
  // Process the contact information
  console.log('Received:', { phoneNumber, firstName, lastName });
});
```

## Bot Permissions

The bot requires these permissions to function:
- **Send messages**: To send welcome and confirmation messages
- **Receive messages**: To process /start command and contact shares
- **Read contact info**: When user explicitly shares via button

## Security Features

1. **Explicit Consent**: Users must tap button and confirm in native dialog
2. **One-on-One Only**: Bot only works in private chats for privacy
3. **No Storage**: Phone numbers are logged but not persisted (add your own storage)
4. **One-Time Keyboard**: Button disappears after successful sharing

## Error Handling

### Invalid Bot Token
```
❌ Error: TELEGRAM_BOT_TOKEN environment variable is required
Please set your Telegram bot token in the environment variables.
You can get a bot token by messaging @BotFather on Telegram.
```

### Polling Errors
```javascript
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
  // Bot continues running and attempts to reconnect
});
```

### Network Issues
The `node-telegram-bot-api` library handles:
- Automatic reconnection on network failures
- Request retries with exponential backoff
- Connection timeout handling

## Usage Examples

### Basic Bot Setup
```javascript
require('dotenv').config();
const PhoneNumberBot = require('./telegram-bot');

const bot = new PhoneNumberBot(process.env.TELEGRAM_BOT_TOKEN);
// Bot is now running and handling commands
```

### Manual Phone Request
```javascript
// Request phone number with custom message
bot.requestPhoneNumber(chatId, "Please verify your identity by sharing your phone number:");
```

### Graceful Shutdown
```javascript
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});
```

## Testing Commands

### Run the Example Bot
```bash
node telegram-bot-example.js
```

### Test Bot Connection
```bash
node telegram-bot-test.js
```

This will verify:
- Bot token validity
- Connection status  
- Bot information (name, username, ID)
- Polling/webhook mode

## Integration with Main Application

The phone number bot can be integrated with the VividPlate restaurant platform for:

1. **Password Reset**: Users enter phone number, bot sends verification
2. **Account Verification**: Link Telegram account to restaurant profile  
3. **Notifications**: Send menu updates or order confirmations
4. **Customer Support**: Direct communication channel

### Integration Example
```javascript
// In your main application
const PhoneNumberBot = require('./telegram-bot');

class RestaurantBot extends PhoneNumberBot {
  handleContact(msg) {
    super.handleContact(msg); // Get phone number
    
    // Custom logic for restaurant platform
    const phoneNumber = msg.contact.phone_number;
    this.linkToUserAccount(phoneNumber, msg.from.id);
  }
  
  async linkToUserAccount(phone, telegramId) {
    // Find user by phone number in database
    // Update user record with Telegram ID
    // Send success confirmation
  }
}
```

## Deployment Notes

- Set `TELEGRAM_BOT_TOKEN` environment variable in production
- Consider using webhooks instead of polling for production
- Implement proper logging and monitoring
- Add rate limiting to prevent spam
- Store contact information securely if needed