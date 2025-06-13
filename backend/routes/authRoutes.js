// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// NOTE: Commented out missing functions temporarily to make server work
// Missing functions that need to be implemented in authController:
// - getUserStats
// - getMyPositionRequests  
// - cancelPositionChangeRequest
// - getDashboardData
// - checkPositionAvailability

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
// getUserStats,
// getMyPositionRequests,
// cancelPositionChangeRequest,
// getDashboardData,
// checkPositionAvailability,
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/users/profile', protect, getProfile);
router.put('/users/profile', protect, updateProfile);
router.put('/users/change-password', protect, changePassword);
router.delete('/users/delete-account', protect, deleteAccount);
// TODO: Uncomment when getDashboardData is implemented
// router.get('/dashboard-data', protect, getDashboardData);

// Position change requests
router.post('/users/position-change-request', protect, submitPositionChangeRequest);
// TODO: Uncomment when getMyPositionRequests is implemented
// router.get('/my-position-requests', protect, getMyPositionRequests);
// TODO: Uncomment when cancelPositionChangeRequest is implemented
// router.delete('/position-change-requests/:id/cancel', protect, cancelPositionChangeRequest);

// TODO: Uncomment when checkPositionAvailability is implemented
// router.get('/check-position/:role/:targetId', protect, checkPositionAvailability);

// Admin routes for position change requests
router.get('/users/position-change-requests', protect, authorize('admin'), getPositionChangeRequests);
router.put('/users/position-change-requests/:id/approve', protect, authorize('admin'), approvePositionChangeRequest);
router.put('/users/position-change-requests/:id/reject', protect, authorize('admin'), rejectPositionChangeRequest);

// Admin routes for user management
router.get('/users', protect, authorize('admin'), getUsers);
// TODO: Uncomment when getUserStats is implemented
// router.get('/user-stats', protect, authorize('admin'), getUserStats);

module.exports = router;