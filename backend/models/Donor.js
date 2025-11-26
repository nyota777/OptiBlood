const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Donor = sequelize.define('Donor', {
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
      isEmail: true,
      notEmpty: true
    }
  },
  blood_type: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  last_donation_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_donations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  total_donated_ml: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Total volume of blood donated in milliliters'
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 18,
      max: 100
    }
  },
  weight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 40,
      max: 200
    }
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
    comment: 'Donor gender for KNBTS donation interval rules'
  }
}, {
  tableName: 'donors',
  timestamps: true
});

module.exports = Donor;

