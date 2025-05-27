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
    const { role, targetId } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate role
    if (!['cith_centre', 'area_supervisor', 'district_pastor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if position is already taken
    if (role === 'district_pastor') {
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
    } else if (role === 'area_supervisor') {
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
    } else if (role === 'cith_centre') {
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
    
    // Set new role and association
    user.role = role;
    if (role === 'district_pastor') {
      user.districtId = targetId;
    } else if (role === 'area_supervisor') {
      user.areaSupervisorId = targetId;
} else if (role === 'cith_centre') {
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
   res.status(400).json({ message: error.message });
 }
};

module.exports = {
 getAllUsers,
 getUsersByHierarchy,
 deleteUser,
 updateUserRole,
};