// backend/controllers/reportController.js
const WeeklyReport = require('../models/WeeklyReport');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');
const District = require('../models/District');

// @desc    Submit weekly report
// @route   POST /api/reports
// @access  Private (CITH centre only)
const submitReport = async (req, res) => {
  try {
    const { week, data } = req.body;
    
    // Validate that the user has access to submit for this centre
    if (req.user.role !== 'cith_centre') {
      return res.status(403).json({ message: 'Only CITH centres can submit reports' });
    }
    
    // Set the CITH centre ID from user's association
    const cithCentreId = req.user.cithCentreId;
    
    // Validate the week format (should be start of week)
    const weekStart = new Date(week);
    weekStart.setHours(0, 0, 0, 0);
    
    // Check if report for this week already exists
    const existingReport = await WeeklyReport.findOne({
      cithCentreId,
      week: weekStart,
    });
    
    if (existingReport) {
      return res.status(400).json({ message: 'Report for this week already exists' });
    }
    
    // Create the report
    const report = await WeeklyReport.create({
      cithCentreId,
      week: weekStart,
      data,
      submittedBy: req.user._id,
    });
    
    await report.populate('cithCentreId submittedBy');
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get reports based on user role
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    let query = {};
    const { page = 1, limit = 10, status, week } = req.query;
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by week if provided
    if (week) {
      query.week = new Date(week);
    }
    
    // Role-based filtering
    if (req.user.role === 'cith_centre') {
      query.cithCentreId = req.user.cithCentreId;
    } else if (req.user.role === 'area_supervisor') {
      // Get all CITH centres under this area supervisor
      const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      query.cithCentreId = { $in: cithCentreIds };
    } else if (req.user.role === 'district_pastor') {
      // Get all area supervisors in this district
      const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
      const areaSupervisorIds = areaSupervisors.map(as => as._id);
      
      // Get all CITH centres under these area supervisors
      const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      query.cithCentreId = { $in: cithCentreIds };
    }
    
    const reports = await WeeklyReport.find(query)
      .populate('cithCentreId')
      .populate('submittedBy', '-password')
      .populate('areaApprovedBy', '-password')
      .populate('districtApprovedBy', '-password')
      .populate('rejectedBy', '-password')
      .sort({ week: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await WeeklyReport.countDocuments(query);
    
    res.json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get a single report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id)
      .populate('cithCentreId')
      .populate('submittedBy', '-password')
      .populate('areaApprovedBy', '-password')
      .populate('districtApprovedBy', '-password')
      .populate('rejectedBy', '-password');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has permission to view this report
    if (req.user.role === 'cith_centre') {
      // CITH centre can only view their own reports
      if (report.cithCentreId._id.toString() !== req.user.cithCentreId.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this report' });
      }
    } else if (req.user.role === 'area_supervisor') {
      // Area supervisor can only view reports from their centres
      const centre = await CithCentre.findById(report.cithCentreId._id);
      if (centre.areaSupervisorId.toString() !== req.user.areaSupervisorId.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this report' });
      }
    } else if (req.user.role === 'district_pastor') {
      // District pastor can only view reports from their district
      const centre = await CithCentre.findById(report.cithCentreId._id).populate('areaSupervisorId');
      const area = await AreaSupervisor.findById(centre.areaSupervisorId);
      
      if (area.districtId.toString() !== req.user.districtId.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this report' });
      }
    }
    // Admin can view all reports
    
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve report (area supervisor or district pastor)
// @route   PUT /api/reports/:id/approve
// @access  Private
const approveReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check approval permissions
    if (req.user.role === 'area_supervisor') {
      if (report.status !== 'pending') {
        return res.status(400).json({ message: 'Report is not in pending status' });
      }
      
      // Verify the area supervisor owns this report
      const cithCentre = await CithCentre.findById(report.cithCentreId);
      if (cithCentre.areaSupervisorId.toString() !== req.user.areaSupervisorId.toString()) {
        return res.status(403).json({ message: 'Not authorized to approve this report' });
      }
      
      report.status = 'area_approved';
      report.areaApprovedBy = req.user._id;
      report.areaApprovedAt = new Date();
    } else if (req.user.role === 'district_pastor') {
      if (report.status !== 'area_approved') {
        return res.status(400).json({ message: 'Report is not area approved' });
      }
      
      // Verify the district pastor owns this report
      const cithCentre = await CithCentre.findById(report.cithCentreId).populate('areaSupervisorId');
      const areaSupervisor = await AreaSupervisor.findById(cithCentre.areaSupervisorId);
      
      if (areaSupervisor.districtId.toString() !== req.user.districtId.toString()) {
        return res.status(403).json({ message: 'Not authorized to approve this report' });
      }
      
      report.status = 'district_approved';
      report.districtApprovedBy = req.user._id;
      report.districtApprovedAt = new Date();
    } else {
      return res.status(403).json({ message: 'Not authorized to approve reports' });
    }
    
    await report.save();
    await report.populate('cithCentreId submittedBy areaApprovedBy districtApprovedBy');
    
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reject report
// @route   PUT /api/reports/:id/reject
// @access  Private
const rejectReport = async (req, res) => {
  try {
    const { reason } = req.body;
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check rejection permissions
    if (req.user.role === 'area_supervisor' || req.user.role === 'district_pastor') {
      // Verify ownership (similar to approve logic)
      if (req.user.role === 'area_supervisor' && report.status !== 'pending') {
        return res.status(400).json({ message: 'Report is not in pending status' });
      }
      
      if (req.user.role === 'district_pastor' && report.status !== 'area_approved') {
        return res.status(400).json({ message: 'Report is not area approved' });
      }
      
      report.status = 'rejected';
      report.rejectionReason = reason;
      report.rejectedBy = req.user._id;
      report.rejectedAt = new Date();
      
      await report.save();
      await report.populate('cithCentreId submittedBy rejectedBy');
      
      res.json(report);
    } else {
      return res.status(403).json({ message: 'Not authorized to reject reports' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get aggregated report data
// @route   GET /api/reports/summary
// @access  Private
const getReportSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    
    // Date filter
    if (startDate && endDate) {
      matchQuery.week = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    // Role-based filtering (similar to getReports)
    if (req.user.role === 'cith_centre') {
      matchQuery.cithCentreId = req.user.cithCentreId;
    } else if (req.user.role === 'area_supervisor') {
      const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      matchQuery.cithCentreId = { $in: cithCentreIds };
    } else if (req.user.role === 'district_pastor') {
      const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
      const areaSupervisorIds = areaSupervisors.map(as => as._id);
      const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      matchQuery.cithCentreId = { $in: cithCentreIds };
    }
    
    // Only include approved reports
    matchQuery.status = 'district_approved';
    
    const summary = await WeeklyReport.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalMale: { $sum: '$data.male' },
          totalFemale: { $sum: '$data.female' },
          totalChildren: { $sum: '$data.children' },
          totalOfferings: { $sum: '$data.offerings' },
          totalTestimonies: { $sum: '$data.numberOfTestimonies' },
          totalFirstTimers: { $sum: '$data.numberOfFirstTimers' },
          totalFirstTimersFollowedUp: { $sum: '$data.firstTimersFollowedUp' },
          totalFirstTimersConverted: { $sum: '$data.firstTimersConvertedToCITH' },
          totalReports: { $sum: 1 },
        },
      },
    ]);
    
    res.json(summary[0] || {});
} catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  submitReport,
  getReports,
  getReportById,
  approveReport,
  rejectReport,
  getReportSummary,
};