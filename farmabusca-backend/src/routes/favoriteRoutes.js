const express = require('express');
const { listFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, listFavorites);
router.post('/', authMiddleware, addFavorite);
router.delete('/:medicineId', authMiddleware, removeFavorite);

module.exports = router;
