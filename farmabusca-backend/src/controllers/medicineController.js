const { Medicine, Category, Pharmacy, User } = require('../models');
const { Op } = require('sequelize');
const { uploadImage } = require('../services/cloudinaryService');
const { PUBLIC_PHARMACY_ATTRIBUTES } = require('../utils/pharmacyPolicy');
const { rankByProximity, validateCoordinates } = require('../utils/geo');

const buildPublicQuery = (query = {}, requireName = false) => {
  const name = String(query.name || '').trim();
  if (requireName && !name) {
    const error = new Error('Informe o nome do medicamento');
    error.statusCode = 400;
    throw error;
  }
  const medicineWhere = { isActive: true };
  if (name) medicineWhere.name = { [Op.iLike]: `%${name}%` };
  if (query.stockStatus === 'AVAILABLE') medicineWhere.stockStatus = { [Op.in]: ['AVAILABLE', 'LOW_STOCK'] };
  if (query.stockStatus === 'OUT_OF_STOCK') medicineWhere.stockStatus = 'OUT_OF_STOCK';
  const minPrice = query.minPrice === undefined || query.minPrice === '' ? null : Number(query.minPrice);
  const maxPrice = query.maxPrice === undefined || query.maxPrice === '' ? null : Number(query.maxPrice);
  if ((minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) || (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) || (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) {
    const error = new Error('Intervalo de preço inválido');
    error.statusCode = 400;
    throw error;
  }
  if (minPrice !== null || maxPrice !== null) medicineWhere.price = { ...(minPrice !== null ? { [Op.gte]: minPrice } : {}), ...(maxPrice !== null ? { [Op.lte]: maxPrice } : {}) };

  const pharmacyWhere = { approved: true, suspended: false, reviewStatus: 'APPROVED' };
  const pharmacy = String(query.pharmacy || '').trim();
  if (pharmacy) pharmacyWhere[Op.or] = [{ id: /^[0-9a-f-]{36}$/i.test(pharmacy) ? pharmacy : null }, { name: { [Op.iLike]: `%${pharmacy}%` } }].filter((condition) => !('id' in condition) || condition.id);
  const location = String(query.location || '').trim();
  if (location) {
    pharmacyWhere[Op.and] = [{ [Op.or]: ['neighborhood', 'address', 'city', 'district', 'province', 'location'].map((field) => ({ [field]: { [Op.iLike]: `%${location}%` } })) }];
  }
  const coordinates = validateCoordinates(query.latitude, query.longitude);
  const radiusKm = query.radiusKm === undefined || query.radiusKm === '' ? null : Number(query.radiusKm);
  if (radiusKm !== null && ![1, 3, 5, 10].includes(radiusKm)) {
    const error = new Error('Raio deve ser 1, 3, 5 ou 10 km');
    error.statusCode = 400;
    throw error;
  }
  if (radiusKm !== null && !coordinates) {
    const error = new Error('Informe latitude e longitude para filtrar por raio');
    error.statusCode = 400;
    throw error;
  }
  const order = query.sort === 'price_desc' ? [['price', 'DESC']] : query.sort === 'price_asc' ? [['price', 'ASC']] : [['name', 'ASC'], ['price', 'ASC']];
  return {
    options: { where: medicineWhere, include: [Category, { model: Pharmacy, attributes: PUBLIC_PHARMACY_ATTRIBUTES, where: pharmacyWhere, required: true, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }] }], order },
    coordinates,
    radiusKm,
    sort: String(query.sort || (coordinates ? 'distance' : 'name')),
  };
};

const findPublicMedicines = async (query, requireName = false) => {
  const { options, coordinates, radiusKm, sort } = buildPublicQuery(query, requireName);
  const medicines = await Medicine.findAll(options);
  return rankByProximity(medicines.map((medicine) => medicine.toJSON()), coordinates, { radiusKm, sort });
};

const findManageablePharmacy = (userId) => Pharmacy.findOne({
  where: { userId, approved: true, suspended: false },
});

const listMedicines = async (req, res, next) => {
  try {
    const medicines = await findPublicMedicines(req.query);
    res.json({ success: true, message: 'Medicamentos listados', data: medicines });
  } catch (error) {
    next(error);
  }
};

const searchMedicines = async (req, res, next) => {
  try {
    const medicines = await findPublicMedicines(req.query, true);
    res.json({ success: true, message: 'Pesquisa concluída', data: medicines });
  } catch (error) {
    next(error);
  }
};

