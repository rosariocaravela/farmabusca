const { Favorite, Medicine, Pharmacy } = require('../models');

const listFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.findAll({ where: { userId: req.user.id }, include: [Medicine] });
    res.json({ success: true, message: 'Favoritos carregados', data: favorites });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
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

module.exports = { listFavorites, addFavorite, removeFavorite };
