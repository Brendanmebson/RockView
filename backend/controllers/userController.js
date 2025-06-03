// backend/controllers/userController.js
const User = require('../models/User');
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name districtNumber')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get users based on role hierarchy
// @route   GET /api/users/hierarchy
// @access  Private
const getUsersByHierarchy = async (req, res) => {
  try {
    let users = [];
    
    if (req.user.role === 'admin') {
      // Admin can see all users
      users = await User.find({})
        .select('-password')
        .populate('cithCentreId', 'name location')
        .populate('areaSupervisorId', 'name')
        .populate('districtId', 'name districtNumber');
    } else if (req.user.role === 'district_pastor') {
      // District pastor can see area supervisors and CITH centre leaders in their district
      const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
      const areaSupervisorIds = areaSupervisors.map(as => as._id);
      
      const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      
      users = await User.find({
        $or: [
          { areaSupervisorId: { $in: areaSupervisorIds } },
          { cithCentreId: { $in: cithCentreIds } }
        ]
      })
        .select('-password')
        .populate('cithCentreId', 'name location')
        .populate('areaSupervisorId', 'name');
    } else if (req.user.role === 'area_supervisor') {
      // Area supervisor can see CITH centre leaders under them
      const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      
      users = await User.find({ cithCentreId: { $in: cithCentreIds } })
        .select('-password')
        .populate('cithCentreId', 'name location');
    }
    
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name districtNumber');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create new user (admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { email, password, name, phone, role, cithCentreId, areaSupervisorId, districtId } = req.body;

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

    // Return user without password
    const newUser = await User.findById(user._id)
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name districtNumber');

    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update allowed fields
    if (name) user.name = name;
    if (email) {
      // Check if email is already in use by another user
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: user._id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (phone) user.phone = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name districtNumber');
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
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
    
    // Prevent users from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user role (admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role, targetId, phone } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate role
    if (!['cith_centre', 'area_supervisor', 'district_pastor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Ensure phone is provided (either from request or existing user)
    const phoneToUse = phone || user.phone;
    if (!phoneToUse || phoneToUse.trim() === '') {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Prevent changing the last admin's role
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot change the role of the only admin account' });
      }
    }
    
    // Check if position is already taken (only if role is changing)
    if (role === 'district_pastor' && targetId) {
      const existingPastor = await User.findOne({ 
        role: 'district_pastor', 
        districtId: targetId,
        _id: { $ne: user._id }
      });
      
      if (existingPastor) {
        return res.status(400).json({ 
          message: 'This district already has a pastor assigned' 
        });
      }
    } else if (role === 'area_supervisor' && targetId) {
      const existingSupervisor = await User.findOne({ 
        role: 'area_supervisor', 
        areaSupervisorId: targetId,
        _id: { $ne: user._id }
      });
      
      if (existingSupervisor) {
        return res.status(400).json({ 
          message: 'This area already has a supervisor assigned' 
        });
      }
    } else if (role === 'cith_centre' && targetId) {
      const existingLeaders = await User.countDocuments({ 
        role: 'cith_centre', 
        cithCentreId: targetId,
        _id: { $ne: user._id }
      });
      
      if (existingLeaders >= 2) {
        return res.status(400).json({ 
          message: 'This CITH centre already has the maximum number of leaders (2)' 
        });
      }
    }
    
    // Clear previous associations
    user.cithCentreId = undefined;
    user.areaSupervisorId = undefined;
    user.districtId = undefined;
    
    // Set new role and phone
    user.role = role;
    user.phone = phoneToUse.trim(); // Always set phone
    
    // Set role-specific associations
    if (role === 'district_pastor' && targetId) {
      user.districtId = targetId;
    } else if (role === 'area_supervisor' && targetId) {
      user.areaSupervisorId = targetId;
    } else if (role === 'cith_centre' && targetId) {
      user.cithCentreId = targetId;
    }
    
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name districtNumber');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Toggle user active status (admin only)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deactivating the last admin
    if (user.role === 'admin' && user.isActive) {
      const activeAdminCount = await User.countDocuments({ 
        role: 'admin', 
        isActive: true 
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate the only active admin account' });
      }
    }
    
    // Prevent users from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name districtNumber');
    
    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reset user password (admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats
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
    res.status(400).json({ message: error.message });
  }
};

// @desc    Search users (admin only)
// @route   GET /api/users/search
// @access  Private/Admin
const searchUsers = async (req, res) => {
  try {
    const { q, role, status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('cithCentreId', 'name location')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name districtNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};