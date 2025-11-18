# 📧 Email Setup Guide for OptiBlood

## Quick Setup (Gmail)

### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable it

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as device, enter "OptiBlood"
4. Click **Generate**
5. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Create or edit `backend/.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=OptiBlood Blood Management System <your-email@gmail.com>
```

**Note:** If you don't set `EMAIL_FROM`, it will automatically use: `OptiBlood Blood Management System <your-email@gmail.com>`

**Important:**
- Use the **App Password** (16 characters), NOT your regular Gmail password
- Remove spaces from the App Password when pasting
- The App Password should be 16 characters without spaces

### Step 4: Restart Backend Server
```bash
cd backend
# Stop the server (Ctrl + C)
npm run dev  # Start again
```

## Testing Email Configuration

You can test if your email is configured correctly by checking the backend console when you try to send an email. You should see:
- ✅ `✉️ Email sent: [message-id]` - Success!
- ❌ `❌ Email sending failed` - Check the error message

## Troubleshooting

### Error: "Invalid login: 535-5.7.8"
**Solution:**
- Make sure you're using an **App Password**, not your regular password
- Verify 2-Step Verification is enabled
- Check that EMAIL_USER and EMAIL_PASS are set correctly in .env
- Restart the backend server after updating .env

### Error: "Email credentials not configured"
**Solution:**
- Create `backend/.env` file if it doesn't exist
- Add EMAIL_USER and EMAIL_PASS variables
- Restart the backend server

### Emails not arriving
**Check:**
- Spam/Junk folder
- Backend console for error messages
- That the recipient email address is correct
- Gmail account activity for blocked login attempts

## Alternative: Use Other Email Providers

If you don't want to use Gmail, you can modify `backend/utils/emailService.js` to use other providers (Outlook, SendGrid, etc.).

For example, for Outlook:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

