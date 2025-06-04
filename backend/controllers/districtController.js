// backend/controllers/districtController.js
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const User = require('../models/User');

// @desc    Get all districts
// @route   GET /api/districts
// @access  Private
const getDistricts = async (req, res) => {
  try {
    const districts = await District.find().lean();
    
    // Get actual user assignments for each district
    const districtsWithAssignments = await Promise.all(
      districts.map(async (district) => {
        // Find actual assigned user
        const assignedUser = await User.findOne({
          role: 'district_pastor',
          districtId: district._id
        }).select('name email phone');

        return {
          ...district,
          isAssigned: !!assignedUser,
          assignedPastor: assignedUser || null,
          // Override with actual user data
          pastorName: assignedUser ? assignedUser.name : 'Unassigned',
          contactEmail: assignedUser ? assignedUser.email : null,
          contactPhone: assignedUser ? assignedUser.phone : null
        };
      })
    );
    
    res.json(districtsWithAssignments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get district by ID
// @route   GET /api/districts/:id
// @access  Private
const getDistrictById = async (req, res) => {
  try {
    const district = await District.findById(req.params.id).lean();
    
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    
    // Find actual assigned user
    const assignedUser = await User.findOne({
      role: 'district_pastor',
      districtId: district._id
    }).select('name email phone');

    const districtWithAssignment = {
      ...district,
      isAssigned: !!assignedUser,
      assignedPastor: assignedUser || null,
      // Override with actual user data
      pastorName: assignedUser ? assignedUser.name : 'Unassigned',
      contactEmail: assignedUser ? assignedUser.email : null,
      contactPhone: assignedUser ? assignedUser.phone : null
    };
    
    res.json(districtWithAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create district
// @route   POST /api/districts
// @access  Private (admin only)
const createDistrict = async (req, res) => {
  try {
    // Don't include contact info in creation - it will come from user registration
    const districtData = {
      name: req.body.name,
      districtNumber: req.body.districtNumber,
      pastorName: 'Unassigned', // Default to unassigned
      description: req.body.description
    };
    
    const district = await District.create(districtData);
    
    // Add assignment info
    const districtWithAssignment = {
      ...district.toObject(),
      isAssigned: false,
      assignedPastor: null,
      contactEmail: null,
      contactPhone: null
    };
    
    res.status(201).json(districtWithAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update district
// @route   PUT /api/districts/:id
// @access  Private (admin only)
const updateDistrict = async (req, res) => {
  try {
    // Don't allow updating pastor info directly - it comes from user registration
    const updateData = {
      name: req.body.name,
      districtNumber: req.body.districtNumber,
      description: req.body.description
    };
    
    const district = await District.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    
    // Get actual assigned user
    const assignedUser = await User.findOne({
      role: 'district_pastor',
      districtId: district._id
    }).select('name email phone');

    const districtWithAssignment = {
      ...district.toObject(),
      isAssigned: !!assignedUser,
      assignedPastor: assignedUser || null,
      // Override with actual user data
      pastorName: assignedUser ? assignedUser.name : 'Unassigned',
      contactEmail: assignedUser ? assignedUser.email : null,
      contactPhone: assignedUser ? assignedUser.phone : null
    };
    
    res.json(districtWithAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete district
// @route   DELETE /api/districts/:id
// @access  Private (admin only)
const deleteDistrict = async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    
    // Check if there are users assigned to this district
    const assignedUsers = await User.find({ 
      role: 'district_pastor', 
      districtId: req.params.id 
    });
    
    if (assignedUsers.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete district with assigned pastor: ${assignedUsers.map(u => u.name).join(', ')}` 
      });
    }
    
    // Check if there are area supervisors under this district
    const areaSupervisors = await AreaSupervisor.find({ districtId: req.params.id });
    if (areaSupervisors.length > 0) {
      return res.status(400).json({ message: 'Cannot delete district with area supervisors' });
    }
    
    await District.findByIdAndDelete(req.params.id);
    res.json({ message: 'District removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
};