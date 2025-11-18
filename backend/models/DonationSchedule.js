const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DonationSchedule = sequelize.define('DonationSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  donor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'donors',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  hospital_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  scheduled_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  scheduled_time: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Time in HH:MM format (e.g., "09:00")'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'scheduled'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'donation_schedules',
  timestamps: true
});

module.exports = DonationSchedule;

