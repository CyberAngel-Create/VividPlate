# Telegram Phone Number Bot

A Node.js library for creating Telegram bots that request and handle phone number sharing using custom keyboards with `request_contact=True`.

## Features

- ✅ Custom keyboard with phone number request button
- ✅ Handles contact sharing with confirmation messages
- ✅ `/start` command support
- ✅ One-on-one chat functionality
- ✅ Proper error handling and logging
- ✅ Graceful shutdown support
- ✅ Environment variable configuration

## Setup

### 1. Get a Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy your bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Install Dependencies

```bash
npm install node-telegram-bot-api dotenv
```

### 3. Set Environment Variable

Create a `.env` file or set the environment variable:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Usage

### Basic Implementation

```javascript
const PhoneNumberBot = require('./telegram-bot');

// Create bot instance
const bot = new PhoneNumberBot(process.env.TELEGRAM_BOT_TOKEN);

// Bot is now running and will handle:
// - /start command
// - Phone number sharing
// - Contact confirmations
```

### Run the Example

```bash
node telegram-bot-example.js
```

### Test the Bot

```bash
node telegram-bot-test.js
```

## Bot Workflow

1. **User sends `/start`**
   - Bot responds with welcome message
   - Shows custom keyboard with "📞 Share Phone Number" button

2. **User taps the button**
   - Telegram requests permission to share contact
   - User confirms in the native dialog

3. **Bot receives contact**
   - Processes the phone number and name
   - Sends confirmation message with received details
   - Removes the custom keyboard

## API Reference

### PhoneNumberBot Class

#### Constructor
```javascript
new PhoneNumberBot(token)
```
- `token`: Your Telegram bot token

#### Methods

##### `requestPhoneNumber(chatId, customMessage?)`
Manually request a phone number from a user.

```javascript
bot.requestPhoneNumber(chatId, "Please share your phone number to verify your account:");
```

##### `stopPolling()`
Stop the bot's polling for new messages.

```javascript
bot.stopPolling();
```

### Events Handled

- **`/start` command**: Shows welcome message with phone request button
- **`contact` message**: Processes shared phone numbers
- **`polling_error`**: Handles polling errors gracefully

## Example Messages

### Welcome Message
```
Hello John! 👋

Welcome to the Phone Number Bot. To get started, please share your phone number by tapping the button below.

[📞 Share Phone Number]
```

### Confirmation Message
```
✅ Thank you for sharing your contact!

📱 Phone Number: +1234567890
👤 Name: John Doe

Your phone number has been received successfully.
```

## Security Considerations

- The bot only works in **one-on-one chats** for privacy
- Phone numbers are only shared when users explicitly tap the button
- Users see a native Telegram confirmation dialog before sharing
- No phone data is stored by default (add your own storage logic)

## Error Handling

The bot includes comprehensive error handling:

- **Invalid tokens**: Clear error messages with setup instructions
- **Polling errors**: Logged but don't crash the bot
- **Network issues**: Automatic retry via node-telegram-bot-api
- **Missing environment variables**: Validation with helpful messages

## Customization

### Custom Welcome Message

```javascript
bot.handleStart = function(msg) {
  const chatId = msg.chat.id;
  const customMessage = "Your custom welcome message here!";
  
  const keyboard = {
    keyboard: [[{
      text: '📞 Share Phone Number',
      request_contact: true
    }]],
    resize_keyboard: true,
    one_time_keyboard: true
  };

  this.bot.sendMessage(chatId, customMessage, {
    reply_markup: keyboard
  });
};
```

### Custom Button Text

```javascript
const keyboard = {
  keyboard: [[{
    text: '📱 Share My Contact',  // Custom button text
    request_contact: true
  }]],
  resize_keyboard: true,
  one_time_keyboard: true
};
```

## Troubleshooting

### Common Issues

1. **"ETELEGRAM" Error**
   - Check bot token is correct
   - Ensure bot isn't running elsewhere
   - Verify internet connection

2. **Button Not Showing**
   - Ensure `request_contact: true` is set
   - Check keyboard structure is correct
   - Verify bot is in one-on-one chat

3. **No Response to /start**
   - Check bot token permissions
   - Ensure polling is active
   - Look for error messages in console

### Testing

Use the test script to verify everything works:

```bash
node telegram-bot-test.js
```

This will check:
- Bot token validity
- Connection status
- Bot information
- Webhook/polling mode

## License

MIT License - feel free to use in your projects!