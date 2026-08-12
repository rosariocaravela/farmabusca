const express = require('express');
const {
  listUsers,
  listPendingPharmacies,
  listAllPharmacies,
  updatePharmacyStatus,
  getAdminSummary,
  listAdminMedicines,
  approvePharmacy,
} = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/users', authMiddleware, roleMiddleware(['ADMIN']), listUsers);
router.get('/pharmacies/pending', authMiddleware, roleMiddleware(['ADMIN']), listPendingPharmacies);
router.get('/pharmacies', authMiddleware, roleMiddleware(['ADMIN']), listAllPharmacies);
router.put('/pharmacies/:id/status', authMiddleware, roleMiddleware(['ADMIN']), updatePharmacyStatus);
router.get('/medicines', authMiddleware, roleMiddleware(['ADMIN']), listAdminMedicines);
router.get('/analytics/summary', authMiddleware, roleMiddleware(['ADMIN']), getAdminSummary);
router.put('/pharmacies/:id/approve', authMiddleware, roleMiddleware(['ADMIN']), approvePharmacy);

module.exports = router;
