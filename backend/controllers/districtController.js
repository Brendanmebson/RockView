const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');

// @desc    Get all districts
// @route   GET /api/districts
// @access  Private
const getDistricts = async (req, res) => {
  try {
    const districts = await District.find();
    res.json(districts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create district
// @route   POST /api/districts
// @access  Private (admin only)
const createDistrict = async (req, res) => {
  try {
    const district = await District.create(req.body);
    res.status(201).json(district);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update district
// @route   PUT /api/districts/:id
// @access  Private (admin only)
const updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.json(district);
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
    
    // Check if there are area supervisors under this district
    const areaSupervisors = await AreaSupervisor.find({ districtId: req.params.id });
    if (areaSupervisors.length > 0) {
      return res.status(400).json({ message: 'Cannot delete district with area supervisors' });
    }
    
    await district.remove();
    res.json({ message: 'District removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
};