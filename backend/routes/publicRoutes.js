// backend/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPublicDistricts,
  getPublicAreaSupervisors,
  getPublicCithCentres,
  testConnection
} = require('../controllers/publicController');

router.get('/districts', getPublicDistricts);
router.get('/area-supervisors', getPublicAreaSupervisors);
router.get('/cith-centres', getPublicCithCentres);
router.get('/test', testConnection);

module.exports = router;