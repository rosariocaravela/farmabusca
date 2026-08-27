const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PharmacyFavorite = sequelize.define('PharmacyFavorite', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
  pharmacyId: { type: DataTypes.UUID, allowNull: false, references: { model: 'pharmacies', key: 'id' } },
}, {
  tableName: 'pharmacy_favorites',
  timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'pharmacyId'] }],
});

module.exports = PharmacyFavorite;
