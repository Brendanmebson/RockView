// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUsersByHierarchy,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  toggleUserStatus,
  resetUserPassword,
  getUserStats,
  searchUsers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// General routes
router.get('/hierarchy', getUsersByHierarchy);
router.get('/search', authorize('admin'), searchUsers);
router.get('/stats', authorize('admin'), getUserStats);

// CRUD routes
router.route('/')
  .get(authorize('admin'), getAllUsers)
  .post(authorize('admin'), createUser);

router.route('/:id')
  .get(authorize('admin'), getUserById)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

// Special operations
router.put('/:id/role', authorize('admin'), updateUserRole);
router.put('/:id/toggle-status', authorize('admin'), toggleUserStatus);
router.put('/:id/reset-password', authorize('admin'), resetUserPassword);

module.exports = router;
// This code defines the user-related routes for the application.