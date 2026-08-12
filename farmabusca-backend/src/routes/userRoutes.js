const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { getProfile, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, upload.single('image'), updateProfile);

module.exports = router;
