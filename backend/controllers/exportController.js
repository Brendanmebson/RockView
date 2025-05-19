const ExcelJS = require('exceljs');
const WeeklyReport = require('../models/WeeklyReport');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');

// @desc    Export reports to Excel
// @route   GET /api/export/excel
// @access  Private
const exportToExcel = async (req, res) => {
  try {
    const { startDate, endDate, format = 'xlsx' } = req.query;
    
    let query = {};
    
    // Date filter
    if (startDate && endDate) {
      query.week = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    // Role-based filtering
    if (req.user.role === 'cith_centre') {
      query.cithCentreId = req.user.cithCentreId;
    } else if (req.user.role === 'area_supervisor') {
      const cithCentres = await CithCentre.find({ areaSupervisorId: req.user.areaSupervisorId });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      query.cithCentreId = { $in: cithCentreIds };
    } else if (req.user.role === 'district_pastor') {
      const areaSupervisors = await AreaSupervisor.find({ districtId: req.user.districtId });
      const areaSupervisorIds = areaSupervisors.map(as => as._id);
      const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      query.cithCentreId = { $in: cithCentreIds };
    }
    
    // Only include approved reports
    query.status = 'district_approved';
    
    const reports = await WeeklyReport.find(query)
      .populate('cithCentreId')
      .populate('submittedBy', 'name')
      .sort({ week: -1 });
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Weekly Reports');
    
    // Define columns
    worksheet.columns = [
      { header: 'CITH Centre', key: 'cithCentre', width: 20 },
      { header: 'Week', key: 'week', width: 15 },
      { header: 'Male', key: 'male', width: 10 },
      { header: 'Female', key: 'female', width: 10 },
      { header: 'Children', key: 'children', width: 10 },
      { header: 'Offerings', key: 'offerings', width: 15 },
      { header: 'Testimonies', key: 'testimonies', width: 15 },
      { header: 'First Timers', key: 'firstTimers', width: 15 },
      { header: 'First Timers Followed Up', key: 'firstTimersFollowedUp', width: 20 },
      { header: 'First Timers Converted', key: 'firstTimersConverted', width: 20 },
      { header: 'Mode of Meeting', key: 'modeOfMeeting', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
      { header: 'Submitted By', key: 'submittedBy', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    
    // Add data
    reports.forEach(report => {
      worksheet.addRow({
        cithCentre: report.cithCentreId.name,
        week: report.week.toISOString().split('T')[0],
        male: report.data.male,
        female: report.data.female,
        children: report.data.children,
        offerings: report.data.offerings,
        testimonies: report.data.numberOfTestimonies,
        firstTimers: report.data.numberOfFirstTimers,
        firstTimersFollowedUp: report.data.firstTimersFollowedUp,
        firstTimersConverted: report.data.firstTimersConvertedToCITH,
        modeOfMeeting: report.data.modeOfMeeting,
        remarks: report.data.remarks,
        submittedBy: report.submittedBy.name,
        status: report.status,
      });
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=weekly-reports-${new Date().toISOString().split('T')[0]}.xlsx`
    );
    
    // Send the file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  exportToExcel,
};