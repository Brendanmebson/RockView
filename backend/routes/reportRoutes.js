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
  getReportForEdit,
  deleteReport,
  updateReport,
  getReportStats,
  getRecentReports,
  adminEditReport,
  adminComprehensiveEdit,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getReports)
  .post(authorize('cith_centre'), submitReport);

router.get('/summary', getReportSummary);
router.get('/stats', getReportStats);
router.get('/recent', getRecentReports);

router
  .route('/:id')
  .get(getReportById)
  .put(updateReport)
  .delete(deleteReport);

// Add edit route
router.get('/:id/edit', getReportForEdit);
router.put('/:id/admin-edit', authorize('admin'), adminEditReport);
router.put('/:id/approve', authorize('area_supervisor', 'district_pastor', 'admin'), approveReport);
router.put('/:id/reject', authorize('area_supervisor', 'district_pastor', 'admin'), rejectReport);
router.put('/:id/admin-comprehensive-edit', authorize('admin'), adminComprehensiveEdit);

module.exports = router;