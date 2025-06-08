const express = require('express');
const router = express.Router();
const { exportToExcel, exportSingleReport } = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/excel', authorize('area_supervisor', 'zonal_supervisor', 'district_pastor', 'admin'), exportToExcel);
router.get('/report/:id', exportSingleReport);

module.exports = router;