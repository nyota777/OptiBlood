const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { sendEmail, send2FACode } = require('../utils/emailService');

// Password reset utility functions
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new hospital staff (requires email verification)
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, hospital_name, role } = req.body;

    if (!name || !email || !password || !hospital_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, hospital_name'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate email verification token
    const verificationToken = generateResetToken();
    const hashedToken = hashResetToken(verificationToken);

    // Create user with unverified email
    const user = await User.create({
      name,
      email,
      password,
      hospital_name,
      role: role || 'staff',
      email_verified: false,
      email_verification_token: hashedToken,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Create verification URL
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationURL = `${frontendURL}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'OptiBlood - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Welcome to OptiBlood!</h2>
          <p>Hello ${user.name},</p>
          <p>Thank you for registering with OptiBlood. Please verify your email address to complete your registration.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0369a1; margin: 20px 0;">
            <p style="margin: 0; color: #0c4a6e;"><strong>Hospital:</strong> ${user.hospital_name}</p>
            <p style="margin: 5px 0 0 0; color: #0c4a6e;"><strong>Email:</strong> ${user.email}</p>
          </div>
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationURL}" 
             style="display: inline-block; padding: 12px 24px; background-color: #dc2626; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationURL}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with OptiBlood, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            OptiBlood - AI-Powered Blood Management System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    });

    if (!emailSent) {
      // If email fails, still create user but log error
      console.error('Failed to send verification email to:', user.email);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hospital_name: user.hospital_name,
          role: user.role,
          email_verified: user.email_verified
        },
        requiresVerification: true,
        message: 'A verification email has been sent to your email address. Please check your inbox and click the verification link to activate your account.'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is OAuth user
    if (user.oauth_provider && !user.password) {
      return res.status(401).json({
        success: false,
        message: `Please login with ${user.oauth_provider}`
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      // Return temporary token for 2FA verification
      const tempToken = jwt.sign(
        { userId: user.id, temp: true },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '10m' }
      );

      // If email 2FA, send code immediately
      if (user.two_factor_method === 'email') {
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = hashResetToken(code);

        // Save hashed code
        user.two_factor_email_code = hashedCode;
        user.two_factor_email_code_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send code via email
        await send2FACode(user.email, user.name, code);
      }

      return res.status(200).json({
        success: true,
        message: user.two_factor_method === 'email' 
          ? '2FA code sent to your email. Please check your inbox.'
          : '2FA verification required',
        requires2FA: true,
        method: user.two_factor_method,
        tempToken
      });
    }

    // Generate full JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hospital_name: user.hospital_name,
          role: user.role,
          two_factor_enabled: user.two_factor_enabled
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ✅ Google OAuth Routes

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: false // Handle failure manually
  }),
  async (req, res) => {
    try {
      // Check if authentication failed
      if (!req.user) {
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendURL}?view=login&error=oauth_failed`);
      }

      // Ensure OAuth users have verified email
      if (!req.user.email_verified) {
        req.user.email_verified = true;
        await req.user.save();
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Redirect to frontend with token and user data
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      const userData = encodeURIComponent(JSON.stringify({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        hospital_name: req.user.hospital_name,
        role: req.user.role,
        two_factor_enabled: req.user.two_factor_enabled
      }));
      
      res.redirect(`${frontendURL}?view=auth-callback&token=${token}&user=${userData}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}?view=login&error=oauth_callback_failed`);
    }
  }
);

