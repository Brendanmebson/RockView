// backend/controllers/authController.js
const User = require('../models/User');
const PositionChangeRequest = require('../models/PositionChangeRequest');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');
const District = require('../models/District');
const generateToken = require('../utils/generateToken');
const ZonalSupervisor = require('../models/ZonalSupervisor');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// Update the register function to handle zonal_supervisor role
const register = async (req, res) => {
  try {
    const { email, password, name, phone, role, cithCentreId, areaSupervisorId, zonalSupervisorId, districtId } = req.body;

    console.log('Registration request:', { email, name, role, phone }); // Add logging

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Validate required fields
    if (!email || !password || !name || !phone || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role - make sure it's one of the allowed values
    const validRoles = ['cith_centre', 'area_supervisor', 'zonal_supervisor', 'district_pastor', 'admin'];
    if (!validRoles.includes(role)) {
      console.log('Invalid role provided:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
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
      // Check if this district already has a pastor
      const existingPastor = await User.findOne({ role: 'district_pastor', districtId });
      if (existingPastor) {
        return res.status(400).json({ 
          message: 'This district already has a pastor assigned' 
        });
      }
      userData.districtId = districtId;
    } else if (role === 'zonal_supervisor') {
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

    // Update the respective entity with user information
    if (role === 'district_pastor' && districtId) {
      await District.findByIdAndUpdate(districtId, {
        pastorName: name
      });
    } else if (role === 'zonal_supervisor' && zonalSupervisorId) {
      await ZonalSupervisor.findByIdAndUpdate(zonalSupervisorId, {
        supervisorName: name,
        contactEmail: email,
        contactPhone: phone
      });
    } else if (role === 'area_supervisor' && areaSupervisorId) {
      await AreaSupervisor.findByIdAndUpdate(areaSupervisorId, {
        supervisorName: name,
        contactEmail: email,
        contactPhone: phone
      });
    } else if (role === 'cith_centre' && cithCentreId) {
      // Get all users assigned to this centre (including the newly created one)
      const centreUsers = await User.find({
        role: 'cith_centre',
        cithCentreId: cithCentreId
      });
      
      // Update centre with leader information
      await CithCentre.findByIdAndUpdate(cithCentreId, {
        leaderName: centreUsers.map(u => u.name).join(', '),
        contactEmail: centreUsers[0].email, // Use first leader's email
        contactPhone: centreUsers[0].phone  // Use first leader's phone
      });
    }

    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      cithCentreId: user.cithCentreId,
      areaSupervisorId: user.areaSupervisorId,
      zonalSupervisorId: user.zonalSupervisorId,
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
      email: user.email,
      name: user.name,
      phone: user.phone,
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
    if (req.body.phone) user.phone = req.body.phone;

    const updatedUser = await user.save();

    // Update the respective entity if name, email, or phone changed
    if (user.role === 'district_pastor' && user.districtId) {
      await District.findByIdAndUpdate(user.districtId, {
        pastorName: updatedUser.name
      });
    } else if (user.role === 'area_supervisor' && user.areaSupervisorId) {
      await AreaSupervisor.findByIdAndUpdate(user.areaSupervisorId, {
        supervisorName: updatedUser.name,
        contactEmail: updatedUser.email,
        contactPhone: updatedUser.phone
      });
    } else if (user.role === 'cith_centre' && user.cithCentreId) {
      // Get all users assigned to this centre
      const centreUsers = await User.find({
        role: 'cith_centre',
        cithCentreId: user.cithCentreId
      });
      
      await CithCentre.findByIdAndUpdate(user.cithCentreId, {
        leaderName: centreUsers.map(u => u.name).join(', '),
        contactEmail: centreUsers[0].email,
        contactPhone: centreUsers[0].phone
      });
    }

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Fetch user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete user account (self)
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

    // Clear the entity assignment when user deletes account
    if (user.role === 'district_pastor' && user.districtId) {
      await District.findByIdAndUpdate(user.districtId, {
        pastorName: 'Unassigned'
      });
    } else if (user.role === 'area_supervisor' && user.areaSupervisorId) {
      await AreaSupervisor.findByIdAndUpdate(user.areaSupervisorId, {
        supervisorName: 'Unassigned',
        contactEmail: null,
        contactPhone: null
      });
    } else if (user.role === 'cith_centre' && user.cithCentreId) {
      // Get remaining users assigned to this centre
      const remainingUsers = await User.find({
        role: 'cith_centre',
        cithCentreId: user.cithCentreId,
        _id: { $ne: user._id }
      });
      
      if (remainingUsers.length > 0) {
        await CithCentre.findByIdAndUpdate(user.cithCentreId, {
          leaderName: remainingUsers.map(u => u.name).join(', '),
          contactEmail: remainingUsers[0].email,
          contactPhone: remainingUsers[0].phone
        });
      } else {
        await CithCentre.findByIdAndUpdate(user.cithCentreId, {
          leaderName: 'Unassigned',
          contactEmail: null,
          contactPhone: null
        });
      }
    }
    
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit position change request
// @route   POST /api/auth/position-change-request
// @access  Private
const submitPositionChangeRequest = async (req, res) => {
  try {
    const { newRole, targetId } = req.body;
    
    // Validate role
    if (!['cith_centre', 'area_supervisor', 'district_pastor'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role requested' });
    }
    
    // Check if the position is already taken
    if (newRole === 'district_pastor') {
      const existingPastor = await User.findOne({ 
        role: 'district_pastor', 
        districtId: targetId 
      });
      
      if (existingPastor) {
        return res.status(400).json({ 
          message: 'This district already has a pastor assigned' 
        });
      }
    } else if (newRole === 'area_supervisor') {
      const existingSupervisor = await User.findOne({ 
        role: 'area_supervisor', 
        areaSupervisorId: targetId 
      });
      
      if (existingSupervisor) {
        return res.status(400).json({ 
          message: 'This area already has a supervisor assigned' 
        });
      }
    } else if (newRole === 'cith_centre') {
      // Check if centre already has the maximum number of leaders
      const existingLeaders = await User.countDocuments({ 
        role: 'cith_centre', 
        cithCentreId: targetId 
      });
      
      if (existingLeaders >= 2) {
        return res.status(400).json({ 
          message: 'This CITH centre already has the maximum number of leaders (2)' 
        });
      }
    }
    
    // Create position change request
    await PositionChangeRequest.create({
      userId: req.user._id,
      currentRole: req.user.role,
      newRole,
      targetId,
      status: 'pending',
    });
    
    res.status(201).json({ message: 'Position change request submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get position change requests (admin only)
// @route   GET /api/auth/position-change-requests
// @access  Private/Admin
const getPositionChangeRequests = async (req, res) => {
  try {
    const requests = await PositionChangeRequest.find()
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
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
      return res.status(400).json({ message: 'Request is not pending' });
    }
    
    // Update user role and associations
    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear previous entity assignment
    if (user.role === 'district_pastor' && user.districtId) {
      await District.findByIdAndUpdate(user.districtId, {
        pastorName: 'Unassigned'
      });
    } else if (user.role === 'area_supervisor' && user.areaSupervisorId) {
      await AreaSupervisor.findByIdAndUpdate(user.areaSupervisorId, {
        supervisorName: 'Unassigned',
        contactEmail: null,
        contactPhone: null
      });
    } else if (user.role === 'cith_centre' && user.cithCentreId) {
      const remainingUsers = await User.find({
        role: 'cith_centre',
        cithCentreId: user.cithCentreId,
        _id: { $ne: user._id }
      });
      
      if (remainingUsers.length > 0) {
        await CithCentre.findByIdAndUpdate(user.cithCentreId, {
          leaderName: remainingUsers.map(u => u.name).join(', '),
          contactEmail: remainingUsers[0].email,
          contactPhone: remainingUsers[0].phone
        });
      } else {
        await CithCentre.findByIdAndUpdate(user.cithCentreId, {
          leaderName: 'Unassigned',
          contactEmail: null,
          contactPhone: null
        });
      }
    }
    
    // Clear previous associations
    user.cithCentreId = undefined;
    user.areaSupervisorId = undefined;
    user.districtId = undefined;
    
    // Set new role and association
    user.role = request.newRole;
    if (request.newRole === 'district_pastor') {
      user.districtId = request.targetId;
      await District.findByIdAndUpdate(request.targetId, {
        pastorName: user.name
      });
    } else if (request.newRole === 'area_supervisor') {
      user.areaSupervisorId = request.targetId;
      await AreaSupervisor.findByIdAndUpdate(request.targetId, {
        supervisorName: user.name,
        contactEmail: user.email,
        contactPhone: user.phone
      });
    } else if (request.newRole === 'cith_centre') {
      user.cithCentreId = request.targetId;
      const centreUsers = await User.find({
        role: 'cith_centre',
        cithCentreId: request.targetId
      });
      centreUsers.push(user); // Add the current user to the list
      
      await CithCentre.findByIdAndUpdate(request.targetId, {
        leaderName: centreUsers.map(u => u.name).join(', '),
        contactEmail: centreUsers[0].email,
        contactPhone: centreUsers[0].phone
      });
    }
    
    await user.save();
    
    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    
    res.json({ message: 'Position change request approved successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reject position change request
// @route   PUT /api/auth/position-change-requests/:id/reject
// @access  Private/Admin
const rejectPositionChangeRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await PositionChangeRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }
    
    request.status = 'rejected';
    request.rejectionReason = reason;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    
    res.json({ message: 'Position change request rejected successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
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
};