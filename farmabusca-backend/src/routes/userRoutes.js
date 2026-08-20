const express = require('express');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('A foto do perfil deve ser um ficheiro de imagem'));
    }
    callback(null, true);
  },
});
const { getProfile, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, upload.single('image'), updateProfile);

module.exports = router;
