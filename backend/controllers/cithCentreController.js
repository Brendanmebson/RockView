const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');

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
    
    const cithCentres = await CithCentre.find(query).populate('areaSupervisorId');
    res.json(cithCentres);
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
    
    const cithCentre = await CithCentre.create(req.body);
    await cithCentre.populate('areaSupervisorId');
    res.status(201).json(cithCentre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update CITH centre
// @route   PUT /api/cith-centres/:id
// @access  Private
const updateCithCentre = async (req, res) => {
  try {
    const cithCentre = await CithCentre.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('areaSupervisorId');
    
    if (!cithCentre) {
      return res.status(404).json({ message: 'CITH centre not found' });
    }
    res.json(cithCentre);
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
    
    await cithCentre.remove();
    res.json({ message: 'CITH centre removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getCithCentres,
  createCithCentre,
  updateCithCentre,
  deleteCithCentre,
};