const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EmailHistory = sequelize.define('EmailHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sent_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who sent the email'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  template_type: {
    type: DataTypes.ENUM('appreciation', 'shortage', 'appointment', 'custom'),
    allowNull: true
  },
  recipient_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  recipients: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of recipient objects: [{donorId, donorName, email, status}]'
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'email_history',
  timestamps: true
});

module.exports = EmailHistory;