const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({
      where: { id: req.params.id, isActive: true },
      include: [Category, { model: Pharmacy, attributes: PUBLIC_PHARMACY_ATTRIBUTES, where: { approved: true, suspended: false, reviewStatus: 'APPROVED' }, required: true, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }] }],
    });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicamento não encontrado' });
    }
    res.json({ success: true, message: 'Medicamento carregado', data: medicine });
  } catch (error) {
    next(error);
  }
};

const createMedicine = async (req, res, next) => {
  try {
    const pharmacy = await findManageablePharmacy(req.user.id);
    if (!pharmacy) {
      return res.status(403).json({
        success: false,
        message: 'A farmácia deve existir, estar aprovada e não estar suspensa',
      });
    }

    let categoryId = req.body.categoryId;
    if (!categoryId && req.body.category) {
      const [category] = await Category.findOrCreate({
        where: { name: req.body.category.trim() },
        defaults: { name: req.body.category.trim() },
      });
      categoryId = category.id;
    }

    let imageUrl = req.body.image || req.body.imageUrl;
    if (req.file && req.file.buffer) {
      try {
        const result = await uploadImage(req.file.buffer, 'medicines');
        if (result && result.secure_url) imageUrl = result.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error', err);
      }
    }

    const validStockStatuses = ['AVAILABLE', 'OUT_OF_STOCK'];
    const requestedStockStatus = req.body.stockStatus;
    if (requestedStockStatus && !validStockStatuses.includes(requestedStockStatus)) {
      return res.status(400).json({ success: false, message: 'Estado do stock inválido' });
    }

    const quantity = Math.max(0, Number(req.body.quantity) || 0);
    const stockStatus = quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';

    const medicine = await Medicine.create({
      name: req.body.name,
      price: Number(req.body.price),
      quantity,
      stockStatus,
      image: imageUrl,
      pharmacyId: pharmacy.id,
      categoryId,
    });

    res.status(201).json({ success: true, message: 'Medicamento criado', data: medicine });
  } catch (error) {
    next(error);
  }
};

const updateMedicine = async (req, res, next) => {
  try {
    const pharmacy = await findManageablePharmacy(req.user.id);
    const medicine = await Medicine.findByPk(req.params.id);
    if (!pharmacy || !medicine || medicine.pharmacyId !== pharmacy.id) {
      return res.status(403).json({ success: false, message: 'Não pode gerir este medicamento' });
    }

    if (req.file && req.file.buffer) {
      try {
        const result = await uploadImage(req.file.buffer, 'medicines');
        if (result && result.secure_url) {
          req.body.image = result.secure_url;
        }
      } catch (err) {
        console.error('Cloudinary upload error', err);
      }
    }

    if (req.body.name !== undefined) medicine.name = req.body.name;
    if (req.body.price !== undefined) medicine.price = Number(req.body.price);
    const validStockStatuses = ['AVAILABLE', 'OUT_OF_STOCK'];
    const requestedStockStatus = req.body.stockStatus;
    if (requestedStockStatus !== undefined && !validStockStatuses.includes(requestedStockStatus)) {
      return res.status(400).json({ success: false, message: 'Estado do stock inválido' });
    }

    const quantityInput = req.body.quantity !== undefined ? req.body.quantity : req.body.stock;
    if (quantityInput !== undefined) {
      const quantity = Math.max(0, Number(quantityInput) || 0);
      medicine.quantity = quantity;
      medicine.stockStatus = quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';
    } else if (requestedStockStatus !== undefined) {
      medicine.stockStatus = medicine.quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';
    }

    if (req.body.category) {
      const [category] = await Category.findOrCreate({
        where: { name: req.body.category.trim() },
        defaults: { name: req.body.category.trim() },
      });
      medicine.categoryId = category.id;
    }

    if (req.body.image !== undefined) {
      medicine.image = req.body.image;
    }

    if (req.body.imageRemoved === 'true') {
      medicine.image = null;
    }

    await medicine.save();
    res.json({ success: true, message: 'Medicamento atualizado', data: medicine });
  } catch (error) {
    next(error);
  }
};

const deleteMedicine = async (req, res, next) => {
  try {
    const pharmacy = await findManageablePharmacy(req.user.id);
    const medicine = await Medicine.findByPk(req.params.id);
    if (!pharmacy || !medicine || medicine.pharmacyId !== pharmacy.id) {
      return res.status(403).json({ success: false, message: 'Não pode gerir este medicamento' });
    }

    medicine.isActive = false;
    await medicine.save();
    res.json({ success: true, message: 'Medicamento desactivado' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMedicines, searchMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine };
