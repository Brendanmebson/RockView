// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  submitPositionChangeRequest,
  getPositionChangeRequests,
  approvePositionChangeRequest,
  rejectPositionChangeRequest,
  getUsers,
  getUserStats,
  getMyPositionRequests,
  cancelPositionChangeRequest,
  getDashboardData,
  checkPositionAvailability,
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);
router.get('/dashboard-data', protect, getDashboardData);

// Position change requests
router.post('/position-change-request', protect, submitPositionChangeRequest);
router.get('/my-position-requests', protect, getMyPositionRequests);
router.delete('/position-change-requests/:id/cancel', protect, cancelPositionChangeRequest);

// Position availability check
router.get('/check-position/:role/:targetId', protect, checkPositionAvailability);

// Admin routes for position change requests
router.get('/position-change-requests', protect, authorize('admin'), getPositionChangeRequests);
router.put('/position-change-requests/:id/approve', protect, authorize('admin'), approvePositionChangeRequest);
router.put('/position-change-requests/:id/reject', protect, authorize('admin'), rejectPositionChangeRequest);

// Admin routes for user management
router.get('/users', protect, authorize('admin'), getUsers);
router.get('/user-stats', protect, authorize('admin'), getUserStats);

module.exports = router;