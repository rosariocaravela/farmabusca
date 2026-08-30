const { Favorite, PharmacyFavorite, Medicine, Pharmacy, User } = require('../models');
const { PUBLIC_PHARMACY_ATTRIBUTES } = require('../utils/pharmacyPolicy');

const listFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Medicine,
        where: { isActive: true },
        required: true,
        include: [{ model: Pharmacy, attributes: PUBLIC_PHARMACY_ATTRIBUTES, where: { approved: true, suspended: false, reviewStatus: 'APPROVED' }, required: true, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, message: 'Favoritos carregados', data: favorites });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    if (!req.body.medicineId) return res.status(400).json({ success: false, message: 'Medicamento é obrigatório' });
    const medicine = await Medicine.findOne({
      where: { id: req.body.medicineId, isActive: true },
      include: [{ model: Pharmacy, attributes: PUBLIC_PHARMACY_ATTRIBUTES, where: { approved: true, suspended: false, reviewStatus: 'APPROVED' }, required: true, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }] }],
    });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicamento não encontrado' });
    const favorite = await Favorite.findOne({ where: { userId: req.user.id, medicineId: req.body.medicineId } });
    if (favorite) {
      return res.status(400).json({ success: false, message: 'Medicamento já está nos favoritos' });
    }

    const created = await Favorite.create({ userId: req.user.id, medicineId: req.body.medicineId });
    res.status(201).json({ success: true, message: 'Medicamento adicionado aos favoritos', data: created });
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({ where: { userId: req.user.id, medicineId: req.params.medicineId } });
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorito não encontrado' });
    }

    await favorite.destroy();
    res.json({ success: true, message: 'Favorito removido' });
  } catch (error) {
    next(error);
  }
};

const listPharmacyFavorites = async (req, res, next) => {
  try {
    const favorites = await PharmacyFavorite.findAll({
      where: { userId: req.user.id },
      include: [{ model: Pharmacy, where: { approved: true, suspended: false, reviewStatus: 'APPROVED' }, required: true, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, message: 'Farmácias favoritas carregadas', data: favorites });
  } catch (error) {
    return next(error);
  }
};

const addPharmacyFavorite = async (req, res, next) => {
  try {
    const pharmacyId = req.body.pharmacyId;
    if (!pharmacyId) return res.status(400).json({ success: false, message: 'Farmácia é obrigatória' });
    const pharmacy = await Pharmacy.findOne({ where: { id: pharmacyId, approved: true, suspended: false, reviewStatus: 'APPROVED' }, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }] });
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    const [favorite, created] = await PharmacyFavorite.findOrCreate({ where: { userId: req.user.id, pharmacyId } });
    return res.status(created ? 201 : 200).json({ success: true, message: created ? 'Farmácia adicionada aos favoritos' : 'Farmácia já estava nos favoritos', data: favorite });
  } catch (error) {
    return next(error);
  }
};

const removePharmacyFavorite = async (req, res, next) => {
  try {
    const favorite = await PharmacyFavorite.findOne({ where: { userId: req.user.id, pharmacyId: req.params.pharmacyId } });
    if (!favorite) return res.status(404).json({ success: false, message: 'Farmácia favorita não encontrada' });
    await favorite.destroy();
    return res.json({ success: true, message: 'Farmácia removida dos favoritos' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listFavorites, addFavorite, removeFavorite, listPharmacyFavorites, addPharmacyFavorite, removePharmacyFavorite };
