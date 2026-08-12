const { User, Pharmacy } = require('../models');
const { uploadImage } = require('../services/cloudinaryService');

const getImageUrlFromRequest = async (req) => {
  let imageUrl = req.body.image || req.body.imageUrl;
  if (req.file && req.file.buffer) {
    try {
      const result = await uploadImage(req.file.buffer, 'users');
      if (result && result.secure_url) imageUrl = result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error', err);
    }
  }
  return imageUrl;
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { include: [Pharmacy] });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const image = await getImageUrlFromRequest(req);
    await user.update({ ...req.body, ...(image ? { image } : {}) });
    res.json({ success: true, message: 'Perfil atualizado', data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
