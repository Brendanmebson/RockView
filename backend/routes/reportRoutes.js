// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  submitReport,
  getReports,
  approveReport,
  rejectReport,
  getReportSummary,
  getReportById,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getReports)
  .post(authorize('cith_centre'), submitReport);

router.get('/summary', getReportSummary);
router.get('/:id', getReportById);

router.put('/:id/approve', authorize('area_supervisor', 'district_pastor'), approveReport);
router.put('/:id/reject', authorize('area_supervisor', 'district_pastor'), rejectReport);

module.exports = router;