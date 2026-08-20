const express = require('express');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('A imagem do medicamento deve ser um ficheiro de imagem'));
    }
    callback(null, true);
  },
});
const { listMedicines, searchMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicineController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', listMedicines);
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);
router.post('/', authMiddleware, roleMiddleware(['PHARMACY']), upload.single('image'), createMedicine);
router.put('/:id', authMiddleware, roleMiddleware(['PHARMACY']), upload.single('image'), updateMedicine);
router.delete('/:id', authMiddleware, roleMiddleware(['PHARMACY']), deleteMedicine);

module.exports = router;
