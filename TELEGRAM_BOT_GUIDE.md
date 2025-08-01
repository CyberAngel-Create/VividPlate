# VividPlate Telegram Bot Password Reset Guide

## 🤖 Bot Information
- **Bot Username**: @Vividplatebot
- **Bot ID**: 8489095054
- **Status**: Active and Working ✅

## 📱 How to Reset Your Password

### Step 1: Find the Bot
1. Open Telegram on your phone or computer
2. In the search bar, type: `@Vividplatebot`
3. Click on the bot to start a conversation
4. Press "START" to begin

### Step 2: Use the Reset Command
Send this exact message to the bot:
```
/reset +YOUR_PHONE_NUMBER
```

**Examples:**
- `/reset +251977816299` (Ethiopian number)
- `/reset +1234567890` (US format)
- `/reset 0977816299` (Local format also works)

### Step 3: Get Your New Password
1. The bot will immediately process your request
2. If your phone number is registered, you'll receive a new temporary password
3. Copy this password and use it to log into your account
4. **Important**: Change this password immediately after logging in

## ✅ Testing Results

### Successful Test
```
Request: /reset 0977816299
Response: Password reset successful
New Password: uVOhcSa7Pk
```

### API Endpoints Working
- ✅ `/api/auth/telegram-reset` - Direct password reset
- ✅ `/webhook/telegram` - Telegram webhook handler
- ✅ Database phone number lookup
- ✅ Password generation and hashing

### Current User Data
- Username: `entotocloud`
- Phone: `0977816299` ✅
- Email: `entotocloudrestaurant@gmail.com`

## 🔧 Technical Details

### Bot Commands Available
- `/help` - Show help message
- `/reset [phone_number]` - Reset password for the phone number

### Security Features
- Phone number validation
- Secure password generation (10 characters)
- Password hashing with bcrypt
- Database updates with proper error handling

### Error Handling
- Invalid phone number format
- Phone number not found in database
- Database connection issues
- Failed password updates

## 🚀 How to Use

1. **For Users**: Visit `/password-reset-help` on the website for a complete guide
2. **For Testing**: Use the test script `test-telegram-bot.js`
3. **For Admin**: Monitor logs in the admin dashboard

## 📋 Troubleshooting

### Common Issues
1. **"No account found"** - Phone number not registered
2. **"Chat not found"** - Invalid chat ID (normal for test messages)
3. **Bot not responding** - Check webhook configuration

### Solutions
1. Ensure phone number is added to user profile
2. Use exact format: `/reset +PHONENUMBER`
3. Contact support if persistent issues

## 🔗 Related Pages
- Website: `/password-reset-help`
- Login: `/login`
- Profile: `/profile` (to add/update phone number)
- Admin: `/admin` (for user management)

---

**Last Updated**: August 1, 2025
**Status**: Fully Functional ✅