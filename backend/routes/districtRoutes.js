const express = require('express');
const router = express.Router();
const {
  getDistricts,
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
  .put(authorize('admin'), updateDistrict)
  .delete(authorize('admin'), deleteDistrict);

module.exports = router;