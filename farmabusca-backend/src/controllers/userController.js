const { User, Pharmacy } = require('../models');
const { uploadImage } = require('../services/cloudinaryService');
const { sanitizeUser } = require('../utils/authPolicy');

const USER_PROFILE_FIELDS = ['name', 'phone'];

const getProfilePayload = (body = {}) => USER_PROFILE_FIELDS.reduce((payload, field) => {
  if (body[field] !== undefined) payload[field] = body[field];
  return payload;
}, {});

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
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }

    const image = await getImageUrlFromRequest(req);
    await user.update({
      ...getProfilePayload(req.body),
      ...(image ? { image } : {}),
    });

    res.json({
      success: true,
      message: 'Perfil atualizado',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
