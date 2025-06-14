// backend/controllers/authController.js
const User = require('../models/User');
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const ZonalSupervisor = require('../models/ZonalSupervisor');
const CithCentre = require('../models/CithCentre');
const PositionChangeRequest = require('../models/PositionChangeRequest');
const WeeklyReport = require('../models/WeeklyReport');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password, name, phone, role, cithCentreId, areaSupervisorId, zonalSupervisorId, districtId } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Validate required fields
    if (!email || !password || !name || !phone || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create user data object
    const userData = {
      email,
      password,
      name,
      phone,
      role,
    };

    // Check position constraints based on role
    if (role === 'district_pastor') {
      if (!districtId) {
        return res.status(400).json({ message: 'District ID is required for district pastor role' });
      }
      
      // Check if this district already has a pastor
      const existingPastor = await User.findOne({ role: 'district_pastor', districtId });
      if (existingPastor) {
        return res.status(400).json({ 
          message: 'This district already has a pastor assigned' 
        });
      }
      userData.districtId = districtId;
    } else if (role === 'zonal_supervisor') {
      if (!zonalSupervisorId) {
        return res.status(400).json({ message: 'Zonal supervisor ID is required for zonal supervisor role' });
      }
      
      // Check if this zone already has a supervisor
      const existingSupervisor = await User.findOne({ 
        role: 'zonal_supervisor', 
        zonalSupervisorId 
      });
      
      if (existingSupervisor) {
        return res.status(400).json({ 
          message: 'This zone already has a supervisor assigned' 
        });
      }
      userData.zonalSupervisorId = zonalSupervisorId;
    } else if (role === 'area_supervisor') {
      if (!areaSupervisorId) {
        return res.status(400).json({ message: 'Area supervisor ID is required for area supervisor role' });
      }
      
      // Check if this area already has a supervisor
      const existingSupervisor = await User.findOne({ 
        role: 'area_supervisor', 
        areaSupervisorId 
      });
      
      if (existingSupervisor) {
        return res.status(400).json({ 
          message: 'This area already has a supervisor assigned' 
        });
      }
      userData.areaSupervisorId = areaSupervisorId;
    } else if (role === 'cith_centre') {
      if (!cithCentreId) {
        return res.status(400).json({ message: 'CITH centre ID is required for CITH centre role' });
      }
      
      // Check if this centre already has 2 leaders
      const centreLeadersCount = await User.countDocuments({ 
        role: 'cith_centre', 
        cithCentreId 
      });
      
      if (centreLeadersCount >= 2) {
        return res.status(400).json({ 
          message: 'This CITH centre already has the maximum number of leaders (2)' 
        });
      }
      userData.cithCentreId = cithCentreId;
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    // Get user with populated fields
    const newUser = await User.findById(user._id)
      .select('-password')
      .populate('cithCentreId', 'name location areaSupervisorId')
      .populate('areaSupervisorId', 'name districtId')
      .populate('zonalSupervisorId', 'name districtId')
      .populate('districtId', 'name districtNumber');

    res.status(201).json({
      token,
      ...newUser.toObject()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists and get password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Get user without password but with populated fields
    const userWithoutPassword = await User.findById(user._id)
      .select('-password')
      .populate({
        path: 'cithCentreId',
        select: 'name location areaSupervisorId',
        populate: {
          path: 'areaSupervisorId',
          select: 'name districtId',
          populate: {
            path: 'districtId',
            select: 'name districtNumber'
          }
        }
      })
      .populate({
        path: 'areaSupervisorId',
        select: 'name districtId',
        populate: {
          path: 'districtId',
          select: 'name districtNumber'
        }
      })
      .populate({
        path: 'zonalSupervisorId',
        select: 'name districtId',
        populate: {
          path: 'districtId',
          select: 'name districtNumber'
        }
      })
      .populate('districtId', 'name districtNumber');

    res.json({
      token,
      ...userWithoutPassword.toObject()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    // User is already available from middleware
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'cithCentreId',
        select: 'name location areaSupervisorId',
        populate: {
          path: 'areaSupervisorId',
          select: 'name districtId',
          populate: {
            path: 'districtId',
            select: 'name districtNumber'
          }
        }
      })
      .populate({
        path: 'areaSupervisorId',
        select: 'name districtId',
        populate: {
          path: 'districtId',
          select: 'name districtNumber'
        }
      })
      .populate({
        path: 'zonalSupervisorId',
        select: 'name districtId',
        populate: {
          path: 'districtId',
          select: 'name districtNumber'
        }
      })
      .populate('districtId', 'name districtNumber');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    // Get updated user with populated fields
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('zonalSupervisorId', 'name')
      .populate('districtId', 'name districtNumber');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only admin account' });
      }
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit position change request
// @route   POST /api/auth/position-change-request
// @access  Private
const submitPositionChangeRequest = async (req, res) => {
  try {
    const { newRole, targetId } = req.body;
    const userId = req.user._id;
    const currentRole = req.user.role;

    // Validate input
    if (!newRole || !targetId) {
      return res.status(400).json({ message: 'New role and target ID are required' });
    }

    // Check if user already has a pending request
    const existingRequest = await PositionChangeRequest.findOne({
      userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending position change request' });
    }

    // Check if the target position is available
    const isAvailable = await checkPositionAvailabilityHelper(newRole, targetId);
    if (!isAvailable) {
      return res.status(400).json({ message: 'This position is not available' });
    }

    // Create position change request
    const request = await PositionChangeRequest.create({
      userId,
      currentRole,
      newRole,
      targetId
    });

    res.status(201).json({
      message: 'Position change request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Submit position change request error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get my position change requests
// @route   GET /api/auth/my-position-requests
// @access  Private
const getMyPositionRequests = async (req, res) => {
  try {
    const requests = await PositionChangeRequest.find({ userId: req.user._id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get my position requests error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel position change request
// @route   DELETE /api/auth/position-change-requests/:id/cancel
// @access  Private
const cancelPositionChangeRequest = async (req, res) => {
  try {
    const request = await PositionChangeRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or cannot be cancelled' });
    }

    await PositionChangeRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Position change request cancelled successfully' });
  } catch (error) {
    console.error('Cancel position change request error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all position change requests (admin only)
// @route   GET /api/auth/position-change-requests
// @access  Private/Admin
const getPositionChangeRequests = async (req, res) => {
  try {
    const requests = await PositionChangeRequest.find({})
      .populate('userId', 'name email role')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get position change requests error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve position change request
// @route   PUT /api/auth/position-change-requests/:id/approve
// @access  Private/Admin
const approvePositionChangeRequest = async (req, res) => {
  try {
    const request = await PositionChangeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Check if position is still available
    const isAvailable = await checkPositionAvailabilityHelper(request.newRole, request.targetId);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Position is no longer available' });
    }

    // Update user role
    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear previous assignments
    user.cithCentreId = undefined;
    user.areaSupervisorId = undefined;
    user.zonalSupervisorId = undefined;
    user.districtId = undefined;

    // Set new role and assignment
    user.role = request.newRole;
    if (request.newRole === 'district_pastor') {
      user.districtId = request.targetId;
    } else if (request.newRole === 'zonal_supervisor') {
      user.zonalSupervisorId = request.targetId;
    } else if (request.newRole === 'area_supervisor') {
      user.areaSupervisorId = request.targetId;
    } else if (request.newRole === 'cith_centre') {
      user.cithCentreId = request.targetId;
    }

    await user.save();

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ message: 'Position change request approved successfully' });
  } catch (error) {
    console.error('Approve position change request error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reject position change request
// @route   PUT /api/auth/position-change-requests/:id/reject
// @access  Private/Admin
const rejectPositionChangeRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    const request = await PositionChangeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason;
    await request.save();

    res.json({ message: 'Position change request rejected successfully' });
  } catch (error) {
    console.error('Reject position change request error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get users (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('zonalSupervisorId', 'name')
      .populate('districtId', 'name districtNumber')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user statistics (admin only)
// @route   GET /api/auth/user-stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get total count
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get dashboard data
// @route   GET /api/auth/dashboard-data
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let dashboardData = {
      user: req.user,
      stats: {},
      recentReports: [],
      notifications: []
    };

    // Get basic counts
    const [totalUsers, totalDistricts, totalAreas, totalCentres] = await Promise.all([
      User.countDocuments(),
      District.countDocuments(),
      AreaSupervisor.countDocuments(),
      CithCentre.countDocuments()
    ]);

    dashboardData.stats = {
      totalUsers,
      totalDistricts,
      totalAreas,
      totalCentres
    };

    // Get role-specific data
    if (userRole === 'admin') {
      // Admin sees everything
      const recentReports = await WeeklyReport.find({})
        .populate('cithCentreId', 'name location')
        .populate('submittedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);
      
      dashboardData.recentReports = recentReports;
    } else if (userRole === 'district_pastor') {
      // District pastor sees reports from their district
      const districtId = req.user.districtId;
      if (districtId) {
        // Get all areas in the district
        const areas = await AreaSupervisor.find({ districtId });
        const areaIds = areas.map(area => area._id);
        
        // Get all centres in those areas
        const centres = await CithCentre.find({ areaSupervisorId: { $in: areaIds } });
        const centreIds = centres.map(centre => centre._id);
        
        const recentReports = await WeeklyReport.find({ cithCentreId: { $in: centreIds } })
          .populate('cithCentreId', 'name location')
          .populate('submittedBy', 'name email')
          .sort({ createdAt: -1 })
          .limit(5);
        
        dashboardData.recentReports = recentReports;
      }
    } else if (userRole === 'area_supervisor') {
      // Area supervisor sees reports from their area
      const areaSupervisorId = req.user.areaSupervisorId;
      if (areaSupervisorId) {
        const centres = await CithCentre.find({ areaSupervisorId });
        const centreIds = centres.map(centre => centre._id);
        
        const recentReports = await WeeklyReport.find({ cithCentreId: { $in: centreIds } })
          .populate('cithCentreId', 'name location')
          .populate('submittedBy', 'name email')
          .sort({ createdAt: -1 })
          .limit(5);
        
        dashboardData.recentReports = recentReports;
      }
    } else if (userRole === 'cith_centre') {
      // CITH centre sees only their reports
      const cithCentreId = req.user.cithCentreId;
      if (cithCentreId) {
        const recentReports = await WeeklyReport.find({ cithCentreId })
          .populate('cithCentreId', 'name location')
          .populate('submittedBy', 'name email')
          .sort({ createdAt: -1 })
          .limit(5);
        
        dashboardData.recentReports = recentReports;
      }
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check position availability
// @route   GET /api/auth/check-position/:role/:targetId
// @access  Private
const checkPositionAvailability = async (req, res) => {
  try {
    const { role, targetId } = req.params;
    const isAvailable = await checkPositionAvailabilityHelper(role, targetId);
    
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Check position availability error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Helper function to check position availability
const checkPositionAvailabilityHelper = async (role, targetId) => {
  try {
    if (role === 'district_pastor') {
      const existingPastor = await User.findOne({ role: 'district_pastor', districtId: targetId });
      return !existingPastor;
    } else if (role === 'zonal_supervisor') {
      const existingSupervisor = await User.findOne({ role: 'zonal_supervisor', zonalSupervisorId: targetId });
      return !existingSupervisor;
    } else if (role === 'area_supervisor') {
      const existingSupervisor = await User.findOne({ role: 'area_supervisor', areaSupervisorId: targetId });
      return !existingSupervisor;
    } else if (role === 'cith_centre') {
      const existingLeaders = await User.countDocuments({ role: 'cith_centre', cithCentreId: targetId });
      return existingLeaders < 2;
    }
    
    return false;
  } catch (error) {
    console.error('Check position availability helper error:', error);
    return false;
  }
};

module.exports = {
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
};