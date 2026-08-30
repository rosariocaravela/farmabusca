const { sequelize, User, Pharmacy, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { SAFE_USER_ATTRIBUTES, sanitizeUser } = require('../utils/authPolicy');
const { validateCoordinates } = require('../utils/geo');

const safeUserInclude = { model: User, attributes: SAFE_USER_ATTRIBUTES };
const recordAudit = (actorId, action, entityType, entityId, metadata = null) => AuditLog.create({ actorId, action, entityType, entityId, metadata });
const assertPharmacyLocationReady = (pharmacy) => {
  const missing = ['province', 'district', 'neighborhood', 'address'].filter((field) => !String(pharmacy[field] || '').trim());
  if (missing.length) {
    const error = new Error(`Complete a localização antes de aprovar: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  validateCoordinates(pharmacy.latitude, pharmacy.longitude, { required: true });
};

const listUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${String(search).trim()}%` } },
        { email: { [Op.iLike]: `%${String(search).trim()}%` } },
        { phone: { [Op.iLike]: `%${String(search).trim()}%` } },
      ];
    }
    if (['PATIENT', 'PHARMACY', 'ADMIN'].includes(String(role || '').toUpperCase())) where.role = String(role).toUpperCase();
    if (status === 'active') where.isActive = true;
    if (status === 'suspended') where.isActive = false;
    const users = await User.findAll({ where, attributes: SAFE_USER_ATTRIBUTES, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: users.map(sanitizeUser) });
  } catch (error) {
    next(error);
  }
};

const listPendingPharmacies = async (req, res, next) => {
  try {
    const pharmacies = await Pharmacy.findAll({ where: { approved: false, suspended: false, reviewStatus: 'PENDING' }, include: [safeUserInclude], order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: pharmacies });
  } catch (error) {
    next(error);
  }
};

const listAllPharmacies = async (req, res, next) => {
  try {
    const { search, city, district, province, status } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { district: { [Op.iLike]: `%${search}%` } },
        { province: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }
    if (district) {
      where.district = { [Op.iLike]: `%${district}%` };
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
      where.reviewStatus = 'PENDING';
    } else if (status === 'suspended') {
      where.suspended = true;
    } else if (status === 'rejected') {
      where.reviewStatus = 'REJECTED';
    }

    const pharmacies = await Pharmacy.findAll({ where, include: [safeUserInclude], order: [['createdAt', 'DESC']] });
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
      assertPharmacyLocationReady(pharmacy);
      pharmacy.approved = true;
      pharmacy.suspended = false;
      pharmacy.reviewStatus = 'APPROVED';
    } else if (action === 'suspend') {
      pharmacy.approved = false;
      pharmacy.suspended = true;
      pharmacy.reviewStatus = 'SUSPENDED';
    } else if (action === 'reject') {
      pharmacy.approved = false;
      pharmacy.suspended = false;
      pharmacy.reviewStatus = 'REJECTED';
    } else {
      return res.status(400).json({ success: false, message: 'Ação inválida' });
    }

    await pharmacy.save();
    await recordAudit(req.user.id, `PHARMACY_${String(action).toUpperCase()}`, 'Pharmacy', pharmacy.id);
    res.json({ success: true, message: 'Status atualizado', data: pharmacy });
  } catch (error) {
    next(error);
  }
};

const getAdminSummary = async (req, res, next) => {
  try {
    const totalPatients = await User.count({ where: { role: 'PATIENT' } });
    const activePatients = await User.count({ where: { role: 'PATIENT', isActive: true } });
    const suspendedUsers = await User.count({ where: { isActive: false } });
    const totalPharmacies = await Pharmacy.count();
    const approvedPharmacies = await Pharmacy.count({ where: { approved: true, suspended: false } });
    const pendingPharmacies = await Pharmacy.count({ where: { approved: false, suspended: false, reviewStatus: 'PENDING' } });
    const rejectedPharmacies = await Pharmacy.count({ where: { reviewStatus: 'REJECTED' } });
    const suspendedPharmacies = await Pharmacy.count({ where: { suspended: true } });
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
        totalPatients,
        activePatients,
        suspendedUsers,
        totalPharmacies,
        approvedPharmacies,
        pendingPharmacies,
        rejectedPharmacies,
        suspendedPharmacies,
        provincesCount,
        pharmaciesByProvince,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    const isActive = req.body.isActive;
    if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'Estado do utilizador inválido' });
    if (user.id === req.user.id && !isActive) return res.status(400).json({ success: false, message: 'Não pode suspender a própria conta' });
    user.isActive = isActive;
    await user.save();
    await recordAudit(req.user.id, isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED', 'User', user.id, { role: user.role });
    return res.json({ success: true, message: isActive ? 'Utilizador activado' : 'Utilizador suspenso', data: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const approvePharmacy = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findByPk(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    }

    assertPharmacyLocationReady(pharmacy);
    pharmacy.approved = true;
    pharmacy.suspended = false;
    pharmacy.reviewStatus = 'APPROVED';
    await pharmacy.save();
    await recordAudit(req.user.id, 'PHARMACY_APPROVED', 'Pharmacy', pharmacy.id);
    res.json({ success: true, message: 'Farmácia aprovada', data: pharmacy });
  } catch (error) {
    next(error);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const logs = await AuditLog.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'], required: false }],
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    return next(error);
  }
};

const updatePharmacyLocation = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findByPk(req.params.id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    const coordinates = validateCoordinates(req.body.latitude, req.body.longitude, { required: true });
    const neighborhood = String(req.body.neighborhood || '').trim();
    const address = String(req.body.address || '').trim();
    if (neighborhood.length < 2 || neighborhood.length > 160 || address.length < 3 || address.length > 255) {
      return res.status(400).json({ success: false, message: 'Bairro ou endereço inválido' });
    }
    await pharmacy.update({ neighborhood, address, latitude: coordinates.latitude, longitude: coordinates.longitude });
    await recordAudit(req.user.id, 'PHARMACY_LOCATION_UPDATED', 'Pharmacy', pharmacy.id, { fieldsChanged: ['neighborhood', 'address', 'latitude', 'longitude'] });
    return res.json({ success: true, message: 'Localização da farmácia actualizada', data: pharmacy });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUsers,
  listPendingPharmacies,
  listAllPharmacies,
  updatePharmacyStatus,
  getAdminSummary,
  approvePharmacy,
  updateUserStatus,
  listAuditLogs,
  updatePharmacyLocation,
};
