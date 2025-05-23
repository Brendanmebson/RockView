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
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);
router.post('/position-change-request', protect, submitPositionChangeRequest);

// Admin routes for position change requests
router.get('/position-change-requests', protect, authorize('admin'), getPositionChangeRequests);
router.put('/position-change-requests/:id/approve', protect, authorize('admin'), approvePositionChangeRequest);
router.put('/position-change-requests/:id/reject', protect, authorize('admin'), rejectPositionChangeRequest);

// Admin routes for user management
router.get('/users', protect, authorize('admin'), getUsers);

module.exports = router;