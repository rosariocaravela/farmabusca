const express = require('express');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';
    const accepted = file.fieldname === 'image' ? isImage : isImage || isPdf;

    if (!accepted) {
      return callback(new Error('Envie apenas imagens ou documentos PDF'));
    }
    callback(null, true);
  },
});
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
