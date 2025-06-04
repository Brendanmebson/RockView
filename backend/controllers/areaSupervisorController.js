// backend/controllers/areaSupervisorController.js
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
const User = require('../models/User');

// @desc    Get all area supervisors
// @route   GET /api/area-supervisors
// @access  Private
const getAreaSupervisors = async (req, res) => {
  try {
    let query = {};
    
    // If user is district pastor, only show their area supervisors
    if (req.user.role === 'district_pastor') {
      query.districtId = req.user.districtId;
    }
    
    // Filter by district if provided
    if (req.query.districtId) {
      query.districtId = req.query.districtId;
    }
    
    const areaSupervisors = await AreaSupervisor.find(query)
      .populate('districtId')
      .lean();
    
    // Get actual user assignments for each area
    const areasWithAssignments = await Promise.all(
      areaSupervisors.map(async (area) => {
        // Find actual assigned user
        const assignedUser = await User.findOne({
          role: 'area_supervisor',
          areaSupervisorId: area._id
        }).select('name email phone');

        return {
          ...area,
          isAssigned: !!assignedUser,
          assignedSupervisor: assignedUser || null,
          // Override with actual user data
          supervisorName: assignedUser ? assignedUser.name : 'Unassigned',
          contactEmail: assignedUser ? assignedUser.email : null,
          contactPhone: assignedUser ? assignedUser.phone : null
        };
      })
    );
    
    res.json(areasWithAssignments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get area supervisor by ID
// @route   GET /api/area-supervisors/:id
// @access  Private
const getAreaSupervisorById = async (req, res) => {
  try {
    const areaSupervisor = await AreaSupervisor.findById(req.params.id)
      .populate('districtId')
      .lean();
    
    if (!areaSupervisor) {
      return res.status(404).json({ message: 'Area supervisor not found' });
    }
    
    // Find actual assigned user
    const assignedUser = await User.findOne({
      role: 'area_supervisor',
      areaSupervisorId: areaSupervisor._id
    }).select('name email phone');

    const areaWithAssignment = {
      ...areaSupervisor,
      isAssigned: !!assignedUser,
      assignedSupervisor: assignedUser || null,
      // Override with actual user data
      supervisorName: assignedUser ? assignedUser.name : 'Unassigned',
      contactEmail: assignedUser ? assignedUser.email : null,
      contactPhone: assignedUser ? assignedUser.phone : null
    };
    
    res.json(areaWithAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create area supervisor
// @route   POST /api/area-supervisors
// @access  Private (admin and district pastor)
const createAreaSupervisor = async (req, res) => {
  try {
    // If user is district pastor, set districtId to their district
    if (req.user.role === 'district_pastor') {
      req.body.districtId = req.user.districtId;
    }
    
    // Don't include contact info in creation - it will come from user registration
    const areaData = {
      name: req.body.name,
      districtId: req.body.districtId,
      supervisorName: 'Unassigned', // Default to unassigned
      contactEmail: null,
      contactPhone: null
    };
    
    const areaSupervisor = await AreaSupervisor.create(areaData);
    await areaSupervisor.populate('districtId');
    
    // Add assignment info
    const areaWithAssignment = {
      ...areaSupervisor.toObject(),
      isAssigned: false,
      assignedSupervisor: null
    };
    
    res.status(201).json(areaWithAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update area supervisor
// @route   PUT /api/area-supervisors/:id
// @access  Private
const updateAreaSupervisor = async (req, res) => {
  try {
    // Don't allow updating contact info directly - it comes from user registration
    const updateData = {
      name: req.body.name,
      districtId: req.body.districtId
    };
    
    const areaSupervisor = await AreaSupervisor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
      ).populate('districtId');
if (!areaSupervisor) {
  return res.status(404).json({ message: 'Area supervisor not found' });
}

// Find actual assigned user
const assignedUser = await User.findOne({
  role: 'area_supervisor',
  areaSupervisorId: areaSupervisor._id
}).select('name email phone');

const areaWithAssignment = {
  ...areaSupervisor.toObject(),
  isAssigned: !!assignedUser,
  assignedSupervisor: assignedUser || null,
  // Override with actual user data
  supervisorName: assignedUser ? assignedUser.name : 'Unassigned',
  contactEmail: assignedUser ? assignedUser.email : null,
  contactPhone: assignedUser ? assignedUser.phone : null
};

res.json(areaWithAssignment);
} catch (error) {
res.status(400).json({ message: error.message });
}
};
// @desc    Delete area supervisor
// @route   DELETE /api/area-supervisors/:id
// @access  Private
const deleteAreaSupervisor = async (req, res) => {
try {
const areaSupervisor = await AreaSupervisor.findById(req.params.id);
if (!areaSupervisor) {
return res.status(404).json({ message: 'Area supervisor not found' });
}
// Check if there are users assigned to this area
const assignedUsers = await User.find({ 
  role: 'area_supervisor', 
  areaSupervisorId: req.params.id 
});

if (assignedUsers.length > 0) {
  return res.status(400).json({ 
    message: `Cannot delete area supervisor with assigned user: ${assignedUsers.map(u => u.name).join(', ')}` 
  });
}

// Check if there are CITH centres under this area supervisor
const cithCentres = await CithCentre.find({ areaSupervisorId: req.params.id });
if (cithCentres.length > 0) {
  return res.status(400).json({ message: 'Cannot delete area supervisor with CITH centres' });
}

await AreaSupervisor.findByIdAndDelete(req.params.id);
res.json({ message: 'Area supervisor removed' });
} catch (error) {
res.status(400).json({ message: error.message });
}
};
module.exports = {
getAreaSupervisors,
getAreaSupervisorById,
createAreaSupervisor,
updateAreaSupervisor,
deleteAreaSupervisor,
};