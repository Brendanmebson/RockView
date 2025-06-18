// backend/controllers/reportController.js
const WeeklyReport = require('../models/WeeklyReport');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');
const District = require('../models/District');
const User = require('../models/User');

// Helper function to safely populate report data
const getReportPopulationQuery = () => {
  return [
    {
      path: 'cithCentreId',
      select: 'name location leaderName contactEmail contactPhone',
      populate: {
        path: 'areaSupervisorId',
        select: 'name supervisorName contactEmail contactPhone',
        populate: {
          path: 'districtId',
          select: 'name districtNumber pastorName description'
        }
      }
    },
    {
      path: 'submittedBy',
      select: 'name email role'
    },
    {
      path: 'areaApprovedBy',
      select: 'name email role'
    },
    {
      path: 'districtApprovedBy',
      select: 'name email role'
    },
    {
      path: 'rejectedBy',
      select: 'name email role'
    }
  ];
};

// Helper function to validate and sanitize report data
const sanitizeReportData = (reports) => {
  return reports.map(report => {
    const sanitized = {
      ...report.toObject(),
      cithCentreId: report.cithCentreId || {
        _id: '',
        name: 'Unknown Centre',
        location: 'Unknown Location',
        leaderName: 'Unknown Leader'
      },
      data: {
        male: report.data?.male || 0,
        female: report.data?.female || 0,
        children: report.data?.children || 0,
        offerings: report.data?.offerings || 0,
        numberOfTestimonies: report.data?.numberOfTestimonies || 0,
        numberOfFirstTimers: report.data?.numberOfFirstTimers || 0,
        firstTimersFollowedUp: report.data?.firstTimersFollowedUp || 0,
        firstTimersConvertedToCITH: report.data?.firstTimersConvertedToCITH || 0,
        modeOfMeeting: report.data?.modeOfMeeting || 'physical',
        remarks: report.data?.remarks || ''
      },
      submittedBy: report.submittedBy || {
        _id: '',
        name: 'Unknown User',
        email: 'unknown@example.com'
      },
      eventType: report.eventType || 'regular_service',
      eventDescription: report.eventDescription || ''
    };

    // Ensure cithCentreId is properly structured
    if (typeof sanitized.cithCentreId === 'string') {
      sanitized.cithCentreId = {
        _id: sanitized.cithCentreId,
        name: 'Centre ID: ' + sanitized.cithCentreId,
        location: 'Unknown Location',
        leaderName: 'Unknown Leader'
      };
    }

    return sanitized;
  });
};

