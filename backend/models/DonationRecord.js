const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DonationRecord = sequelize.define('DonationRecord', {
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
  blood_type: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    comment: 'Quantity in milliliters'
  },
  donation_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'donation_records',
  timestamps: true
});

module.exports = DonationRecord;