// ✅ 2FA Routes

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Generate 2FA secret and QR code (for app) or send email code (for email)
 * @access  Private
 */
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const { method } = req.body; // 'app' or 'email'
    const user = await User.findByPk(req.user.id);

    if (!method || !['app', 'email'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify 2FA method: "app" or "email"'
      });
    }

    if (method === 'app') {
      // Generate secret for authenticator app
      const secret = speakeasy.generateSecret({
        name: `OptiBlood (${user.email})`,
        length: 32
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      // Save secret temporarily (not enabled yet)
      user.two_factor_secret = secret.base32;
      user.two_factor_method = null; // Will be set after verification
      await user.save();

      res.status(200).json({
        success: true,
        method: 'app',
        data: {
          secret: secret.base32,
          qrCode,
          manual_entry_key: secret.base32
        }
      });
    } else if (method === 'email') {
      // Generate 6-digit code for email 2FA
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = hashResetToken(code);

      // Save hashed code temporarily (not enabled yet)
      user.two_factor_email_code = hashedCode;
      user.two_factor_email_code_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.two_factor_method = null; // Will be set after verification
      await user.save();

      // Send code via email
      const emailSent = await send2FACode(user.email, user.name, code);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send 2FA code. Please try again.'
        });
      }

      res.status(200).json({
        success: true,
        method: 'email',
        message: '2FA code sent to your email. Please check your inbox and enter the code to complete setup.',
        data: {
          email: user.email
        }
      });
    }
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: '2FA setup failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify and enable 2FA (supports both app and email methods)
 * @access  Private
 */
router.post('/2fa/verify', authenticate, async (req, res) => {
  try {
    const { token, method } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!method || !['app', 'email'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify 2FA method: "app" or "email"'
      });
    }

    if (method === 'app') {
      // Verify authenticator app code
      if (!user.two_factor_secret) {
        return res.status(400).json({
          success: false,
          message: 'Please setup 2FA first'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }

      // Enable 2FA with app method
      user.two_factor_enabled = true;
      user.two_factor_method = 'app';
      await user.save();

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully with authenticator app'
      });
    } else if (method === 'email') {
      // Verify email code
      if (!user.two_factor_email_code) {
        return res.status(400).json({
          success: false,
          message: 'Please setup 2FA first'
        });
      }

      // Check if code expired
      if (new Date() > user.two_factor_email_code_expires) {
        return res.status(400).json({
          success: false,
          message: '2FA code has expired. Please request a new code.'
        });
      }

      // Hash the provided code and compare
      const hashedCode = hashResetToken(token);
      if (hashedCode !== user.two_factor_email_code) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }

      // Enable 2FA with email method
      user.two_factor_enabled = true;
      user.two_factor_method = 'email';
      user.two_factor_email_code = null; // Clear code after verification
      user.two_factor_email_code_expires = null;
      await user.save();

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully with email verification'
      });
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: '2FA verification failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/2fa/validate
 * @desc    Validate 2FA code during login (supports both app and email methods)
 * @access  Public (requires temp token)
 */
router.post('/2fa/validate', async (req, res) => {
  try {
    const { tempToken, token } = req.body;

    if (!tempToken || !token) {
      return res.status(400).json({
        success: false,
        message: 'Temp token and 2FA code required'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'supersecretkey');
    
    if (!decoded.temp) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.two_factor_enabled) {
      return res.status(401).json({
        success: false,
        message: 'Invalid request'
      });
    }

    let verified = false;

    // Verify based on 2FA method
    if (user.two_factor_method === 'app') {
      // Verify authenticator app code
      if (!user.two_factor_secret) {
        return res.status(400).json({
          success: false,
          message: '2FA not properly configured'
        });
      }

      verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token,
        window: 2
      });
    } else if (user.two_factor_method === 'email') {
      // Verify email code
      if (!user.two_factor_email_code) {
        return res.status(400).json({
          success: false,
          message: '2FA code not found. Please request a new code.'
        });
      }

      // Check if code expired
      if (new Date() > user.two_factor_email_code_expires) {
        return res.status(400).json({
          success: false,
          message: '2FA code has expired. Please request a new code.'
        });
      }

      // Hash the provided code and compare
      const hashedCode = hashResetToken(token);
      verified = hashedCode === user.two_factor_email_code;

      // Clear code after verification (success or failure)
      if (verified) {
        user.two_factor_email_code = null;
        user.two_factor_email_code_expires = null;
        await user.save();
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA method'
      });
    }

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }

    // Generate full JWT token
    const fullToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: fullToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hospital_name: user.hospital_name,
          role: user.role,
          two_factor_enabled: user.two_factor_enabled,
          two_factor_method: user.two_factor_method
        }
      }
    });
  } catch (error) {
    console.error('2FA validation error:', error);
    res.status(500).json({
      success: false,
      message: '2FA validation failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/2fa/resend-code
 * @desc    Resend 2FA code via email (for email 2FA method)
 * @access  Public (requires temp token)
 */
router.post('/2fa/resend-code', async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({
        success: false,
        message: 'Temp token is required'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'supersecretkey');
    
    if (!decoded.temp) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.two_factor_enabled || user.two_factor_method !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'Email 2FA is not enabled for this account'
      });
    }

    // Generate new 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = hashResetToken(code);

    // Save hashed code
    user.two_factor_email_code = hashedCode;
    user.two_factor_email_code_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send code via email
    const emailSent = await send2FACode(user.email, user.name, code);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send 2FA code. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: '2FA code sent to your email. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend 2FA code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend 2FA code',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findByPk(req.user.id);

    // Verify password before disabling
    if (!user.oauth_provider) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    user.two_factor_enabled = false;
    user.two_factor_secret = null;
    user.two_factor_method = null;
    user.two_factor_email_code = null;
    user.two_factor_email_code_expires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: error.message
    });
  }
});

