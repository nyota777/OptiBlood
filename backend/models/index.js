const User = require('./User');
const Donor = require('./Donor');
const DonationRecord = require('./DonationRecord');
const DonationSchedule = require('./DonationSchedule');
const Inventory = require('./Inventory');
const Prediction = require('./Prediction');
const Alert = require('./Alert');
const EmailHistory = require('./EmailHistory');

// Define associations

// DonationRecord belongs to Donor
DonationRecord.belongsTo(Donor, {
  foreignKey: 'donor_id',
  as: 'donor'
});
Donor.hasMany(DonationRecord, {
  foreignKey: 'donor_id',
  as: 'donations'
});

// DonationRecord belongs to User (hospital)
DonationRecord.belongsTo(User, {
  foreignKey: 'hospital_id',
  as: 'hospital'
});
User.hasMany(DonationRecord, {
  foreignKey: 'hospital_id',
  as: 'donations'
});

// Inventory belongs to User (hospital)
Inventory.belongsTo(User, {
  foreignKey: 'hospital_id',
  as: 'hospital'
});
User.hasMany(Inventory, {
  foreignKey: 'hospital_id',
  as: 'inventory'
});

// EmailHistory belongs to User (sender)
EmailHistory.belongsTo(User, {
  foreignKey: 'sent_by',
  as: 'sender'
});
User.hasMany(EmailHistory, {
  foreignKey: 'sent_by',
  as: 'emailHistory'
});

// DonationSchedule belongs to Donor
DonationSchedule.belongsTo(Donor, {
  foreignKey: 'donor_id',
  as: 'donor'
});
Donor.hasMany(DonationSchedule, {
  foreignKey: 'donor_id',
  as: 'schedules'
});

// DonationSchedule belongs to User (hospital)
DonationSchedule.belongsTo(User, {
  foreignKey: 'hospital_id',
  as: 'hospital'
});
User.hasMany(DonationSchedule, {
  foreignKey: 'hospital_id',
  as: 'schedules'
});

module.exports = {
  User,
  Donor,
  DonationRecord,
  DonationSchedule,
  Inventory,
  Prediction,
  Alert,
  EmailHistory
};

