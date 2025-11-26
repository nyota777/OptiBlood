const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // ✅ Changed to allow null for OAuth users
    validate: {
      len: [6, 100]
    }
  },
  hospital_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'staff'),
    defaultValue: 'staff'
  },
  
  // ✅ NEW: Google OAuth fields
  google_id: {
    type: DataTypes.STRING,
    allowNull: true,
    //unique: true, commented out to allow linking with existing email accounts. will add constraints manually.
    comment: 'Google OAuth user ID'
  },
  oauth_provider: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'OAuth provider: google, facebook, etc.'
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Profile picture URL from OAuth provider'
  },
  
  // ✅ NEW: Two-Factor Authentication fields
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether 2FA is enabled for this user'
  },
  two_factor_secret: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Secret key for TOTP 2FA (base32 encoded)'
  },
  two_factor_method: {
    type: DataTypes.ENUM('app', 'email'),
    allowNull: true,
    comment: 'Method of 2FA: authenticator app or email'
  },
  two_factor_email_code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Temporary 6-digit code for email 2FA (hashed)'
  },
  two_factor_email_code_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiration time for email 2FA code (10 minutes)'
  },
  
  // ✅ NEW: Email verification fields
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether email has been verified'
  },
  email_verification_token: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Token for email verification'
  },
  email_verification_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiration time for email verification token'
  },
  
  // ✅ NEW: Additional security fields
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last successful login timestamp'
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of consecutive failed login attempts'
  },
  account_locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Account lock expiration time (after too many failed attempts)'
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hash password before saving
    beforeCreate: async (user) => {
      // Only hash password if it exists (OAuth users may not have passwords)
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // Only hash password if it was changed and exists
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  // Return false if user doesn't have a password (OAuth users)
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ NEW: Method to check if account is locked
User.prototype.isAccountLocked = function() {
  if (!this.account_locked_until) {
    return false;
  }
  // Check if lock has expired
  if (new Date() > this.account_locked_until) {
    // Lock has expired, reset
    this.account_locked_until = null;
    this.failed_login_attempts = 0;
    return false;
  }
  return true;
};

// ✅ NEW: Method to increment failed login attempts
User.prototype.incrementFailedLogins = async function() {
  this.failed_login_attempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failed_login_attempts >= 5) {
    const lockDuration = 30 * 60 * 1000; // 30 minutes
    this.account_locked_until = new Date(Date.now() + lockDuration);
  }
  
  await this.save();
};

// ✅ NEW: Method to reset failed login attempts on successful login
User.prototype.resetFailedLogins = async function() {
  if (this.failed_login_attempts > 0 || this.account_locked_until) {
    this.failed_login_attempts = 0;
    this.account_locked_until = null;
    await this.save();
  }
};

// ✅ NEW: Method to update last login timestamp
User.prototype.updateLastLogin = async function() {
  this.last_login = new Date();
  await this.save();
};

module.exports = User;