const express = require('express');
const router = express.Router();
const {
  getPublicDistricts,
  getPublicAreaSupervisors,
  getPublicCithCentres,
} = require('../controllers/publicController');

router.get('/districts', getPublicDistricts);
router.get('/area-supervisors', getPublicAreaSupervisors);
router.get('/cith-centres', getPublicCithCentres);

module.exports = router;