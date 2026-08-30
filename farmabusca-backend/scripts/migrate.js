require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/config/database');

const migrationName = '001-demo-readiness';
const reviewStatusMigration = '002-pharmacy-review-status';
const pharmacyFavoritesMigration = '003-pharmacy-favorites';
const pharmacyCoordinatesMigration = '004-pharmacy-coordinates';
const binaryStockStatusMigration = '005-binary-stock-status';

async function applyMigration(queryInterface, transaction) {
  const users = await queryInterface.describeTable('users');
  if (!users.isActive) {
    await queryInterface.addColumn('users', 'isActive', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }, { transaction });
  }

  const medicines = await queryInterface.describeTable('medicines');
  if (!medicines.isActive) {
    await queryInterface.addColumn('medicines', 'isActive', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }, { transaction });
  }

  await queryInterface.addIndex('favorites', ['userId', 'medicineId'], {
    unique: true,
    name: 'favorites_user_medicine_unique',
    transaction,
  }).catch((error) => {
    if (!/already exists|duplicate/i.test(error.message)) throw error;
  });

  await queryInterface.createTable('audit_logs', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actorId: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
    action: { type: DataTypes.STRING, allowNull: false },
    entityType: { type: DataTypes.STRING, allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { transaction }).catch((error) => {
    if (!/already exists/i.test(error.message)) throw error;
  });
}

async function run() {
  await sequelize.authenticate();
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.createTable('schema_migrations', {
    name: { type: DataTypes.STRING, primaryKey: true },
    executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }).catch((error) => {
    if (!/already exists/i.test(error.message)) throw error;
  });

  const [rows] = await sequelize.query('SELECT name FROM schema_migrations');
  const executed = new Set(rows.map((row) => row.name));
  if (!executed.has(migrationName)) {
    await sequelize.transaction(async (transaction) => {
      await applyMigration(queryInterface, transaction);
      await queryInterface.bulkInsert('schema_migrations', [{ name: migrationName, executedAt: new Date() }], { transaction });
    });
    console.log(`Migration applied: ${migrationName}`);
  }
  if (!executed.has(reviewStatusMigration)) {
    await sequelize.transaction(async (transaction) => {
      const pharmacies = await queryInterface.describeTable('pharmacies');
      if (!pharmacies.reviewStatus) {
        await queryInterface.addColumn('pharmacies', 'reviewStatus', { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'), allowNull: false, defaultValue: 'PENDING' }, { transaction });
        await sequelize.query('UPDATE pharmacies SET "reviewStatus" = (CASE WHEN suspended = true THEN \'SUSPENDED\' WHEN approved = true THEN \'APPROVED\' ELSE \'PENDING\' END)::"enum_pharmacies_reviewStatus"', { transaction });
      }
      await queryInterface.bulkInsert('schema_migrations', [{ name: reviewStatusMigration, executedAt: new Date() }], { transaction });
    });
    console.log(`Migration applied: ${reviewStatusMigration}`);
  }
  if (!executed.has(pharmacyFavoritesMigration)) {
    await sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('pharmacy_favorites', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        pharmacyId: { type: DataTypes.UUID, allowNull: false, references: { model: 'pharmacies', key: 'id' }, onDelete: 'CASCADE' },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      }, { transaction });
      await queryInterface.addIndex('pharmacy_favorites', ['userId', 'pharmacyId'], { unique: true, name: 'pharmacy_favorites_user_pharmacy_unique', transaction });
      await queryInterface.bulkInsert('schema_migrations', [{ name: pharmacyFavoritesMigration, executedAt: new Date() }], { transaction });
    });
    console.log(`Migration applied: ${pharmacyFavoritesMigration}`);
  }
  if (!executed.has(pharmacyCoordinatesMigration)) {
    await sequelize.transaction(async (transaction) => {
      const pharmacies = await queryInterface.describeTable('pharmacies');
      if (!pharmacies.neighborhood) await queryInterface.addColumn('pharmacies', 'neighborhood', { type: DataTypes.STRING, allowNull: true }, { transaction });
      if (!pharmacies.latitude) await queryInterface.addColumn('pharmacies', 'latitude', { type: DataTypes.DOUBLE, allowNull: true }, { transaction });
      if (!pharmacies.longitude) await queryInterface.addColumn('pharmacies', 'longitude', { type: DataTypes.DOUBLE, allowNull: true }, { transaction });
      await queryInterface.bulkInsert('schema_migrations', [{ name: pharmacyCoordinatesMigration, executedAt: new Date() }], { transaction });
    });
    console.log(`Migration applied: ${pharmacyCoordinatesMigration}`);
  }
  if (!executed.has(binaryStockStatusMigration)) {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query('UPDATE medicines SET "stockStatus" = \'AVAILABLE\' WHERE "stockStatus" = \'LOW_STOCK\'', { transaction });
      await queryInterface.bulkInsert('schema_migrations', [{ name: binaryStockStatusMigration, executedAt: new Date() }], { transaction });
    });
    console.log(`Migration applied: ${binaryStockStatusMigration}`);
  }
  console.log('Database migrations are up to date.');
}

run().then(() => sequelize.close()).catch(async (error) => {
  console.error('Migration failed:', error.message);
  await sequelize.close();
  process.exit(1);
});