// @desc    Submit weekly report
// @route   POST /api/reports
// @access  Private (CITH centre only)
const submitReport = async (req, res) => {
  try {
    const { week, data, eventType, eventDescription } = req.body;
    
    // Validate that the user has access to submit for this centre
    if (req.user.role !== 'cith_centre') {
      return res.status(403).json({ message: 'Only CITH centres can submit reports' });
    }
    
    // Set the CITH centre ID from user's association
    const cithCentreId = req.user.cithCentreId;
    
    if (!cithCentreId) {
      return res.status(400).json({ message: 'User not associated with any CITH centre' });
    }
    
    // Validate the week format (should be start of week)
    const weekStart = new Date(week);
    weekStart.setHours(0, 0, 0, 0);
    
    // Check if report for this week and event type already exists
    const existingReport = await WeeklyReport.findOne({
      cithCentreId,
      week: weekStart,
      eventType: eventType || 'regular_service',
    });
    
    if (existingReport) {
      return res.status(400).json({ 
        message: `Report for this week and event type (${eventType || 'regular_service'}) already exists` 
      });
    }    
    // Validate report data
    const reportData = {
      male: parseInt(data.male) || 0,
      female: parseInt(data.female) || 0,
      children: parseInt(data.children) || 0,
      offerings: parseFloat(data.offerings) || 0,
      numberOfTestimonies: parseInt(data.numberOfTestimonies) || 0,
      numberOfFirstTimers: parseInt(data.numberOfFirstTimers) || 0,
      firstTimersFollowedUp: parseInt(data.firstTimersFollowedUp) || 0,
      firstTimersConvertedToCITH: parseInt(data.firstTimersConvertedToCITH) || 0,
      modeOfMeeting: data.modeOfMeeting || 'physical',
      remarks: data.remarks || ''
    };
    
    // Create the report
    const report = await WeeklyReport.create({
      cithCentreId,
      week: weekStart,
      eventType: eventType || 'regular_service',
      eventDescription: eventDescription || '',
      data: reportData,
      submittedBy: req.user._id,
    });
    
    // Populate the created report
    const populatedReport = await WeeklyReport.findById(report._id)
      .populate(getReportPopulationQuery());
    
    res.status(201).json(populatedReport);
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get reports based on user role
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    let query = {};
    const { 
      page = 1, 
      limit = 10, 
      status, 
      week, 
      startDate, 
      endDate, 
      cithCentreId, 
      areaSupervisorId 
    } = req.query;
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by week if provided
    if (week) {
      const weekDate = new Date(week);
      if (!isNaN(weekDate.getTime())) {
        query.week = weekDate;
      }
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        query.week = {
          $gte: start,
          $lte: end,
        };
      }
    }
    
    // Filter by specific centre
    if (cithCentreId) {
      query.cithCentreId = cithCentreId;
    }
    
    // Filter by area supervisor
    if (areaSupervisorId) {
      try {
        const cithCentres = await CithCentre.find({ areaSupervisorId });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        query.cithCentreId = { $in: cithCentreIds };
      } catch (error) {
        console.error('Error filtering by area supervisor:', error);
      }
    }
    
    // Role-based filtering
    try {
      if (req.user.role === 'cith_centre') {
        if (!req.user.cithCentreId) {
          return res.status(400).json({ message: 'User not associated with any CITH centre' });
        }
        query.cithCentreId = req.user.cithCentreId;
      } else if (req.user.role === 'area_supervisor') {
        if (!req.user.areaSupervisorId) {
          return res.status(400).json({ message: 'User not associated with any area' });
        }
        // Get all CITH centres under this area supervisor
        const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        query.cithCentreId = { $in: cithCentreIds };
      } else if (req.user.role === 'district_pastor') {
        if (!req.user.districtId) {
          return res.status(400).json({ message: 'User not associated with any district' });
        }
        // Get all area supervisors in this district
        const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
        const areaSupervisorIds = areaSupervisors.map(as => as._id);
        
        // Get all CITH centres under these area supervisors
        const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        query.cithCentreId = { $in: cithCentreIds };
      }
      // Admin can see all reports - no additional filtering needed
    } catch (error) {
      console.error('Error applying role-based filtering:', error);
      return res.status(500).json({ message: 'Error filtering reports by user role' });
    }
    
    try {
      // Get total count for pagination
      const count = await WeeklyReport.countDocuments(query);
      
      // Fetch reports with population
      const reports = await WeeklyReport.find(query)
        .populate(getReportPopulationQuery())
        .sort({ week: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      
      // Sanitize the reports data
      const sanitizedReports = sanitizeReportData(reports);
      
      res.json({
        reports: sanitizedReports,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        total: count,
      });
    } catch (error) {
      console.error('Error fetching reports from database:', error);
      res.status(500).json({ message: 'Error fetching reports from database' });
    }
  } catch (error) {
    console.error('Error in getReports:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get a single report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id)
      .populate(getReportPopulationQuery());
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has permission to view this report
    const hasPermission = await checkReportPermission(req.user, report);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }
    
    // Sanitize the report data
    const sanitizedReport = sanitizeReportData([report])[0];
    
    res.json(sanitizedReport);
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get report for editing
// @route   GET /api/reports/:id/edit
// @access  Private
const getReportForEdit = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id)
      .populate(getReportPopulationQuery());
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
   // Check if user can edit this report
    if (req.user.role === 'admin') {
      // Admin can edit any report
    } else if (req.user.role === 'cith_centre') {
      // CITH centre can only edit their own reports
      if (report.submittedBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'You can only edit your own reports' 
        });
      }
      // Only allow editing of pending or rejected reports for CITH centre
      if (report.status !== 'pending' && report.status !== 'rejected') {
        return res.status(403).json({ 
          message: 'You can only edit pending or rejected reports' 
        });
      }
    } else {
      return res.status(403).json({ 
        message: 'Not authorized to edit this report' 
      });
    }
    
    // Sanitize the report data
    const sanitizedReport = sanitizeReportData([report])[0];
    
    res.json(sanitizedReport);
  } catch (error) {
    console.error('Error fetching report for edit:', error);
    res.status(400).json({ message: error.message });
  }
};

