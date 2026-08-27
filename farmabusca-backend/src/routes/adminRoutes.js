const express = require('express');
const {
  listUsers,
  listPendingPharmacies,
  listAllPharmacies,
  updatePharmacyStatus,
  getAdminSummary,
  approvePharmacy,
  updateUserStatus,
  listAuditLogs,
  updatePharmacyLocation,
} = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/users', authMiddleware, roleMiddleware(['ADMIN']), listUsers);
router.put('/users/:id/status', authMiddleware, roleMiddleware(['ADMIN']), updateUserStatus);
router.get('/pharmacies/pending', authMiddleware, roleMiddleware(['ADMIN']), listPendingPharmacies);
router.get('/pharmacies', authMiddleware, roleMiddleware(['ADMIN']), listAllPharmacies);
router.put('/pharmacies/:id/status', authMiddleware, roleMiddleware(['ADMIN']), updatePharmacyStatus);
router.put('/pharmacies/:id/location', authMiddleware, roleMiddleware(['ADMIN']), updatePharmacyLocation);
router.get('/analytics/summary', authMiddleware, roleMiddleware(['ADMIN']), getAdminSummary);
router.get('/audit-logs', authMiddleware, roleMiddleware(['ADMIN']), listAuditLogs);
router.put('/pharmacies/:id/approve', authMiddleware, roleMiddleware(['ADMIN']), approvePharmacy);

module.exports = router;
