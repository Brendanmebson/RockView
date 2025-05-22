// backend/controllers/publicController.js
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');

// @desc    Get all districts (public)
// @route   GET /api/public/districts
// @access  Public
const getPublicDistricts = async (req, res) => {
  try {
    const districts = await District.find().select('_id name districtNumber pastorName description');
    console.log(`Sending ${districts.length} districts to client`);
    res.json(districts);
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
    // Make sure we fully populate the district information
    const areaSupervisors = await AreaSupervisor.find()
      .populate('districtId', '_id name districtNumber pastorName')
      .select('_id name supervisorName districtId contactEmail contactPhone');
    
    console.log(`Sending ${areaSupervisors.length} area supervisors to client`);
    console.log('First area supervisor example:', areaSupervisors[0]);
    res.json(areaSupervisors);
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
    console.log(`Sending ${cithCentres.length} CITH centres to client`);
    res.json(cithCentres);
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