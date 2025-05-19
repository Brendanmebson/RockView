const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');

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
    
    const areaSupervisors = await AreaSupervisor.find(query).populate('districtId');
    res.json(areaSupervisors);
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
    
    const areaSupervisor = await AreaSupervisor.create(req.body);
    await areaSupervisor.populate('districtId');
    res.status(201).json(areaSupervisor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update area supervisor
// @route   PUT /api/area-supervisors/:id
// @access  Private
const updateAreaSupervisor = async (req, res) => {
  try {
    const areaSupervisor = await AreaSupervisor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('districtId');
    
    if (!areaSupervisor) {
      return res.status(404).json({ message: 'Area supervisor not found' });
    }
    res.json(areaSupervisor);
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
    
    // Check if there are CITH centres under this area supervisor
    const cithCentres = await CithCentre.find({ areaSupervisorId: req.params.id });
    if (cithCentres.length > 0) {
      return res.status(400).json({ message: 'Cannot delete area supervisor with CITH centres' });
    }
    
    await areaSupervisor.remove();
    res.json({ message: 'Area supervisor removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAreaSupervisors,
  createAreaSupervisor,
  updateAreaSupervisor,
  deleteAreaSupervisor,
};