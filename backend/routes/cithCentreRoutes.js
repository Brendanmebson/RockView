const express = require('express');
const router = express.Router();
const {
  getCithCentres,
  getCithCentreById,
  createCithCentre,
  updateCithCentre,
  deleteCithCentre,
} = require('../controllers/cithCentreController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getCithCentres)
  .post(authorize('admin', 'district_pastor', 'area_supervisor'), createCithCentre);

router
  .route('/:id')
  .get(getCithCentreById)
  .put(authorize('admin', 'district_pastor', 'area_supervisor'), updateCithCentre)
  .delete(authorize('admin', 'district_pastor', 'area_supervisor'), deleteCithCentre);

module.exports = router;