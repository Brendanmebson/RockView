const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const WeeklyReport = require('../models/WeeklyReport');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');
const ZonalSupervisor = require('../models/ZonalSupervisor');

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
    } else if (req.user.role === 'zonal_supervisor') {
      const zonalSupervisor = await ZonalSupervisor.findById(req.user.zonalSupervisorId);
      if (zonalSupervisor) {
        const cithCentres = await CithCentre.find({ 
          areaSupervisorId: { $in: zonalSupervisor.areaSupervisorIds } 
        });
        const cithCentreIds = cithCentres.map(cc => cc._id);
        query.cithCentreId = { $in: cithCentreIds };
      }
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
      .populate('areaApprovedBy', 'name')
      .populate('zonalApprovedBy', 'name')
      .populate('districtApprovedBy', 'name')
      .sort({ week: -1 });
    
    if (reports.length === 0) {
      return res.status(404).json({ message: 'No reports found for export' });
    }
    
    // Create workbook
     const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Weekly Reports');
    
    // Define columns with proper headers
    const columns = [
      { header: 'DISTRICT', key: 'district', width: 20 },
      { header: 'AREA SUPERVISOR', key: 'areaSupervisor', width: 20 },
      { header: 'CITH CENTRE', key: 'cithCentre', width: 25 },
      { header: 'LOCATION', key: 'location', width: 20 },
      { header: 'WEEK', key: 'week', width: 15 },
      { header: 'EVENT TYPE', key: 'eventType', width: 20 },
      { header: 'EVENT DESCRIPTION', key: 'eventDescription', width: 25 },
      { header: 'MALE', key: 'male', width: 10 },
      { header: 'FEMALE', key: 'female', width: 10 },
      { header: 'CHILDREN', key: 'children', width: 10 },
      { header: 'TOTAL ATTENDANCE', key: 'totalAttendance', width: 15 },
      { header: 'OFFERINGS (₦)', key: 'offerings', width: 15 },
      { header: 'TESTIMONIES', key: 'testimonies', width: 15 },
      { header: 'FIRST TIMERS', key: 'firstTimers', width: 15 },
      { header: 'FIRST TIMERS FOLLOWED UP', key: 'firstTimersFollowedUp', width: 20 },
      { header: 'FIRST TIMERS CONVERTED', key: 'firstTimersConverted', width: 20 },
      { header: 'MODE OF MEETING', key: 'modeOfMeeting', width: 15 },
      { header: 'REMARKS', key: 'remarks', width: 30 },
      { header: 'SUBMITTED BY', key: 'submittedBy', width: 15 },
      { header: 'AREA APPROVED BY', key: 'areaApprovedBy', width: 15 },
      { header: 'ZONAL APPROVED BY', key: 'zonalApprovedBy', width: 15 },
      { header: 'DISTRICT APPROVED BY', key: 'districtApprovedBy', width: 15 },
      { header: 'STATUS', key: 'status', width: 15 },
    ];
    
    worksheet.columns = columns;
    
    // Style the header row with Excel-like formatting
    const headerRow = worksheet.getRow(1);
    headerRow.font = { 
      bold: true, 
      color: { argb: 'FFFFFFFF' },
      size: 11,
      name: 'Calibri'
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' } // Dark blue background
    };
    headerRow.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: true 
    };
    headerRow.height = 25;
    
    // Add data with proper formatting
    reports.forEach((report, index) => {
      const centre = report.cithCentreId || {};
      const area = centre.areaSupervisorId || {};
      const district = area.districtId || {};
      
      const rowData = {
        district: district.name || 'Unknown District',
        areaSupervisor: area.name || 'Unknown Area',
        cithCentre: centre.name || 'Unknown Centre',
        location: centre.location || 'Unknown Location',
        week: report.week ? report.week.toISOString().split('T')[0] : 'Unknown Date',
        eventType: report.eventType ? report.eventType.replace(/_/g, ' ').toUpperCase() : 'REGULAR SERVICE',
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
        modeOfMeeting: (report.data?.modeOfMeeting || 'physical').toUpperCase(),
        remarks: report.data?.remarks || '',
        submittedBy: report.submittedBy?.name || 'Unknown User',
        areaApprovedBy: report.areaApprovedBy?.name || '',
        zonalApprovedBy: report.zonalApprovedBy?.name || '',
        districtApprovedBy: report.districtApprovedBy?.name || '',
        status: (report.status || 'unknown').replace(/_/g, ' ').toUpperCase(),
      };
      
      const dataRow = worksheet.addRow(rowData);
      
      // Style data rows
      dataRow.font = { name: 'Calibri', size: 10 };
      dataRow.alignment = { vertical: 'middle', wrapText: true };
      
      // Alternate row colors
      if (index % 2 === 1) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' } // Light gray for alternating rows
        };
      }
    });
    
    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.width < 10) column.width = 10;
      if (column.width > 50) column.width = 50;
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

