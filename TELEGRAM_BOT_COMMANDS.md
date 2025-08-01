# Telegram Bot Commands Reference

## Available Commands

### `/start`
Shows welcome message with complete list of available commands and quick access buttons.

**Response:**
- Welcome message with user's first name
- Complete list of all available commands
- Custom keyboard with verification and help buttons
- Overview of bot functionality

**Example:**
```
User: /start
Bot: Hello John! 👋

Welcome to VividPlate Bot - Your restaurant management assistant.

Available Commands:

🔹 /start - Show this welcome message and commands
🔹 /reset - Reset your account password (requires phone verification)
🔹 /help - Get detailed help information
🔹 /status - Check your phone verification status
🔹 /verify - Start phone number verification process

To get started with password reset functionality, you'll need to verify your phone number first.

Type any command or tap the verification button below:

[📞 Verify Phone Number] [/help] [/reset]
```

### `/reset`
Initiates password reset process for verified users.

**Behavior:**
- Requires phone verification first
- Shows reset instructions if verified
- Prompts verification if not verified
- Logs reset requests for security

**Example (Verified User):**
```
User: /reset
Bot: 🔐 Password Reset Process

📱 Verified Phone: +1234567890

Your password reset request has been initiated. Here's what happens next:

1️⃣ A verification code will be sent to your registered email
2️⃣ Enter the code in the VividPlate app or website  
3️⃣ Create your new password

⏱️ The verification code will expire in 15 minutes.
```

**Example (Unverified User):**
```
User: /reset
Bot: 🔒 Password Reset Unavailable

You need to verify your phone number before you can reset your password.

📱 Tap the button below to verify your phone number first:

[📞 Verify Phone Number]
```

### `/help`
Provides detailed help information about all commands and features.

**Response:**
- Detailed explanation of each command
- Phone verification process explanation
- Security information
- Support contact information

### `/status`
Shows current phone verification status and account information.

**Example (Verified):**
```
User: /status
Bot: ✅ Verification Status: VERIFIED

📱 Phone: +1234567890
👤 Name: John Doe
⏰ Verified: 1/1/2025, 12:00:00 PM

🔓 You can now use /reset to change your password.
🔒 Your account is secure and ready for recovery.
```

**Example (Not Verified):**
```
User: /status
Bot: ❌ Verification Status: NOT VERIFIED

To use password reset and other secure features, you need to verify your phone number first.

📱 Tap the button below or send /verify to start:

[📞 Verify Phone Number]
```

### `/verify`
Starts or restarts the phone number verification process.

**Response:**
- Explanation of verification purpose
- Security information about data handling
- Custom keyboard with contact sharing button
- Cancel option

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
3. **Database Verification**: Phone numbers are checked against VividPlate user database
4. **Registration Requirement**: Only registered VividPlate users can reset passwords
5. **One-Time Keyboard**: Button disappears after successful sharing
6. **Secure Logging**: All verification attempts are logged for security monitoring

## Database Integration

### Phone Number Verification Process
1. User shares phone number via Telegram
2. Bot generates multiple phone number format variations (+251, 0-prefix, etc.)
3. Database query checks all variations against VividPlate users table
4. If found: User is verified and can reset password
5. If not found: User receives registration instructions

### Registration Check Results

**For Registered Users:**
```
✅ Phone Number Verified & Registered!

📱 Phone: +251912345678
👤 Telegram Name: John Doe
🏷️ VividPlate Account: john@example.com
🆔 Account Name: John Smith

Your phone number has been verified and matches a registered VividPlate account.

🔐 You can now use /reset to change your password.
```

**For Unregistered Users:**
```
❌ Phone Number Not Found

📱 Phone: +251912345678
👤 Name: John Doe

This phone number is not registered in the VividPlate system.

🔍 To use password reset and secure features:
1️⃣ Register at VividPlate with this phone number
2️⃣ Complete your account setup
3️⃣ Return here to verify and reset password
```

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

### Run the Enhanced Bot
```bash
node run-telegram-bot.js
```

### Run the Basic Example Bot
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