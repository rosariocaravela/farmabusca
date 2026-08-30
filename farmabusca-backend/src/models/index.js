const { sequelize } = require('../config/database');
const User = require('./User');
const Pharmacy = require('./Pharmacy');
const Category = require('./Category');
const Medicine = require('./Medicine');
const Favorite = require('./Favorite');
const Payment = require('./Payment');
const AuditLog = require('./AuditLog');
const PharmacyFavorite = require('./PharmacyFavorite');

User.hasOne(Pharmacy, { foreignKey: 'userId' });
Pharmacy.belongsTo(User, { foreignKey: 'userId' });

Pharmacy.hasMany(Medicine, { foreignKey: 'pharmacyId' });
Medicine.belongsTo(Pharmacy, { foreignKey: 'pharmacyId' });

Category.hasMany(Medicine, { foreignKey: 'categoryId' });
Medicine.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(Favorite, { foreignKey: 'userId' });
Favorite.belongsTo(User, { foreignKey: 'userId' });

Medicine.hasMany(Favorite, { foreignKey: 'medicineId' });
Favorite.belongsTo(Medicine, { foreignKey: 'medicineId' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });
Medicine.hasMany(Payment, { foreignKey: 'medicineId' });
Payment.belongsTo(Medicine, { foreignKey: 'medicineId' });
User.hasMany(AuditLog, { foreignKey: 'actorId' });
AuditLog.belongsTo(User, { foreignKey: 'actorId' });
User.hasMany(PharmacyFavorite, { foreignKey: 'userId' });
PharmacyFavorite.belongsTo(User, { foreignKey: 'userId' });
Pharmacy.hasMany(PharmacyFavorite, { foreignKey: 'pharmacyId' });
PharmacyFavorite.belongsTo(Pharmacy, { foreignKey: 'pharmacyId' });

module.exports = { sequelize, User, Pharmacy, Category, Medicine, Favorite, PharmacyFavorite, Payment, AuditLog };
