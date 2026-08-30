const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME || 'farmabusca', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'postgres', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
  },
});

const connectDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    const shouldAlter = process.env.DB_SYNC_ALTER === 'true';
    await sequelize.sync({ alter: shouldAlter, force: false });

    const { Category, User } = require('../models');
    await Category.bulkCreate([
      { name: 'Analgésicos', description: 'Medicamentos para dor e febre' },
      { name: 'Antibióticos', description: 'Medicamentos antibióticos' },
      { name: 'Vitaminas', description: 'Suplementos vitamínicos' },
      { name: 'Antialérgicos', description: 'Medicamentos para alergias' },
    ], { ignoreDuplicates: true });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Administrador FarmaBusca';
    const adminPhone = process.env.ADMIN_PHONE || null;

    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ where: { email: adminEmail } });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password: hashedPassword,
          role: 'ADMIN',
        });
        console.log('Admin user created from env credentials.');
      } else if (existingAdmin.role !== 'ADMIN') {
        console.warn(`Admin email ${adminEmail} already exists with role ${existingAdmin.role}. Please confirm this account.`);
      }
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { sequelize, connectDb };
