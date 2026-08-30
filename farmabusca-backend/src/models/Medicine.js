const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medicine = sequelize.define('Medicine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pharmacyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'pharmacies', key: 'id' },
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'categories', key: 'id' },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  stockStatus: {
    type: DataTypes.ENUM('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'),
    allowNull: false,
    defaultValue: 'AVAILABLE',
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'medicines',
  timestamps: true,
});

module.exports = Medicine;