// @desc    Export single report to Excel or PDF
// @route   GET /api/export/report/:id
// @access  Private
const exportSingleReport = async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    const reportId = req.params.id;
    
    const report = await WeeklyReport.findById(reportId)
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
      .populate('submittedBy', 'name email')
      .populate('areaApprovedBy', 'name email')
      .populate('zonalApprovedBy', 'name email')
      .populate('districtApprovedBy', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      const filename = `report-${report._id}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      doc.pipe(res);
      
      // PDF Content
      doc.fontSize(20).text('Weekly Report', { align: 'center' });
      doc.moveDown();
      
      // Report Details
      const centre = report.cithCentreId || {};
      const area = centre.areaSupervisorId || {};
      const district = area.districtId || {};
      
      doc.fontSize(14);
      doc.text(`District: ${district.name || 'Unknown District'}`);
      doc.text(`Area: ${area.name || 'Unknown Area'}`);
      doc.text(`CITH Centre: ${centre.name || 'Unknown Centre'}`);
      doc.text(`Location: ${centre.location || 'Unknown Location'}`);
      doc.text(`Week: ${report.week ? report.week.toDateString() : 'Unknown Date'}`);
      doc.text(`Event Type: ${report.eventType || 'regular_service'}`);
      if (report.eventDescription) {
        doc.text(`Event Description: ${report.eventDescription}`);
      }
      doc.moveDown();
      
      // Attendance Data
      doc.text('ATTENDANCE DATA', { underline: true });
      doc.text(`Male: ${report.data?.male || 0}`);
      doc.text(`Female: ${report.data?.female || 0}`);
      doc.text(`Children: ${report.data?.children || 0}`);
      doc.text(`Total: ${(report.data?.male || 0) + (report.data?.female || 0) + (report.data?.children || 0)}`);
      doc.moveDown();
      
      // Other Data
      doc.text('OTHER INFORMATION', { underline: true });
      doc.text(`Offerings: ₦${(report.data?.offerings || 0).toLocaleString()}`);
      doc.text(`Testimonies: ${report.data?.numberOfTestimonies || 0}`);
      doc.text(`First Timers: ${report.data?.numberOfFirstTimers || 0}`);
      doc.text(`First Timers Followed Up: ${report.data?.firstTimersFollowedUp || 0}`);
      doc.text(`First Timers Converted: ${report.data?.firstTimersConvertedToCITH || 0}`);
      doc.text(`Mode of Meeting: ${report.data?.modeOfMeeting || 'physical'}`);
      doc.moveDown();
      
      if (report.data?.remarks) {
        doc.text('REMARKS', { underline: true });
        doc.text(report.data.remarks);
        doc.moveDown();
      }
      
      // Approval Information
      doc.text('APPROVAL INFORMATION', { underline: true });
      doc.text(`Status: ${report.status}`);
      doc.text(`Submitted by: ${report.submittedBy?.name || 'Unknown'}`);
      if (report.areaApprovedBy) {
        doc.text(`Area Approved by: ${report.areaApprovedBy.name}`);
      }
      if (report.zonalApprovedBy) {
        doc.text(`Zonal Approved by: ${report.zonalApprovedBy.name}`);
      }
      if (report.districtApprovedBy) {
        doc.text(`District Approved by: ${report.districtApprovedBy.name}`);
      }
      
      doc.end();
    } else {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report Details');
      
      const centre = report.cithCentreId || {};
      const area = centre.areaSupervisorId || {};
      const district = area.districtId || {};
      
      // Add report data
      worksheet.addRow(['WEEKLY REPORT']);
      worksheet.addRow([]);
      worksheet.addRow(['District:', district.name || 'Unknown District']);
      worksheet.addRow(['Area Supervisor:', area.name || 'Unknown Area']);
      worksheet.addRow(['CITH Centre:', centre.name || 'Unknown Centre']);
      worksheet.addRow(['Location:', centre.location || 'Unknown Location']);
      worksheet.addRow(['Week:', report.week ? report.week.toDateString() : 'Unknown Date']);
      worksheet.addRow(['Event Type:', report.eventType || 'regular_service']);
      if (report.eventDescription) {
        worksheet.addRow(['Event Description:', report.eventDescription]);
      }
      worksheet.addRow([]);
      
      worksheet.addRow(['ATTENDANCE DATA']);
      worksheet.addRow(['Male:', report.data?.male || 0]);
      worksheet.addRow(['Female:', report.data?.female || 0]);
      worksheet.addRow(['Children:', report.data?.children || 0]);
      worksheet.addRow(['Total:', (report.data?.male || 0) + (report.data?.female || 0) + (report.data?.children || 0)]);
      worksheet.addRow([]);
      
      worksheet.addRow(['OTHER INFORMATION']);
      worksheet.addRow(['Offerings:', `₦${(report.data?.offerings || 0).toLocaleString()}`]);
      worksheet.addRow(['Testimonies:', report.data?.numberOfTestimonies || 0]);
      worksheet.addRow(['First Timers:', report.data?.numberOfFirstTimers || 0]);
      worksheet.addRow(['First Timers Followed Up:', report.data?.firstTimersFollowedUp || 0]);
      worksheet.addRow(['First Timers Converted:', report.data?.firstTimersConvertedToCITH || 0]);
      worksheet.addRow(['Mode of Meeting:', report.data?.modeOfMeeting || 'physical']);
      worksheet.addRow([]);
      
      if (report.data?.remarks) {
        worksheet.addRow(['REMARKS']);
        worksheet.addRow([report.data.remarks]);
        worksheet.addRow([]);
      }
      
      worksheet.addRow(['APPROVAL INFORMATION']);
      worksheet.addRow(['Status:', report.status]);
      worksheet.addRow(['Submitted by:', report.submittedBy?.name || 'Unknown']);
      if (report.areaApprovedBy) {
        worksheet.addRow(['Area Approved by:', report.areaApprovedBy.name]);
      }
      if (report.zonalApprovedBy) {
        worksheet.addRow(['Zonal Approved by:', report.zonalApprovedBy.name]);
      }
      if (report.districtApprovedBy) {
        worksheet.addRow(['District Approved by:', report.districtApprovedBy.name]);
      }
      
      // Style the worksheet
      worksheet.getColumn(1).width = 25;
      worksheet.getColumn(2).width = 30;
      
      const filename = `report-${report._id}-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Single report export error:', error);
    res.status(400).json({ message: error.message || 'Export failed' });
  }
};

module.exports = {
  exportToExcel,
  exportSingleReport,
};