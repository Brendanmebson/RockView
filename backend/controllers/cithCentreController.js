// backend/controllers/cithCentreController.js
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');
const User = require('../models/User');

// @desc    Get all CITH centres
// @route   GET /api/cith-centres
// @access  Private
const getCithCentres = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'area_supervisor') {
      query.areaSupervisorId = req.user.areaSupervisorId;
    } else if (req.user.role === 'district_pastor') {
      // Get all area supervisors in this district
      const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
      const areaSupervisorIds = areaSupervisors.map(as => as._id);
      query.areaSupervisorId = { $in: areaSupervisorIds };
    }
    
    // Filter by area supervisor IDs if provided
    if (req.query.areaSupervisorIds) {
      const areaSupervisorIds = req.query.areaSupervisorIds.split(',');
      query.areaSupervisorId = { $in: areaSupervisorIds };
    }
    
    // Filter by a single area supervisor ID if provided
    if (req.query.areaSupervisorId) {
      query.areaSupervisorId = req.query.areaSupervisorId;
    }
    
    const cithCentres = await CithCentre.find(query)
      .populate({
        path: 'areaSupervisorId',
        populate: {
          path: 'districtId',
          model: 'District'
        }
      })
      .lean();
    
    // Get actual user assignments for each centre
    const centresWithAssignments = await Promise.all(
      cithCentres.map(async (centre) => {
        // Find actual assigned users
        const assignedUsers = await User.find({
          role: 'cith_centre',
          cithCentreId: centre._id
        }).select('name email phone');

        // Ensure we have proper district information
        let districtName = 'Unknown District';
        let areaName = 'Unknown Area';
        
        if (centre.areaSupervisorId) {
          areaName = centre.areaSupervisorId.name || 'Unknown Area';
          if (centre.areaSupervisorId.districtId) {
            districtName = centre.areaSupervisorId.districtId.name || 'Unknown District';
          }
        }

        return {
          ...centre,
          isAssigned: assignedUsers.length > 0,
          assignedLeaders: assignedUsers,
          // Override with actual user data
          leaderName: assignedUsers.length > 0 
            ? assignedUsers.map(user => user.name).join(', ')
            : 'Unassigned',
          contactEmail: assignedUsers.length > 0 ? assignedUsers[0].email : null,
          contactPhone: assignedUsers.length > 0 ? assignedUsers[0].phone : null,
          leaderCount: assignedUsers.length,
          hasVacancy: assignedUsers.length < 2,
          maxLeaders: 2,
          // Ensure we have proper area supervisor information
          areaSupervisorName: areaName,
          districtName: districtName
        };
      })
    );
    
    res.json(centresWithAssignments);
  } catch (error) {
    console.error('Error in getCithCentres:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get CITH centre by ID
// @route   GET /api/cith-centres/:id
// @access  Private
const getCithCentreById = async (req, res) => {
  try {
    const { populate } = req.query;
    
    let query = CithCentre.findById(req.params.id);
    
    // If populate=true, include nested information
    if (populate === 'true') {
      query = query.populate({
        path: 'areaSupervisorId',
        populate: {
          path: 'districtId'
        }
      });
    } else {
      query = query.populate('areaSupervisorId');
    }
    
    const cithCentre = await query.lean();
    
    if (!cithCentre) {
      return res.status(404).json({ message: 'CITH centre not found' });
    }
    
    // Get actual assigned users
    const assignedUsers = await User.find({
      role: 'cith_centre',
      cithCentreId: cithCentre._id
    }).select('name email phone');

    // Ensure we have proper district information
    let districtName = 'Unknown District';
    let areaName = 'Unknown Area';
    
    if (cithCentre.areaSupervisorId) {
      areaName = cithCentre.areaSupervisorId.name || 'Unknown Area';
      if (cithCentre.areaSupervisorId.districtId) {
        districtName = cithCentre.areaSupervisorId.districtId.name || 'Unknown District';
      }
    }

    const centreWithAssignments = {
      ...cithCentre,
      isAssigned: assignedUsers.length > 0,
      assignedLeaders: assignedUsers,
      // Override with actual user data
      leaderName: assignedUsers.length > 0 
        ? assignedUsers.map(user => user.name).join(', ')
        : 'Unassigned',
      contactEmail: assignedUsers.length > 0 ? assignedUsers[0].email : null,
      contactPhone: assignedUsers.length > 0 ? assignedUsers[0].phone : null,
      leaderCount: assignedUsers.length,
      hasVacancy: assignedUsers.length < 2,
      maxLeaders: 2,
      areaSupervisorName: areaName,
      districtName: districtName
    };
    
    res.json(centreWithAssignments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create CITH centre
// @route   POST /api/cith-centres
// @access  Private
const createCithCentre = async (req, res) => {
  try {
    // If user is area supervisor, set areaSupervisorId to their area
    if (req.user.role === 'area_supervisor') {
      req.body.areaSupervisorId = req.user.areaSupervisorId;
    }
    
    // Don't include contact info in creation - it will come from user registration
    const centreData = {
      name: req.body.name,
      areaSupervisorId: req.body.areaSupervisorId,
      location: req.body.location,
      leaderName: 'Unassigned', // Default to unassigned
      contactEmail: null,
      contactPhone: null
    };
    
    const cithCentre = await CithCentre.create(centreData);
    await cithCentre.populate({
      path: 'areaSupervisorId',
      populate: {
        path: 'districtId'
      }
    });
    
    // Add assignment info
    const centreWithAssignments = {
      ...cithCentre.toObject(),
      isAssigned: false,
      assignedLeaders: [],
      leaderCount: 0,
      hasVacancy: true,
      maxLeaders: 2,
      areaSupervisorName: cithCentre.areaSupervisorId?.name || 'Unknown Area',
      districtName: cithCentre.areaSupervisorId?.districtId?.name || 'Unknown District'
    };
    
    res.status(201).json(centreWithAssignments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update CITH centre
// @route   PUT /api/cith-centres/:id
// @access  Private
const updateCithCentre = async (req, res) => {
  try {
    // Don't allow updating contact info directly - it comes from user registration
    const updateData = {
      name: req.body.name,
      location: req.body.location,
      areaSupervisorId: req.body.areaSupervisorId
    };
    
    const cithCentre = await CithCentre.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate({
      path: 'areaSupervisorId',
      populate: {
        path: 'districtId'
      }
    });
    
    if (!cithCentre) {
      return res.status(404).json({ message: 'CITH centre not found' });
    }
    
    // Get actual assigned users
    const assignedUsers = await User.find({
      role: 'cith_centre',
      cithCentreId: cithCentre._id
    }).select('name email phone');

    const centreWithAssignments = {
      ...cithCentre.toObject(),
      isAssigned: assignedUsers.length > 0,
      assignedLeaders: assignedUsers,
      // Override with actual user data
      leaderName: assignedUsers.length > 0 
        ? assignedUsers.map(user => user.name).join(', ')
        : 'Unassigned',
      contactEmail: assignedUsers.length > 0 ? assignedUsers[0].email : null,
      contactPhone: assignedUsers.length > 0 ? assignedUsers[0].phone : null,
      leaderCount: assignedUsers.length,
      hasVacancy: assignedUsers.length < 2,
      maxLeaders: 2,
      areaSupervisorName: cithCentre.areaSupervisorId?.name || 'Unknown Area',
      districtName: cithCentre.areaSupervisorId?.districtId?.name || 'Unknown District'
    };
    
    res.json(centreWithAssignments);
    } catch (error) {
   res.status(400).json({ message: error.message });
 }
};

// @desc    Delete CITH centre
// @route   DELETE /api/cith-centres/:id
// @access  Private
const deleteCithCentre = async (req, res) => {
 try {
   const cithCentre = await CithCentre.findById(req.params.id);
   if (!cithCentre) {
     return res.status(404).json({ message: 'CITH centre not found' });
   }
   
   // Check if there are users assigned to this centre
   const assignedUsers = await User.find({ 
     role: 'cith_centre', 
     cithCentreId: req.params.id 
   });
   
   if (assignedUsers.length > 0) {
     return res.status(400).json({ 
       message: `Cannot delete CITH centre with assigned leaders: ${assignedUsers.map(u => u.name).join(', ')}` 
     });
   }
   
   await CithCentre.findByIdAndDelete(req.params.id);
   res.json({ message: 'CITH centre removed' });
 } catch (error) {
   res.status(400).json({ message: error.message });
 }
};

module.exports = {
 getCithCentres,
 getCithCentreById,
 createCithCentre,
 updateCithCentre,
 deleteCithCentre,
};