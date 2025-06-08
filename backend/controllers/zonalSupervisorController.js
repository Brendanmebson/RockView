// backend/controllers/zonalSupervisorController.js
const ZonalSupervisor = require('../models/ZonalSupervisor');
const AreaSupervisor = require('../models/AreaSupervisor');
const User = require('../models/User');

// @desc    Get all zonal supervisors
// @route   GET /api/zonal-supervisors
// @access  Private
const getZonalSupervisors = async (req, res) => {
  try {
    let query = {};
    
    // If user is district pastor, only show their zonal supervisors
    if (req.user.role === 'district_pastor') {
      query.districtId = req.user.districtId;
    }
    
    // Filter by district if provided
    if (req.query.districtId) {
      query.districtId = req.query.districtId;
    }
    
    const zonalSupervisors = await ZonalSupervisor.find(query)
      .populate('districtId')
      .populate('areaSupervisorIds')
      .lean();
    
    // Get actual user assignments for each zonal supervisor
    const zonalsWithAssignments = await Promise.all(
      zonalSupervisors.map(async (zonal) => {
        // Find actual assigned user
        const assignedUser = await User.findOne({
          role: 'zonal_supervisor',
          zonalSupervisorId: zonal._id
        }).select('name email phone');

        return {
          ...zonal,
          isAssigned: !!assignedUser,
          assignedSupervisor: assignedUser || null,
          // Override with actual user data
          supervisorName: assignedUser ? assignedUser.name : 'Unassigned',
          contactEmail: assignedUser ? assignedUser.email : null,
          contactPhone: assignedUser ? assignedUser.phone : null
        };
      })
    );
    
    res.json(zonalsWithAssignments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create zonal supervisor
// @route   POST /api/zonal-supervisors
// @access  Private (admin and district pastor)
const createZonalSupervisor = async (req, res) => {
  try {
    // If user is district pastor, set districtId to their district
    if (req.user.role === 'district_pastor') {
      req.body.districtId = req.user.districtId;
    }
    
    const zonalData = {
      name: req.body.name,
      districtId: req.body.districtId,
      areaSupervisorIds: req.body.areaSupervisorIds,
      supervisorName: 'Unassigned',
      contactEmail: null,
      contactPhone: null
    };
    
    const zonalSupervisor = await ZonalSupervisor.create(zonalData);
    await zonalSupervisor.populate(['districtId', 'areaSupervisorIds']);
    
    const zonalWithAssignment = {
      ...zonalSupervisor.toObject(),
      isAssigned: false,
      assignedSupervisor: null
    };
    
    res.status(201).json(zonalWithAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update zonal supervisor
// @route   PUT /api/zonal-supervisors/:id
// @access  Private
const updateZonalSupervisor = async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      districtId: req.body.districtId,
      areaSupervisorIds: req.body.areaSupervisorIds
    };
    
    const zonalSupervisor = await ZonalSupervisor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate(['districtId', 'areaSupervisorIds']);
    
    if (!zonalSupervisor) {
      return res.status(404).json({ message: 'Zonal supervisor not found' });
    }

    // Find actual assigned user
    const assignedUser = await User.findOne({
      role: 'zonal_supervisor',
      zonalSupervisorId: zonalSupervisor._id
    }).select('name email phone');

    const zonalWithAssignment = {
      ...zonalSupervisor.toObject(),
      isAssigned: !!assignedUser,
      assignedSupervisor: assignedUser || null,
      supervisorName: assignedUser ? assignedUser.name : 'Unassigned',
      contactEmail: assignedUser ? assignedUser.email : null,
      contactPhone: assignedUser ? assignedUser.phone : null
    };

    res.json(zonalWithAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete zonal supervisor
// @route   DELETE /api/zonal-supervisors/:id
// @access  Private
const deleteZonalSupervisor = async (req, res) => {
  try {
    const zonalSupervisor = await ZonalSupervisor.findById(req.params.id);
    if (!zonalSupervisor) {
      return res.status(404).json({ message: 'Zonal supervisor not found' });
    }
    
    // Check if there are users assigned to this zonal supervisor
    const assignedUsers = await User.find({ 
      role: 'zonal_supervisor', 
      zonalSupervisorId: req.params.id 
    });

    if (assignedUsers.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete zonal supervisor with assigned user: ${assignedUsers.map(u => u.name).join(', ')}` 
      });
    }

    await ZonalSupervisor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Zonal supervisor removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getZonalSupervisors,
  createZonalSupervisor,
  updateZonalSupervisor,
  deleteZonalSupervisor,
};