// Helper function to check report permissions
const checkReportPermission = async (user, report) => {
  try {
    if (user.role === 'admin') {
      return true;
    }
    
    if (user.role === 'cith_centre') {
      // CITH centre can only view their own reports
      return report.cithCentreId._id.toString() === user.cithCentreId.toString();
    }
    
    if (user.role === 'area_supervisor') {
      // Area supervisor can only view reports from their centres
      const centre = await CithCentre.findById(report.cithCentreId._id);
      if (!centre) return false;
      return centre.areaSupervisorId.toString() === user.areaSupervisorId.toString();
    }
    
    if (user.role === 'district_pastor') {
      // District pastor can only view reports from their district
      const centre = await CithCentre.findById(report.cithCentreId._id).populate('areaSupervisorId');
      if (!centre || !centre.areaSupervisorId) return false;
      
      const area = await AreaSupervisor.findById(centre.areaSupervisorId._id);
      if (!area) return false;
      
      return area.districtId.toString() === user.districtId.toString();
    }
    
    return false;
  } catch (error) {
    console.error('Error checking report permission:', error);
    return false;
  }
};

// @desc    Approve report (area supervisor, zonal supervisor, district pastor, or admin)
// @route   PUT /api/reports/:id/approve
// @access  Private
const approveReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Admin can approve at any level
    if (req.user.role === 'admin') {
      const { approvalLevel } = req.body; // 'area', 'zonal', or 'district'
      
      if (approvalLevel === 'district' || report.status === 'zonal_approved') {
        report.status = 'district_approved';
        report.districtApprovedBy = req.user._id;
        report.districtApprovedAt = new Date();
      } else if (approvalLevel === 'zonal' || report.status === 'area_approved') {
        report.status = 'zonal_approved';
        report.zonalApprovedBy = req.user._id;
        report.zonalApprovedAt = new Date();
      } else {
        report.status = 'area_approved';
        report.areaApprovedBy = req.user._id;
        report.areaApprovedAt = new Date();
      }
    }
    // Area supervisor approval
    else if (req.user.role === 'area_supervisor') {
      if (report.status !== 'pending') {
        return res.status(400).json({ message: 'Report is not in pending status' });
      }
      
      // Verify the area supervisor owns this report
      const cithCentre = await CithCentre.findById(report.cithCentreId);
      if (!cithCentre) {
        return res.status(404).json({ message: 'CITH centre not found' });
      }
      
      if (cithCentre.areaSupervisorId.toString() !== req.user.areaSupervisorId.toString()) {
        return res.status(403).json({ message: 'Not authorized to approve this report' });
      }
      
      report.status = 'area_approved';
      report.areaApprovedBy = req.user._id;
      report.areaApprovedAt = new Date();
      
    }
    // Zonal supervisor approval
    else if (req.user.role === 'zonal_supervisor') {
      if (report.status !== 'area_approved') {
        return res.status(400).json({ message: 'Report must be area approved first' });
      }
      
      // Verify the zonal supervisor owns this report
      const cithCentre = await CithCentre.findById(report.cithCentreId).populate('areaSupervisorId');
      if (!cithCentre || !cithCentre.areaSupervisorId) {
        return res.status(404).json({ message: 'CITH centre or area supervisor not found' });
      }
      
      const ZonalSupervisor = require('../models/ZonalSupervisor');
      const zonalSupervisor = await ZonalSupervisor.findOne({
        _id: req.user.zonalSupervisorId,
        areaSupervisorIds: cithCentre.areaSupervisorId._id
      });
      
      if (!zonalSupervisor) {
        return res.status(403).json({ message: 'Not authorized to approve this report' });
      }
      
      report.status = 'zonal_approved';
      report.zonalApprovedBy = req.user._id;
      report.zonalApprovedAt = new Date();
      
    }
    // District pastor approval
    else if (req.user.role === 'district_pastor') {
      if (report.status !== 'zonal_approved') {
        return res.status(400).json({ message: 'Report must be zonal approved first' });
      }
      
      // Verify the district pastor owns this report
      const cithCentre = await CithCentre.findById(report.cithCentreId).populate('areaSupervisorId');
      if (!cithCentre || !cithCentre.areaSupervisorId) {
        return res.status(404).json({ message: 'CITH centre or area supervisor not found' });
      }
      
      const AreaSupervisor = require('../models/AreaSupervisor');
      const areaSupervisor = await AreaSupervisor.findById(cithCentre.areaSupervisorId._id);
      if (!areaSupervisor) {
        return res.status(404).json({ message: 'Area supervisor not found' });
      }
      
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
    
    // Return populated report
   const populatedReport = await WeeklyReport.findById(report._id)
      .populate(getReportPopulationQuery());
    
    const sanitizedReport = sanitizeReportData([populatedReport])[0];
    
    res.json(sanitizedReport);
  } catch (error) {
    console.error('Error approving report:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Admin comprehensive edit report
// @route   PUT /api/reports/:id/admin-edit
// @access  Private (admin only)
const adminComprehensiveEdit = async (req, res) => {
  try {
    const { 
      data, 
      eventType, 
      eventDescription, 
      targetApprovalLevel, // 'pending', 'area', 'zonal', 'district'
      resetApprovals 
    } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can use this function' });
    }
    
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update report data if provided
    if (data) {
      const reportData = {
        male: parseInt(data.male) || 0,
        female: parseInt(data.female) || 0,
        children: parseInt(data.children) || 0,
        offerings: parseFloat(data.offerings) || 0,
        numberOfTestimonies: parseInt(data.numberOfTestimonies) || 0,
        numberOfFirstTimers: parseInt(data.numberOfFirstTimers) || 0,
        firstTimersFollowedUp: parseInt(data.firstTimersFollowedUp) || 0,
        firstTimersConvertedToCITH: parseInt(data.firstTimersConvertedToCITH) || 0,
        modeOfMeeting: data.modeOfMeeting || 'physical',
        remarks: data.remarks || ''
      };
      report.data = reportData;
    }
    
    // Update event info if provided
    if (eventType) report.eventType = eventType;
    if (eventDescription !== undefined) report.eventDescription = eventDescription;
    
    // Reset approvals if requested
    if (resetApprovals) {
      report.areaApprovedBy = undefined;
      report.areaApprovedAt = undefined;
      report.zonalApprovedBy = undefined;
      report.zonalApprovedAt = undefined;
      report.districtApprovedBy = undefined;
      report.districtApprovedAt = undefined;
      report.rejectedBy = undefined;
      report.rejectedAt = undefined;
      report.rejectionReason = undefined;
    }
    
    // Set target approval level
    if (targetApprovalLevel === 'pending') {
      report.status = 'pending';
    } else if (targetApprovalLevel === 'area') {
      report.status = 'area_approved';
      report.areaApprovedBy = req.user._id;
      report.areaApprovedAt = new Date();
    } else if (targetApprovalLevel === 'zonal') {
      report.status = 'zonal_approved';
      report.areaApprovedBy = req.user._id;
      report.areaApprovedAt = new Date();
      report.zonalApprovedBy = req.user._id;
      report.zonalApprovedAt = new Date();
    } else if (targetApprovalLevel === 'district') {
      report.status = 'district_approved';
      report.areaApprovedBy = req.user._id;
      report.areaApprovedAt = new Date();
      report.zonalApprovedBy = req.user._id;
      report.zonalApprovedAt = new Date();
      report.districtApprovedBy = req.user._id;
      report.districtApprovedAt = new Date();
    }
    
    report.updatedAt = new Date();
    await report.save();
    
    // Return populated updated report
    const populatedReport = await WeeklyReport.findById(report._id)
      .populate(getReportPopulationQuery());
    
    const sanitizedReport = sanitizeReportData([populatedReport])[0];
    
    res.json(sanitizedReport);
  } catch (error) {
    console.error('Error in admin comprehensive edit:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reject report (area supervisor, district pastor, or admin)
// @route   PUT /api/reports/:id/reject
// @access  Private
const rejectReport = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Admin can reject at any level
    if (req.user.role === 'admin') {
      // Admin can reject any report
    }
    // Check rejection permissions for other roles
    else if (req.user.role === 'area_supervisor') {
      if (report.status !== 'pending') {
        return res.status(400).json({ message: 'Report is not in pending status' });
      }
      
      // Verify ownership
      const cithCentre = await CithCentre.findById(report.cithCentreId);
      if (!cithCentre) {
        return res.status(404).json({ message: 'CITH centre not found' });
      }
      
      if (cithCentre.areaSupervisorId.toString() !== req.user.areaSupervisorId.toString()) {
        return res.status(403).json({ message: 'Not authorized to reject this report' });
      }
      
    } else if (req.user.role === 'district_pastor') {
      if (report.status !== 'area_approved') {
        return res.status(400).json({ message: 'Report is not area approved' });
      }
      
      // Verify ownership
      const cithCentre = await CithCentre.findById(report.cithCentreId).populate('areaSupervisorId');
      if (!cithCentre || !cithCentre.areaSupervisorId) {
        return res.status(404).json({ message: 'CITH centre or area supervisor not found' });
      }
      
      const areaSupervisor = await AreaSupervisor.findById(cithCentre.areaSupervisorId._id);
      if (!areaSupervisor) {
        return res.status(404).json({ message: 'Area supervisor not found' });
      }
      
      if (areaSupervisor.districtId.toString() !== req.user.districtId.toString()) {
        return res.status(403).json({ message: 'Not authorized to reject this report' });
      }
      
    } else {
      return res.status(403).json({ message: 'Not authorized to reject reports' });
    }
    
    report.status = 'rejected';
    report.rejectionReason = reason.trim();
    report.rejectedBy = req.user._id;
    report.rejectedAt = new Date();
    
    await report.save();
    
    // Return populated report
    const populatedReport = await WeeklyReport.findById(report._id)
      .populate(getReportPopulationQuery());
    
    const sanitizedReport = sanitizeReportData([populatedReport])[0];
    
    res.json(sanitizedReport);
  } catch (error) {
    console.error('Error rejecting report:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check permissions
    if (req.user.role === 'admin') {
      // Admin can delete any report
    } else if (req.user.role === 'cith_centre') {
      // CITH centre can only delete their own reports if pending or rejected
      if (report.submittedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own reports' });
      }
      if (report.status !== 'pending' && report.status !== 'rejected') {
        return res.status(400).json({ message: 'You can only delete pending or rejected reports' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to delete reports' });
    }
    
    await WeeklyReport.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
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
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        matchQuery.week = {
          $gte: start,
          $lte: end,
        };
      }
    }
    
    // Role-based filtering (similar to getReports)
    try {
      if (req.user.role === 'cith_centre') {
        if (!req.user.cithCentreId) {
          return res.status(400).json({ message: 'User not associated with any CITH centre' });
        }
        matchQuery.cithCentreId = req.user.cithCentreId;
      } else if (req.user.role === 'area_supervisor') {
        if (!req.user.areaSupervisorId) {
          return res.status(400).json({ message: 'User not associated with any area' });
        }
        const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        matchQuery.cithCentreId = { $in: cithCentreIds };
      } else if (req.user.role === 'district_pastor') {
        if (!req.user.districtId) {
          return res.status(400).json({ message: 'User not associated with any district' });
        }
        const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
        const areaSupervisorIds = areaSupervisors.map(as => as._id);
        const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        matchQuery.cithCentreId = { $in: cithCentreIds };
      }
      // Admin can see all reports - no additional filtering needed
    } catch (error) {
      console.error('Error applying role-based filtering for summary:', error);
      return res.status(500).json({ message: 'Error filtering reports for summary' });
    }
    
    // Only include approved reports for summary
    matchQuery.status = 'district_approved';
    
    try {
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
      
      // Return default values if no data found
      const defaultSummary = {
        totalMale: 0,
        totalFemale: 0,
        totalChildren: 0,
        totalOfferings: 0,
        totalTestimonies: 0,
        totalFirstTimers: 0,
        totalFirstTimersFollowedUp: 0,
        totalFirstTimersConverted: 0,
        totalReports: 0,
      };
      
      res.json(summary[0] || defaultSummary);
    } catch (error) {
      console.error('Error aggregating report summary:', error);
      res.status(500).json({ message: 'Error generating report summary' });
    }
  } catch (error) {
    console.error('Error in getReportSummary:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update report (only for pending reports by original submitter)
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Only original submitter can update, and only if still pending
    if (report.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the original submitter can update this report' });
    }
    
    if (report.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update report that has been reviewed' });
    }
    
    const { data, eventType, eventDescription } = req.body;
    
    // Validate and sanitize update data
    const updateData = {
      male: parseInt(data.male) || 0,
      female: parseInt(data.female) || 0,
      children: parseInt(data.children) || 0,
      offerings: parseFloat(data.offerings) || 0,
      numberOfTestimonies: parseInt(data.numberOfTestimonies) || 0,
      numberOfFirstTimers: parseInt(data.numberOfFirstTimers) || 0,
      firstTimersFollowedUp: parseInt(data.firstTimersFollowedUp) || 0,
      firstTimersConvertedToCITH: parseInt(data.firstTimersConvertedToCITH) || 0,
      modeOfMeeting: data.modeOfMeeting || 'physical',
      remarks: data.remarks || ''
    };
    
    // Update the report
    report.data = updateData;
    report.eventType = eventType || 'regular_service';
    report.eventDescription = eventDescription || '';
    report.updatedAt = new Date();
    
    await report.save();
    
    // Return populated updated report
    const populatedReport = await WeeklyReport.findById(report._id)
      .populate(getReportPopulationQuery());
    
    const sanitizedReport = sanitizeReportData([populatedReport])[0];
    
    res.json(sanitizedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get reports statistics for dashboard
// @route   GET /api/reports/stats
// @access  Private
const getReportStats = async (req, res) => {
  try {
    let matchQuery = {};
    
    // Apply role-based filtering
    try {
      if (req.user.role === 'cith_centre') {
        if (!req.user.cithCentreId) {
          return res.status(400).json({ message: 'User not associated with any CITH centre' });
        }
        matchQuery.cithCentreId = req.user.cithCentreId;
      } else if (req.user.role === 'area_supervisor') {
        if (!req.user.areaSupervisorId) {
          return res.status(400).json({ message: 'User not associated with any area' });
        }
        const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        matchQuery.cithCentreId = { $in: cithCentreIds };
      } else if (req.user.role === 'district_pastor') {
        if (!req.user.districtId) {
          return res.status(400).json({ message: 'User not associated with any district' });
        }
        const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
        const areaSupervisorIds = areaSupervisors.map(as => as._id);
        const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        matchQuery.cithCentreId = { $in: cithCentreIds };
      }
    } catch (error) {
      console.error('Error applying role-based filtering for stats:', error);
      return res.status(500).json({ message: 'Error filtering reports for statistics' });
    }
    
    try {
      const stats = await WeeklyReport.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Format stats response
      const formattedStats = {
        total: 0,
        pending: 0,
        area_approved: 0,
        district_approved: 0,
        rejected: 0
      };
      
      stats.forEach(stat => {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
      });
      
      res.json(formattedStats);
    } catch (error) {
      console.error('Error generating report statistics:', error);
      res.status(500).json({ message: 'Error generating report statistics' });
    }
  } catch (error) {
    console.error('Error in getReportStats:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get recent reports for dashboard
// @route   GET /api/reports/recent
// @access  Private
const getRecentReports = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    let query = {};
    
    // Apply role-based filtering
    try {
      if (req.user.role === 'cith_centre') {
        if (!req.user.cithCentreId) {
          return res.status(400).json({ message: 'User not associated with any CITH centre' });
        }
        query.cithCentreId = req.user.cithCentreId;
      } else if (req.user.role === 'area_supervisor') {
        if (!req.user.areaSupervisorId) {
          return res.status(400).json({ message: 'User not associated with any area' });
        }
        const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        query.cithCentreId = { $in: cithCentreIds };
      } else if (req.user.role === 'district_pastor') {
        if (!req.user.districtId) {
          return res.status(400).json({ message: 'User not associated with any district' });
        }
        const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
        const areaSupervisorIds = areaSupervisors.map(as => as._id);
        const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        query.cithCentreId = { $in: cithCentreIds };
      }
    } catch (error) {
      console.error('Error applying role-based filtering for recent reports:', error);
      return res.status(500).json({ message: 'Error filtering recent reports' });
    }
    
    try {
      const reports = await WeeklyReport.find(query)
        .populate([
          {
            path: 'cithCentreId',
            select: 'name location'
          },
          {
            path: 'submittedBy',
            select: 'name'
          }
        ])
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      
      const sanitizedReports = sanitizeReportData(reports);
      
      res.json(sanitizedReports);
    } catch (error) {
      console.error('Error fetching recent reports:', error);
      res.status(500).json({ message: 'Error fetching recent reports' });
    }
  } catch (error) {
    console.error('Error in getRecentReports:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Admin edit report (change status and approve)
// @route   PUT /api/reports/:id/admin-edit
// @access  Private (admin only)
const adminEditReport = async (req, res) => {
  try {
    const { data, eventType, eventDescription, status, approvalLevel } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can use this function' });
    }
    
    const report = await WeeklyReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update report data if provided
    if (data) {
      const reportData = {
        male: parseInt(data.male) || 0,
        female: parseInt(data.female) || 0,
        children: parseInt(data.children) || 0,
        offerings: parseFloat(data.offerings) || 0,
        numberOfTestimonies: parseInt(data.numberOfTestimonies) || 0,
        numberOfFirstTimers: parseInt(data.numberOfFirstTimers) || 0,
        firstTimersFollowedUp: parseInt(data.firstTimersFollowedUp) || 0,
        firstTimersConvertedToCITH: parseInt(data.firstTimersConvertedToCITH) || 0,
        modeOfMeeting: data.modeOfMeeting || 'physical',
        remarks: data.remarks || ''
      };
      report.data = reportData;
    }
    
    // Update event info if provided
    if (eventType) report.eventType = eventType;
    if (eventDescription !== undefined) report.eventDescription = eventDescription;
    
    // Update status and approval if provided
    if (status && approvalLevel) {
      report.status = status;
      
      if (approvalLevel === 'area') {
        report.areaApprovedBy = req.user._id;
        report.areaApprovedAt = new Date();
      } else if (approvalLevel === 'zonal') {
        report.zonalApprovedBy = req.user._id;
        report.zonalApprovedAt = new Date();
      } else if (approvalLevel === 'district') {
        report.districtApprovedBy = req.user._id;
        report.districtApprovedAt = new Date();
      }
    }
    
    report.updatedAt = new Date();
    await report.save();
    
    // Return populated updated report
    const populatedReport = await WeeklyReport.findById(report._id)
      .populate(getReportPopulationQuery());
    
    const sanitizedReport = sanitizeReportData([populatedReport])[0];
    
    res.json(sanitizedReport);
  } catch (error) {
    console.error('Error in admin edit report:', error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  submitReport,
  getReports,
  getReportById,
  getReportForEdit,
  approveReport,
  rejectReport,
  getReportSummary,
  deleteReport,
  updateReport,
  getReportStats,
  getRecentReports,
  adminEditReport,
  adminComprehensiveEdit,
};