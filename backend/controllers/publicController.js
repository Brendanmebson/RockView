// backend/controllers/publicController.js
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
const User = require('../models/User');

// Helper function to check user assignments efficiently
const checkUserAssignments = async () => {
  try {
    // Get all users with their assignments
    const users = await User.find({}).select('role districtId areaSupervisorId cithCentreId name email phone');
    
    // Create assignment maps for quick lookup
    const assignmentMaps = {
      districts: new Map(),
      areas: new Map(),
      centres: new Map()
    };
    
    users.forEach(user => {
      if (user.role === 'district_pastor' && user.districtId) {
        assignmentMaps.districts.set(user.districtId.toString(), {
          name: user.name,
          email: user.email,
          phone: user.phone
        });
      } else if (user.role === 'area_supervisor' && user.areaSupervisorId) {
        assignmentMaps.areas.set(user.areaSupervisorId.toString(), {
          name: user.name,
          email: user.email,
          phone: user.phone
        });
      } else if (user.role === 'cith_centre' && user.cithCentreId) {
        if (!assignmentMaps.centres.has(user.cithCentreId.toString())) {
          assignmentMaps.centres.set(user.cithCentreId.toString(), []);
        }
        assignmentMaps.centres.get(user.cithCentreId.toString()).push({
          name: user.name,
          email: user.email,
          phone: user.phone
        });
      }
    });
    
    return assignmentMaps;
  } catch (error) {
    console.error('Error checking user assignments:', error);
    return {
      districts: new Map(),
      areas: new Map(),
      centres: new Map()
    };
  }
};

