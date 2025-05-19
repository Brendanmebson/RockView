const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');

// @desc    Get all districts (public)
// @route   GET /api/public/districts
// @access  Public
const getPublicDistricts = async (req, res) => {
  try {
    const districts = await District.find().select('_id name districtNumber');
    res.json(districts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all area supervisors (public)
// @route   GET /api/public/area-supervisors
// @access  Public
const getPublicAreaSupervisors = async (req, res) => {
  try {
    const areaSupervisors = await AreaSupervisor.find()
      .populate('districtId', 'name')
      .select('_id name supervisorName districtId');
    res.json(areaSupervisors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all CITH centres (public)
// @route   GET /api/public/cith-centres
// @access  Public
const getPublicCithCentres = async (req, res) => {
  try {
    const cithCentres = await CithCentre.find()
      .populate('areaSupervisorId', 'name')
      .select('_id name location leaderName areaSupervisorId');
    res.json(cithCentres);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPublicDistricts,
  getPublicAreaSupervisors,
  getPublicCithCentres,
};