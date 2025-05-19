const express = require('express');
const router = express.Router();
const { exportToExcel } = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/excel', authorize('area_supervisor', 'district_pastor', 'admin'), exportToExcel);

module.exports = router;