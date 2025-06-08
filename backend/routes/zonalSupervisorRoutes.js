const express = require('express');
const router = express.Router();
const {
  getZonalSupervisors,
  createZonalSupervisor,
  updateZonalSupervisor,
  deleteZonalSupervisor,
} = require('../controllers/zonalSupervisorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getZonalSupervisors)
  .post(authorize('admin', 'district_pastor'), createZonalSupervisor);

router
  .route('/:id')
  .put(authorize('admin', 'district_pastor', 'zonal_supervisor'), updateZonalSupervisor)
  .delete(authorize('admin', 'district_pastor'), deleteZonalSupervisor);

module.exports = router;