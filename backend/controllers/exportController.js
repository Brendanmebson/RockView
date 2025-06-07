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
      .populate({
        path: 'cithCentreId',
        select: 'name location',
        populate: {
          path: 'areaSupervisorId',
          select: 'name',
          populate: {
            path: 'districtId',
            select: 'name districtNumber'
          }
        }
      })
      .populate('submittedBy', 'name')
      .sort({ week: -1 });
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Weekly Reports');
    
    // Define columns
    worksheet.columns = [
      { header: 'District', key: 'district', width: 20 },
      { header: 'Area Supervisor', key: 'areaSupervisor', width: 20 },
      { header: 'CITH Centre', key: 'cithCentre', width: 25 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Week', key: 'week', width: 15 },
      { header: 'Event Type', key: 'eventType', width: 20 },
      { header: 'Event Description', key: 'eventDescription', width: 25 },
      { header: 'Male', key: 'male', width: 10 },
      { header: 'Female', key: 'female', width: 10 },
      { header: 'Children', key: 'children', width: 10 },
      { header: 'Total Attendance', key: 'totalAttendance', width: 15 },
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
      const centre = report.cithCentreId || {};
      const area = centre.areaSupervisorId || {};
      const district = area.districtId || {};
      
      worksheet.addRow({
        district: district.name || 'Unknown District',
        areaSupervisor: area.name || 'Unknown Area',
        cithCentre: centre.name || 'Unknown Centre',
        location: centre.location || 'Unknown Location',
        week: report.week ? report.week.toISOString().split('T')[0] : 'Unknown Date',
        eventType: report.eventType ? report.eventType.replace('_', ' ').toUpperCase() : 'REGULAR SERVICE',
        eventDescription: report.eventDescription || '',
        male: report.data?.male || 0,
        female: report.data?.female || 0,
        children: report.data?.children || 0,
        totalAttendance: (report.data?.male || 0) + (report.data?.female || 0) + (report.data?.children || 0),
        offerings: report.data?.offerings || 0,
        testimonies: report.data?.numberOfTestimonies || 0,
        firstTimers: report.data?.numberOfFirstTimers || 0,
        firstTimersFollowedUp: report.data?.firstTimersFollowedUp || 0,
        firstTimersConverted: report.data?.firstTimersConvertedToCITH || 0,
        modeOfMeeting: report.data?.modeOfMeeting || 'physical',
        remarks: report.data?.remarks || '',
        submittedBy: report.submittedBy?.name || 'Unknown User',
        status: report.status || 'unknown',
      });
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
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
    console.error('Export error:', error);
    res.status(400).json({ message: error.message || 'Export failed' });
  }
};

module.exports = {
  exportToExcel,
};