// @desc    Get all districts (public)
// @route   GET /api/public/districts
// @access  Public
const getPublicDistricts = async (req, res) => {
  try {
    const districts = await District.find().select('_id name districtNumber pastorName description');
    const assignmentMaps = await checkUserAssignments();
    
    const districtsWithAssignment = districts.map(district => {
      const assignedPastor = assignmentMaps.districts.get(district._id.toString());
      
      return {
        ...district.toObject(),
        isAssigned: !!assignedPastor,
        assignedPastor: assignedPastor || null,
        displayText: assignedPastor ? 
          `Pastored by ${assignedPastor.name}` : 
          'Unassigned - Available for Assignment',
        // Override pastorName to show assignment status
        pastorName: assignedPastor ? assignedPastor.name : 'Unassigned',
        // Only show contact info if assigned
        contactEmail: assignedPastor ? assignedPastor.email : null,
        contactPhone: assignedPastor ? assignedPastor.phone : null
      };
    });
    
    console.log(`Sending ${districtsWithAssignment.length} districts to client`);
    res.json(districtsWithAssignment);
  } catch (error) {
    console.error('Error fetching public districts:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all area supervisors (public)
// @route   GET /api/public/area-supervisors
// @access  Public
const getPublicAreaSupervisors = async (req, res) => {
  try {
    const areaSupervisors = await AreaSupervisor.find()
      .populate('districtId', '_id name districtNumber pastorName')
      .select('_id name supervisorName districtId');
    
    const assignmentMaps = await checkUserAssignments();
    
    const areasWithAssignment = areaSupervisors.map(area => {
      const assignedSupervisor = assignmentMaps.areas.get(area._id.toString());
      
      return {
        ...area.toObject(),
        isAssigned: !!assignedSupervisor,
        assignedSupervisor: assignedSupervisor || null,
        displayText: assignedSupervisor ? 
          `Supervised by ${assignedSupervisor.name}` : 
          'Unassigned - Available for Assignment',
        // Only show contact info from registered users
        contactEmail: assignedSupervisor ? assignedSupervisor.email : null,
        contactPhone: assignedSupervisor ? assignedSupervisor.phone : null,
        // Override supervisorName to show assignment status
        supervisorName: assignedSupervisor ? assignedSupervisor.name : 'Unassigned'
      };
    });
    
    console.log(`Sending ${areasWithAssignment.length} area supervisors to client`);
    res.json(areasWithAssignment);
  } catch (error) {
    console.error('Error fetching public area supervisors:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all CITH centres (public)
// @route   GET /api/public/cith-centres
// @access  Public
const getPublicCithCentres = async (req, res) => {
  try {
    const cithCentres = await CithCentre.find()
      .populate('areaSupervisorId', 'name districtId')
      .select('_id name location areaSupervisorId');
    
    const assignmentMaps = await checkUserAssignments();
    
    const centresWithAssignment = cithCentres.map(centre => {
      const assignedLeaders = assignmentMaps.centres.get(centre._id.toString()) || [];
      
      return {
        ...centre.toObject(),
        isAssigned: assignedLeaders.length > 0,
        assignedLeaders: assignedLeaders,
        displayText: assignedLeaders.length > 0 ? 
          `Led by ${assignedLeaders.map(leader => leader.name).join(', ')}` : 
          'Unassigned - Available for Assignment',
        // Only show contact info from registered users
        contactEmail: assignedLeaders.length > 0 ? assignedLeaders[0].email : null,
        contactPhone: assignedLeaders.length > 0 ? assignedLeaders[0].phone : null,
        // Override leaderName to show assignment status from registered users
        leaderName: assignedLeaders.length > 0 ? 
          assignedLeaders.map(leader => leader.name).join(', ') : 
          'Unassigned',
        // Add leader count for centres that can have multiple leaders
        leaderCount: assignedLeaders.length,
        maxLeaders: 2,
        hasVacancy: assignedLeaders.length < 2
      };
    });
    
    console.log(`Sending ${centresWithAssignment.length} CITH centres to client`);
    res.json(centresWithAssignment);
  } catch (error) {
    console.error('Error fetching public CITH centres:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get assignment statistics (public)
// @route   GET /api/public/assignment-stats
// @access  Public
const getAssignmentStats = async (req, res) => {
  try {
    const [districts, areaSupervisors, cithCentres] = await Promise.all([
      District.countDocuments(),
      AreaSupervisor.countDocuments(),
      CithCentre.countDocuments()
    ]);
    
    const assignmentMaps = await checkUserAssignments();
    
    const stats = {
      districts: {
        total: districts,
        assigned: assignmentMaps.districts.size,
        unassigned: districts - assignmentMaps.districts.size,
        assignmentRate: districts > 0 ? ((assignmentMaps.districts.size / districts) * 100).toFixed(1) : '0'
      },
      areaSupervisors: {
        total: areaSupervisors,
        assigned: assignmentMaps.areas.size,
        unassigned: areaSupervisors - assignmentMaps.areas.size,
        assignmentRate: areaSupervisors > 0 ? ((assignmentMaps.areas.size / areaSupervisors) * 100).toFixed(1) : '0'
      },
      cithCentres: {
        total: cithCentres,
        assigned: assignmentMaps.centres.size,
        unassigned: cithCentres - assignmentMaps.centres.size,
        assignmentRate: cithCentres > 0 ? ((assignmentMaps.centres.size / cithCentres) * 100).toFixed(1) : '0'
      },
      overall: {
        totalPositions: districts + areaSupervisors + cithCentres,
        assignedPositions: assignmentMaps.districts.size + assignmentMaps.areas.size + assignmentMaps.centres.size,
        overallAssignmentRate: (districts + areaSupervisors + cithCentres) > 0 ? 
          (((assignmentMaps.districts.size + assignmentMaps.areas.size + assignmentMaps.centres.size) / 
            (districts + areaSupervisors + cithCentres)) * 100).toFixed(1) : '0'
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get available positions for registration
// @route   GET /api/public/available-positions
// @access  Public
const getAvailablePositions = async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role || !['district_pastor', 'area_supervisor', 'cith_centre'].includes(role)) {
      return res.status(400).json({ message: 'Valid role parameter required' });
    }
    
    const assignmentMaps = await checkUserAssignments();
    let availablePositions = [];
    
    if (role === 'district_pastor') {
      const allDistricts = await District.find().select('_id name districtNumber pastorName description');
      availablePositions = allDistricts.filter(district => 
        !assignmentMaps.districts.has(district._id.toString())
      ).map(district => ({
        ...district.toObject(),
        isAvailable: true,
        positionType: 'district_pastor'
      }));
    } else if (role === 'area_supervisor') {
      const allAreas = await AreaSupervisor.find()
        .populate('districtId', 'name districtNumber')
        .select('_id name supervisorName districtId');
      availablePositions = allAreas.filter(area => 
        !assignmentMaps.areas.has(area._id.toString())
      ).map(area => ({
        ...area.toObject(),
        isAvailable: true,
        positionType: 'area_supervisor'
      }));
    } else if (role === 'cith_centre') {
      const allCentres = await CithCentre.find()
        .populate('areaSupervisorId', 'name districtId')
        .select('_id name location leaderName areaSupervisorId');
      availablePositions = allCentres.filter(centre => {
        const assignedLeaders = assignmentMaps.centres.get(centre._id.toString()) || [];
        return assignedLeaders.length < 2;
      }).map(centre => {
        const assignedLeaders = assignmentMaps.centres.get(centre._id.toString()) || [];
        return {
          ...centre.toObject(),
          isAvailable: true,
          positionType: 'cith_centre',
          currentLeaderCount: assignedLeaders.length,
          maxLeaders: 2,
          hasVacancy: assignedLeaders.length < 2
        };
      });
    }
    
    res.json({
      role,
      totalAvailable: availablePositions.length,
      positions: availablePositions
    });
  } catch (error) {
    console.error('Error fetching available positions:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Test endpoint to check API connectivity
// @route   GET /api/public/test
// @access  Public
const testConnection = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const connectionStatus = {
      message: 'API is working correctly',
      timestamp,
      status: 'healthy',
      database: 'connected'
    };
    
    await District.countDocuments();
    
    res.json(connectionStatus);
  } catch (error) {
    res.status(500).json({ 
      message: 'API connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'unhealthy'
    });
  }
};

module.exports = {
  getPublicDistricts,
  getPublicAreaSupervisors,
  getPublicCithCentres,
  getAssignmentStats,
  getAvailablePositions,
  testConnection,
  checkUserAssignments
};