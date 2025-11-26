const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email notification
 * @param {string|Object} toOrOptions - Recipient email address OR options object {to, subject, html}
 * @param {string} [subject] - Email subject (if first param is string)
 * @param {string} [html] - HTML content (if first param is string)
 */
const sendEmail = async (toOrOptions, subject, html) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
      throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
    }

    const transporter = createTransporter();

    // Verify connection before sending
    await transporter.verify();

    // Support both object and individual parameters
    let to, emailSubject, emailHtml;
    if (typeof toOrOptions === 'object' && toOrOptions.to) {
      to = toOrOptions.to;
      emailSubject = toOrOptions.subject;
      emailHtml = toOrOptions.html;
    } else {
      to = toOrOptions;
      emailSubject = subject;
      emailHtml = html;
    }

    // Create professional "From" address
    const emailFrom = process.env.EMAIL_FROM || 
      (process.env.EMAIL_USER 
        ? `OptiBlood Blood Management System <${process.env.EMAIL_USER}>`
        : 'OptiBlood System <noreply@optiblood.com>');

    const mailOptions = {
      from: emailFrom,
      to,
      subject: emailSubject,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Email sent:', info.messageId);
    return true; // Return boolean for compatibility
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login') || error.message.includes('535-5.7.8')) {
      console.error('\n📧 Gmail Authentication Error:');
      console.error('   1. Make sure 2-Step Verification is enabled on your Google Account');
      console.error('   2. Generate an App Password (not your regular password):');
      console.error('      - Go to: https://myaccount.google.com/apppasswords');
      console.error('      - Generate password for "Mail"');
      console.error('   3. Update .env file with:');
      console.error(`      EMAIL_USER=${process.env.EMAIL_USER || 'your-email@gmail.com'}`);
      console.error('      EMAIL_PASS=your-16-character-app-password');
      console.error('   4. Restart the backend server\n');
    }
    
    return false; // Return boolean for compatibility
  }
};

/**
 * Send low stock alert email
 */
const sendLowStockAlert = async (recipients, bloodType, units) => {
  const subject = `🚨 Low Stock Alert: ${bloodType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">⚠️ Low Stock Alert</h2>
      <p>This is an automated alert from OptiBlood System.</p>
      <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">Blood Type: ${bloodType}</h3>
        <p style="font-size: 16px;"><strong>Current Units:</strong> ${units}</p>
        <p style="color: #856404;">⚠️ Stock levels are below the minimum threshold of ${process.env.ALERT_LOW_THRESHOLD || 10} units.</p>
      </div>
      <p><strong>Action Required:</strong></p>
      <ul>
        <li>Contact eligible donors immediately</li>
        <li>Coordinate with nearby blood centers</li>
        <li>Update inventory management system</li>
      </ul>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message from OptiBlood System. Please do not reply to this email.
      </p>
    </div>
  `;

  const promises = recipients.map(recipient => sendEmail({ to: recipient, subject, html }));
  return Promise.allSettled(promises);
};

/**
 * Send expiry alert email
 */
const sendExpiryAlert = async (recipients, bloodType, expiryDate, units) => {
  const subject = `⏰ Blood Expiry Warning: ${bloodType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f57c00;">⏰ Blood Expiry Warning</h2>
      <p>This is an automated alert from OptiBlood System.</p>
      <div style="background-color: #ffe0b2; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #e65100;">Blood Type: ${bloodType}</h3>
        <p style="font-size: 16px;"><strong>Units:</strong> ${units}</p>
        <p style="font-size: 16px;"><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
        <p style="color: #e65100;">⚠️ This blood supply will expire within ${process.env.ALERT_EXPIRY_DAYS || 3} days.</p>
      </div>
      <p><strong>Action Required:</strong></p>
      <ul>
        <li>Prioritize usage of expiring units</li>
        <li>Notify relevant departments</li>
        <li>Update inventory status if expired</li>
      </ul>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message from OptiBlood System. Please do not reply to this email.
      </p>
    </div>
  `;

  const promises = recipients.map(recipient => sendEmail({ to: recipient, subject, html }));
  return Promise.allSettled(promises);
};

/**
 * Send shortage prediction alert email to hospital staff
 */
