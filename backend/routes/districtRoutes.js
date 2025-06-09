const express = require('express');
const router = express.Router();
const {
  getDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} = require('../controllers/districtController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getDistricts)
  .post(authorize('admin'), createDistrict);

router
  .route('/:id')
  .get(getDistrictById)
  .put(authorize('admin'), updateDistrict)
  .delete(authorize('admin'), deleteDistrict);

module.exports = router;