// ✅ Password Reset Routes

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user is OAuth user
    if (user.oauth_provider && !user.password) {
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.oauth_provider} sign-in. Password reset is not available.`
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);

    // Save hashed token and expiry (1 hour)
    user.password_reset_token = hashedToken;
    user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Create reset URL
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetURL = `${frontendURL}/reset-password?token=${resetToken}`;

    // Send email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'OptiBlood - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password for your OptiBlood account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetURL}" 
             style="display: inline-block; padding: 12px 24px; background-color: #dc2626; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetURL}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            OptiBlood - AI-Powered Blood Management System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token to match database
    const hashedToken = hashResetToken(token);

    // Find user with valid token
    const user = await User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          [Op.gt]: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password; // Will be hashed by beforeSave hook
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'OptiBlood - Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Password Changed Successfully</h2>
          <p>Hello ${user.name},</p>
          <p>Your password has been changed successfully.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            OptiBlood - AI-Powered Blood Management System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/verify-reset-token/:token
 * @desc    Verify if reset token is valid
 * @access  Public
 */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token',
      error: error.message
    });
  }
});

// ✅ NEW: Email Verification Routes

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address with token
 * @access  Public
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      where: {
        email_verification_token: hashedToken,
        email_verification_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          email: user.email,
          email_verified: true
        }
      });
    }

    // Verify email
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await user.save();

    // Generate JWT token for immediate login
    const loginToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      data: {
        token: loginToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hospital_name: user.hospital_name,
          role: user.role,
          email_verified: true
        }
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = generateResetToken();
    const hashedToken = hashResetToken(verificationToken);

    // Update user with new token
    user.email_verification_token = hashedToken;
    user.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Create verification URL
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationURL = `${frontendURL}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'OptiBlood - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Verify Your Email Address</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a new verification link for your OptiBlood account.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0369a1; margin: 20px 0;">
            <p style="margin: 0; color: #0c4a6e;"><strong>Hospital:</strong> ${user.hospital_name}</p>
            <p style="margin: 5px 0 0 0; color: #0c4a6e;"><strong>Email:</strong> ${user.email}</p>
          </div>
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationURL}" 
             style="display: inline-block; padding: 12px 24px; background-color: #dc2626; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationURL}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't request this verification link, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            OptiBlood - AI-Powered Blood Management System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password (requires current password)
 * @access  Private
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is OAuth user (no password)
    if (user.oauth_provider && !user.password) {
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.oauth_provider} sign-in. Password change is not available.`
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed by beforeUpdate hook)
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'OptiBlood - Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Password Changed Successfully</h2>
          <p>Hello ${user.name},</p>
          <p>Your password has been changed successfully.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            OptiBlood - AI-Powered Blood Management System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'hospital_name', 'role', 'oauth_provider', 'two_factor_enabled', 'email_verified', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

module.exports = router;