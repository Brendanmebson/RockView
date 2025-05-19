const express = require('express');
const router = express.Router();
const {
  getAreaSupervisors,
  createAreaSupervisor,
  updateAreaSupervisor,
  deleteAreaSupervisor,
} = require('../controllers/areaSupervisorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getAreaSupervisors)
  .post(authorize('admin', 'district_pastor'), createAreaSupervisor);

router
  .route('/:id')
  .put(authorize('admin', 'district_pastor', 'area_supervisor'), updateAreaSupervisor)
  .delete(authorize('admin', 'district_pastor'), deleteAreaSupervisor);

module.exports = router;