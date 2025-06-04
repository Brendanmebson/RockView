// backend/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPublicDistricts,
  getPublicAreaSupervisors,
  getPublicCithCentres,
  getAssignmentStats,
  getAvailablePositions,
  testConnection
} = require('../controllers/publicController');

router.get('/districts', getPublicDistricts);
router.get('/area-supervisors', getPublicAreaSupervisors);
router.get('/cith-centres', getPublicCithCentres);
router.get('/assignment-stats', getAssignmentStats);
router.get('/available-positions', getAvailablePositions);
router.get('/test', testConnection);

module.exports = router;