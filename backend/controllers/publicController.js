// backend/controllers/publicController.js
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
const User = require('../models/User');

// @desc    Get all districts (public)
// @route   GET /api/public/districts
// @access  Public
const getPublicDistricts = async (req, res) => {
  try {
    const districts = await District.find().select('_id name districtNumber pastorName description');
    
    // Check which districts have assigned pastors
    const districtsWithAssignment = await Promise.all(
      districts.map(async (district) => {
        const assignedPastor = await User.findOne({ 
          role: 'district_pastor', 
          districtId: district._id 
        }).select('name email');
        
        return {
          ...district.toObject(),
          isAssigned: !!assignedPastor,
          assignedPastor: assignedPastor ? {
            name: assignedPastor.name,
            email: assignedPastor.email
          } : null,
          displayText: assignedPastor ? 
            `Pastored by ${assignedPastor.name}` : 
            'Unassigned',
          // Override pastorName to show assignment status
          pastorName: assignedPastor ? assignedPastor.name : 'Unassigned'
        };
      })
    );
    
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
      .select('_id name supervisorName districtId contactEmail contactPhone');
    
    // Check which areas have assigned supervisors
    const areasWithAssignment = await Promise.all(
      areaSupervisors.map(async (area) => {
        const assignedSupervisor = await User.findOne({ 
          role: 'area_supervisor', 
          areaSupervisorId: area._id 
        }).select('name email');
        
        return {
          ...area.toObject(),
          isAssigned: !!assignedSupervisor,
          assignedSupervisor: assignedSupervisor ? {
            name: assignedSupervisor.name,
            email: assignedSupervisor.email
          } : null,
          displayText: assignedSupervisor ? 
            `Supervised by ${assignedSupervisor.name}` : 
            'Unassigned',
          // Override supervisorName to show assignment status
          supervisorName: assignedSupervisor ? 
            assignedSupervisor.name : 
            'Unassigned'
        };
      })
    );
    
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
      .select('_id name location leaderName areaSupervisorId contactEmail contactPhone');
    
    // Check which centres have assigned leaders
    const centresWithAssignment = await Promise.all(
      cithCentres.map(async (centre) => {
        const assignedLeaders = await User.find({ 
          role: 'cith_centre', 
          cithCentreId: centre._id 
        }).select('name email');
        
        return {
          ...centre.toObject(),
          isAssigned: assignedLeaders.length > 0,
          assignedLeaders: assignedLeaders,
          displayText: assignedLeaders.length > 0 ? 
            `Led by ${assignedLeaders.map(leader => leader.name).join(', ')}` : 
            'Unassigned',
          // Override leaderName to show assignment status
          leaderName: assignedLeaders.length > 0 ? 
            assignedLeaders.map(leader => leader.name).join(', ') : 
            'Unassigned'
        };
      })
    );
    
    console.log(`Sending ${centresWithAssignment.length} CITH centres to client`);
    res.json(centresWithAssignment);
  } catch (error) {
    console.error('Error fetching public CITH centres:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Test endpoint to check API connectivity
// @route   GET /api/public/test
// @access  Public
const testConnection = async (req, res) => {
  try {
    res.json({ message: 'API is working correctly' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPublicDistricts,
  getPublicAreaSupervisors,
  getPublicCithCentres,
  testConnection
};