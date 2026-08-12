const { sequelize } = require('../config/database');
const User = require('./User');
const Pharmacy = require('./Pharmacy');
const Category = require('./Category');
const Medicine = require('./Medicine');
const Favorite = require('./Favorite');

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

module.exports = { sequelize, User, Pharmacy, Category, Medicine, Favorite };
