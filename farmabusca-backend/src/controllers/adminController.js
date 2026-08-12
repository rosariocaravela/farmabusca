const { sequelize, User, Pharmacy, Medicine, Category } = require('../models');
const { Op } = require('sequelize');

const listUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const listPendingPharmacies = async (req, res, next) => {
  try {
    const pharmacies = await Pharmacy.findAll({ where: { approved: false, suspended: false }, include: [User], order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: pharmacies });
  } catch (error) {
    next(error);
  }
};

const listAllPharmacies = async (req, res, next) => {
  try {
    const { search, city, province, status } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { province: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }
    if (province) {
      where.province = { [Op.iLike]: `%${province}%` };
    }
    if (status === 'approved') {
      where.approved = true;
      where.suspended = false;
    } else if (status === 'pending') {
      where.approved = false;
      where.suspended = false;
    } else if (status === 'suspended') {
      where.suspended = true;
    }

    const pharmacies = await Pharmacy.findAll({ where, include: [User], order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: pharmacies });
  } catch (error) {
    next(error);
  }
};

const updatePharmacyStatus = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findByPk(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    }

    const { action } = req.body;
    if (action === 'approve') {
      pharmacy.approved = true;
      pharmacy.suspended = false;
    } else if (action === 'suspend') {
      pharmacy.approved = false;
      pharmacy.suspended = true;
    } else if (action === 'reject') {
      pharmacy.approved = false;
      pharmacy.suspended = true;
    } else {
      return res.status(400).json({ success: false, message: 'Ação inválida' });
    }

    await pharmacy.save();
    res.json({ success: true, message: 'Status atualizado', data: pharmacy });
  } catch (error) {
    next(error);
  }
};

const getAdminSummary = async (req, res, next) => {
  try {
    const totalPharmacies = await Pharmacy.count();
    const approvedPharmacies = await Pharmacy.count({ where: { approved: true, suspended: false } });
    const pendingPharmacies = await Pharmacy.count({ where: { approved: false, suspended: false } });
    const suspendedPharmacies = await Pharmacy.count({ where: { suspended: true } });
    const totalMedicines = await Medicine.count();
    const availableMedicines = await Medicine.count({ where: { stockStatus: 'AVAILABLE' } });
    const lowStockMedicines = await Medicine.count({ where: { stockStatus: 'LOW_STOCK' } });
    const outOfStockMedicines = await Medicine.count({ where: { stockStatus: 'OUT_OF_STOCK' } });
    const pharmaciesByProvince = await Pharmacy.findAll({
      where: { approved: true, suspended: false },
      attributes: ['province', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['province'],
      raw: true,
    });
    const provincesCount = new Set(pharmaciesByProvince.map((item) => item.province).filter(Boolean)).size;

    res.json({
      success: true,
      data: {
        totalPharmacies,
        approvedPharmacies,
        pendingPharmacies,
        suspendedPharmacies,
        totalMedicines,
        availableMedicines,
        lowStockMedicines,
        outOfStockMedicines,
        provincesCount,
        pharmaciesByProvince,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listAdminMedicines = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const include = [
      { model: Category, attributes: ['id', 'name'] },
      { model: Pharmacy, attributes: ['id', 'name', 'province'], where: { approved: true, suspended: false }, required: true },
    ];
    if (category) {
      include[0].where = { name: { [Op.iLike]: `%${category}%` } };
      include[0].required = true;
    }

    const medicines = await Medicine.findAll({ where, include, order: [['name', 'ASC']] });
    res.json({ success: true, data: medicines });
  } catch (error) {
    next(error);
  }
};

const approvePharmacy = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findByPk(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    }

    pharmacy.approved = true;
    pharmacy.suspended = false;
    await pharmacy.save();
    res.json({ success: true, message: 'Farmácia aprovada', data: pharmacy });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  listPendingPharmacies,
  listAllPharmacies,
  updatePharmacyStatus,
  getAdminSummary,
  listAdminMedicines,
  approvePharmacy,
};
