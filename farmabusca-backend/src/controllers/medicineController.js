const { Medicine, Category, Pharmacy } = require('../models');
const { Op } = require('sequelize');
const { uploadImage } = require('../services/cloudinaryService');

const listMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.findAll({ include: [Category, Pharmacy], where: { stockStatus: ['AVAILABLE', 'LOW_STOCK'] } });
    res.json({ success: true, message: 'Medicamentos listados', data: medicines });
  } catch (error) {
    next(error);
  }
};

const searchMedicines = async (req, res, next) => {
  try {
    const { name } = req.query;
    const medicines = await Medicine.findAll({
      where: { name: { [Op.like]: `%${name}%` } },
      include: [Category, Pharmacy],
    });
    res.json({ success: true, message: 'Pesquisa concluída', data: medicines });
  } catch (error) {
    next(error);
  }
};

const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id, { include: [Category, Pharmacy] });
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
    const pharmacy = await Pharmacy.findOne({ where: { userId: req.user.id } });
    if (!pharmacy) {
      return res.status(403).json({ success: false, message: 'Farmácia não encontrada para este usuário' });
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

    const quantity = Number(req.body.quantity) || 0;
    const stockStatus = req.body.stockStatus
      ? req.body.stockStatus
      : quantity > 0
        ? 'AVAILABLE'
        : 'OUT_OF_STOCK';

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
    const pharmacy = await Pharmacy.findOne({ where: { userId: req.user.id } });
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
    if (req.body.stock !== undefined) {
      const quantity = Number(req.body.stock) || 0;
      medicine.quantity = quantity;
      medicine.stockStatus = quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
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

    await medicine.save();
    res.json({ success: true, message: 'Medicamento atualizado', data: medicine });
  } catch (error) {
    next(error);
  }
};

const deleteMedicine = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({ where: { userId: req.user.id } });
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine || medicine.pharmacyId !== pharmacy.id) {
      return res.status(403).json({ success: false, message: 'Não pode gerir este medicamento' });
    }

    await medicine.destroy();
    res.json({ success: true, message: 'Medicamento removido' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMedicines, searchMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine };
