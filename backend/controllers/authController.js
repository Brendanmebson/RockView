// backend/controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password, name, role, cithCentreId, areaSupervisorId, districtId } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user data object
    const userData = {
      username,
      email,
      password,
      name,
      role,
    };

    // Add role-specific IDs
    if (role === 'cith_centre' && cithCentreId) {
      userData.cithCentreId = cithCentreId;
    } else if (role === 'area_supervisor' && areaSupervisorId) {
      userData.areaSupervisorId = areaSupervisorId;
    } else if (role === 'district_pastor' && districtId) {
      userData.districtId = districtId;
    }

    // Create user
    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      cithCentreId: user.cithCentreId,
      areaSupervisorId: user.areaSupervisorId,
      districtId: user.districtId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Build user context 
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role
    };

    // Add role-specific information
    if (user.cithCentreId) {
      userResponse.cithCentreId = user.cithCentreId;
    }
    
    if (user.areaSupervisorId) {
      userResponse.areaSupervisorId = user.areaSupervisorId;
    }
    
    if (user.districtId) {
      userResponse.districtId = user.districtId;
    }

    res.json({
      ...userResponse,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'cithCentreId',
        populate: {
          path: 'areaSupervisorId', 
          populate: {
            path: 'districtId'
          }
        }
      })
      .populate({
        path: 'areaSupervisorId',
        populate: {
          path: 'districtId'
        }
      })
      .populate('districtId');
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only update allowed fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.username) user.username = req.body.username;
    if (req.body.password) user.password = req.body.password;

    // Don't allow updating role or associations through this endpoint
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    // Only allow admins to access this route (middleware should check this)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    const users = await User.find({})
      .select('-password')
      .populate('cithCentreId', 'name')
      .populate('areaSupervisorId', 'name')
      .populate('districtId', 'name');
    
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    // Only allow admins to access this route (middleware should check this)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'cithCentreId',
        populate: {
          path: 'areaSupervisorId',
          populate: {
            path: 'districtId'
          }
        }
      })
      .populate({
        path: 'areaSupervisorId',
        populate: {
          path: 'districtId'
        }
      })
      .populate('districtId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    // Only allow admins to access this route (middleware should check this)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow updating all fields for admin
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.username) user.username = req.body.username;
    if (req.body.password) user.password = req.body.password;
    if (req.body.role) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

    // Update associations based on role
    if (req.body.role === 'cith_centre') {
      user.cithCentreId = req.body.cithCentreId;
      user.areaSupervisorId = undefined;
      user.districtId = undefined;
    } else if (req.body.role === 'area_supervisor') {
      user.areaSupervisorId = req.body.areaSupervisorId;
      user.cithCentreId = undefined;
      user.districtId = undefined;
    } else if (req.body.role === 'district_pastor') {
      user.districtId = req.body.districtId;
      user.cithCentreId = undefined;
      user.areaSupervisorId = undefined;
    } else if (req.body.role === 'admin') {
      user.cithCentreId = undefined;
      user.areaSupervisorId = undefined;
      user.districtId = undefined;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      cithCentreId: updatedUser.cithCentreId,
      areaSupervisorId: updatedUser.areaSupervisorId,
      districtId: updatedUser.districtId,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    // Only allow admins to access this route (middleware should check this)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is also an admin
    if (user.role === 'admin') {
      // Get count of admin users
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only admin user' });
      }
    }

    await user.remove();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};