const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
  medicineId: { type: DataTypes.UUID, allowNull: true, references: { model: 'medicines', key: 'id' } },
  plan: { type: DataTypes.STRING, allowNull: true },
  provider: { type: DataTypes.ENUM('MPESA'), allowNull: false, defaultValue: 'MPESA' },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 25 },
  phone: { type: DataTypes.STRING, allowNull: false },
  requestId: { type: DataTypes.STRING, allowNull: false },
  reference: { type: DataTypes.STRING, allowNull: false, unique: true },
  providerTransactionId: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'), allowNull: false, defaultValue: 'PENDING' },
  failureReason: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [{ fields: ['userId'] }, { fields: ['medicineId'] }, { unique: true, fields: ['userId', 'requestId'] }],
});

module.exports = Payment;