const sendShortageAlert = async (recipients, bloodType, probability, hospitalName) => {
  const subject = `🔮 Predicted Shortage Alert: ${bloodType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c62828;">🔮 Predicted Shortage Alert</h2>
      <p>This is an automated alert from OptiBlood AI Prediction System.</p>
      <div style="background-color: #ffcdd2; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #b71c1c;">Blood Type: ${bloodType}</h3>
        <p style="font-size: 16px;"><strong>Hospital:</strong> ${hospitalName || 'Your Hospital'}</p>
        <p style="font-size: 16px;"><strong>Shortage Probability:</strong> ${(probability * 100).toFixed(1)}%</p>
        <p style="color: #b71c1c;">⚠️ Our AI model predicts a potential shortage for this blood type.</p>
      </div>
      <p><strong>Recommended Actions:</strong></p>
      <ul>
        <li>Contact eligible donors immediately</li>
        <li>Schedule additional donation drives</li>
        <li>Coordinate with regional blood banks</li>
        <li>Review and optimize current inventory</li>
        <li>Consider requesting blood from other hospitals</li>
      </ul>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message from OptiBlood System. Please do not reply to this email.
      </p>
    </div>
  `;

  const promises = recipients.map(recipient => sendEmail({ to: recipient, subject, html }));
  return Promise.allSettled(promises);
};

/**
 * Send shortage alert email to donors with matching blood type
 */
const sendDonorShortageAlert = async (donorEmail, donorName, bloodType, hospitalName, hospitalContact) => {
  const subject = `🩸 Urgent: Blood Donation Needed - ${bloodType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🩸 Urgent Blood Donation Request</h2>
      <p>Hello ${donorName},</p>
      <p>We hope this message finds you well. Our AI prediction system has identified a potential shortage of <strong>${bloodType}</strong> blood type.</p>
      <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Your Blood Type is Needed!</h3>
        <p style="font-size: 16px;"><strong>Blood Type:</strong> ${bloodType}</p>
        <p style="font-size: 16px;"><strong>Hospital:</strong> ${hospitalName}</p>
        ${hospitalContact ? `<p style="font-size: 16px;"><strong>Contact:</strong> ${hospitalContact}</p>` : ''}
      </div>
      <p><strong>Your donation can save lives!</strong></p>
      <p>We are reaching out because you are a registered donor with blood type <strong>${bloodType}</strong>, which is currently in high demand.</p>
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: #0369a1; margin-top: 0;">How You Can Help:</h3>
        <ul style="color: #0c4a6e;">
          <li>Contact ${hospitalName} to schedule a donation appointment</li>
          <li>Visit our nearest blood donation center</li>
          <li>Participate in upcoming blood drives</li>
        </ul>
      </div>
      <p style="color: #dc2626; font-weight: bold;">Every donation matters. Your contribution can make a significant difference in someone's life.</p>
      <p>Thank you for being a lifesaver!</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        OptiBlood - AI-Powered Blood Management System<br>
        This is an automated message. If you have questions, please contact ${hospitalName || 'your local hospital'}.
      </p>
    </div>
  `;

  return await sendEmail({ to: donorEmail, subject, html });
};

/**
 * Send 2FA verification code via email
 */
const send2FACode = async (userEmail, userName, code) => {
  const subject = 'OptiBlood - Your 2FA Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🔐 Two-Factor Authentication</h2>
      <p>Hello ${userName},</p>
      <p>You're logging in to your OptiBlood account. Use the verification code below to complete your login:</p>
      <div style="background-color: #f0f9ff; padding: 20px; border-left: 4px solid #0369a1; margin: 20px 0; text-align: center;">
        <h1 style="color: #0369a1; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
      </div>
      <p style="color: #666;"><strong>This code will expire in 10 minutes.</strong></p>
      <p style="color: #dc2626;">⚠️ If you didn't request this code, please secure your account immediately.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #999; font-size: 12px;">
        OptiBlood - AI-Powered Blood Management System<br>
        This is an automated message, please do not reply.
      </p>
    </div>
  `;

  return await sendEmail({ to: userEmail, subject, html });
};

module.exports = {
  sendEmail,
  sendLowStockAlert,
  sendExpiryAlert,
  sendShortageAlert,
  sendDonorShortageAlert,
  send2FACode
};

