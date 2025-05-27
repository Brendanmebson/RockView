// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUsersByHierarchy,
  deleteUser,
  updateUserRole,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin'), getAllUsers);
router.get('/hierarchy', getUsersByHierarchy);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/role', authorize('admin'), updateUserRole);

module.exports = router;