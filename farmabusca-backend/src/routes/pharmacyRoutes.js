const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { createProfile, updateProfile, getMyPharmacy, listMyMedicines, listPharmacies, getPharmacyById } = require('../controllers/pharmacyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', listPharmacies);
router.post('/me', authMiddleware, roleMiddleware(['PHARMACY']), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'documents', maxCount: 10 }]), createProfile);
router.put('/me', authMiddleware, roleMiddleware(['PHARMACY']), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'documents', maxCount: 10 }]), updateProfile);
router.get('/me', authMiddleware, roleMiddleware(['PHARMACY']), getMyPharmacy);
router.get('/me/medicines', authMiddleware, roleMiddleware(['PHARMACY']), listMyMedicines);
router.get('/:id', getPharmacyById);

module.exports = router;
