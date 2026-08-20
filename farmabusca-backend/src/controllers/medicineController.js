const { Medicine, Category, Pharmacy } = require('../models');
const { Op } = require('sequelize');
const { uploadImage } = require('../services/cloudinaryService');

const publicPharmacyInclude = {
  model: Pharmacy,
  where: { approved: true, suspended: false },
  required: true,
};

const findManageablePharmacy = (userId) => Pharmacy.findOne({
  where: { userId, approved: true, suspended: false },
});

const listMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.findAll({
      include: [Category, publicPharmacyInclude],
      where: { stockStatus: ['AVAILABLE', 'LOW_STOCK'] },
    });
    res.json({ success: true, message: 'Medicamentos listados', data: medicines });
  } catch (error) {
    next(error);
  }
};

const searchMedicines = async (req, res, next) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Informe o nome do medicamento' });
    }

    const medicines = await Medicine.findAll({
      where: {
        name: { [Op.iLike]: `%${name}%` },
        stockStatus: ['AVAILABLE', 'LOW_STOCK'],
      },
      include: [Category, publicPharmacyInclude],
    });
    res.json({ success: true, message: 'Pesquisa concluída', data: medicines });
  } catch (error) {
    next(error);
  }
};

const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({
      where: { id: req.params.id, stockStatus: ['AVAILABLE', 'LOW_STOCK'] },
      include: [Category, publicPharmacyInclude],
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

    const validStockStatuses = ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'];
    const requestedStockStatus = req.body.stockStatus;
    if (requestedStockStatus && !validStockStatuses.includes(requestedStockStatus)) {
      return res.status(400).json({ success: false, message: 'Estado do stock inválido' });
    }

    const quantity = Math.max(0, Number(req.body.quantity) || 0);
    const stockStatus = quantity === 0
      ? 'OUT_OF_STOCK'
      : requestedStockStatus || 'AVAILABLE';

    const medicine = await Medicine.create({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price) || 0,
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
    if (req.body.description !== undefined) medicine.description = req.body.description;
    if (req.body.price !== undefined) medicine.price = Number(req.body.price) || 0;
    const validStockStatuses = ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'];
    const requestedStockStatus = req.body.stockStatus;
    if (requestedStockStatus !== undefined && !validStockStatuses.includes(requestedStockStatus)) {
      return res.status(400).json({ success: false, message: 'Estado do stock inválido' });
    }

    const quantityInput = req.body.quantity !== undefined ? req.body.quantity : req.body.stock;
    if (quantityInput !== undefined) {
      const quantity = Math.max(0, Number(quantityInput) || 0);
      medicine.quantity = quantity;
      medicine.stockStatus = quantity === 0
        ? 'OUT_OF_STOCK'
        : requestedStockStatus || 'AVAILABLE';
    } else if (requestedStockStatus !== undefined) {
      medicine.stockStatus = medicine.quantity === 0
        ? 'OUT_OF_STOCK'
        : requestedStockStatus;
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

    await medicine.destroy();
    res.json({ success: true, message: 'Medicamento removido' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMedicines, searchMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine };
