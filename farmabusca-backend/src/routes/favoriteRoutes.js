const express = require('express');
const { listFavorites, addFavorite, removeFavorite, listPharmacyFavorites, addPharmacyFavorite, removePharmacyFavorite } = require('../controllers/favoriteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware('PATIENT'), listFavorites);
router.post('/', authMiddleware, roleMiddleware('PATIENT'), addFavorite);
router.get('/pharmacies', authMiddleware, roleMiddleware('PATIENT'), listPharmacyFavorites);
router.post('/pharmacies', authMiddleware, roleMiddleware('PATIENT'), addPharmacyFavorite);
router.delete('/pharmacies/:pharmacyId', authMiddleware, roleMiddleware('PATIENT'), removePharmacyFavorite);
router.delete('/:medicineId', authMiddleware, roleMiddleware('PATIENT'), removeFavorite);

module.exports = router;
