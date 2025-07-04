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
    
    // Only include approved reports for export
    query.status = 'district_approved';
    
    console.log('Export query:', query); // Debug log
    
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
    
    console.log(`Found ${reports.length} reports for export`); // Debug log
    
    if (reports.length === 0) {
      return res.status(404).json({ 
        message: 'No approved reports found for export. Make sure reports are district approved.',
        query: query 
      });
    }
    
    // Create workbook with better Excel formatting
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RockView Church System';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Weekly Reports');
    
    // Define columns with better formatting
    const columns = [
       { header: 'District', key: 'district', width: 20 },
      { header: 'Area Supervisor', key: 'areaSupervisor', width: 20 },
      { header: 'CITH Centre', key: 'cithCentre', width: 25 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Week', key: 'week', width: 15 },
      { header: 'Event Type', key: 'eventType', width: 15 },
      { header: 'Event Description', key: 'eventDescription', width: 25 },
      { header: 'Male', key: 'male', width: 10 },
      { header: 'Female', key: 'female', width: 10 },
      { header: 'Children', key: 'children', width: 12 },
      { header: 'Total Attendance', key: 'totalAttendance', width: 15 },
      { header: 'Offerings (₦)', key: 'offerings', width: 15 },
      { header: 'Testimonies', key: 'testimonies', width: 12 },
      { header: 'First Timers', key: 'firstTimers', width: 12 },
      { header: 'Followed Up', key: 'followedUp', width: 12 },
      { header: 'Converted', key: 'converted', width: 12 },
      { header: 'Mode of Meeting', key: 'mode', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
      { header: 'Submitted By', key: 'submittedBy', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    
     
    // Excel-style header formatting
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    
    // Style each header cell individually for proper Excel look
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { 
        name: 'Calibri',
        size: 11,
        bold: true, 
        color: { argb: 'FFFFFFFF' } 
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF366092' } // Excel blue
      };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true 
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    
    // Add data rows with Excel-style formatting
    reports.forEach((report, index) => {
      try {
        const centre = report.cithCentreId || {};
        const area = centre.areaSupervisorId || {};
        const district = area.districtId || {};
        
        const male = parseInt(report.data?.male) || 0;
        const female = parseInt(report.data?.female) || 0;
        const children = parseInt(report.data?.children) || 0;
        
        const rowData = {
          district: district.name || 'Unknown District',
          areaSupervisor: area.name || 'Unknown Area',
          cithCentre: centre.name || 'Unknown Centre',
          location: centre.location || 'Unknown Location',
          week: report.week ? new Date(report.week).toLocaleDateString() : '',
          eventType: report.eventType ? 
            report.eventType.replace(/_/g, ' ').toUpperCase() : 'REGULAR SERVICE',
          eventDescription: report.eventDescription || '',
          male: male,
          female: female,
          children: children,
          totalAttendance: male + female + children,
          offerings: parseFloat(report.data?.offerings) || 0,
          testimonies: parseInt(report.data?.numberOfTestimonies) || 0,
          firstTimers: parseInt(report.data?.numberOfFirstTimers) || 0,
          followedUp: parseInt(report.data?.firstTimersFollowedUp) || 0,
          converted: parseInt(report.data?.firstTimersConvertedToCITH) || 0,
          mode: (report.data?.modeOfMeeting || 'physical').toUpperCase(),
          remarks: report.data?.remarks || '',
          submittedBy: report.submittedBy?.name || 'Unknown User',
          status: (report.status || 'unknown').replace(/_/g, ' ').toUpperCase(),
        };
        
        const dataRow = worksheet.addRow(rowData);
        dataRow.height = 20;
        
        // Style data cells with Excel formatting
        dataRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { 
            vertical: 'middle',
            wrapText: true,
            horizontal: colNumber >= 8 && colNumber <= 16 ? 'center' : 'left' // Center numbers
          };
          
          // Alternate row colors like Excel
          if (index % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          }
          
          // Add borders
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
          };
        });
        
        // Format number columns
        dataRow.getCell('male').numFmt = '0';
        dataRow.getCell('female').numFmt = '0';
        dataRow.getCell('children').numFmt = '0';
        dataRow.getCell('totalAttendance').numFmt = '0';
        dataRow.getCell('offerings').numFmt = '#,##0.00';
        dataRow.getCell('testimonies').numFmt = '0';
        dataRow.getCell('firstTimers').numFmt = '0';
        dataRow.getCell('followedUp').numFmt = '0';
        dataRow.getCell('converted').numFmt = '0';
        
      } catch (rowError) {
        console.error(`Error processing row ${index}:`, rowError);
      }
    });
    
    // Add totals row with Excel styling
    if (reports.length > 0) {
      const totalsRowIndex = reports.length + 2;
      const totalsRow = worksheet.getRow(totalsRowIndex);
      
      // Calculate totals
      const totalMale = reports.reduce((sum, report) => sum + (parseInt(report.data?.male) || 0), 0);
      const totalFemale = reports.reduce((sum, report) => sum + (parseInt(report.data?.female) || 0), 0);
      const totalChildren = reports.reduce((sum, report) => sum + (parseInt(report.data?.children) || 0), 0);
      const totalOfferings = reports.reduce((sum, report) => sum + (parseFloat(report.data?.offerings) || 0), 0);
      const totalTestimonies = reports.reduce((sum, report) => sum + (parseInt(report.data?.numberOfTestimonies) || 0), 0);
      const totalFirstTimers = reports.reduce((sum, report) => sum + (parseInt(report.data?.numberOfFirstTimers) || 0), 0);
      const totalFollowedUp = reports.reduce((sum, report) => sum + (parseInt(report.data?.firstTimersFollowedUp) || 0), 0);
      const totalConverted = reports.reduce((sum, report) => sum + (parseInt(report.data?.firstTimersConvertedToCITH) || 0), 0);
      
      totalsRow.values = [
        '', '', '', '', '', '', 'TOTALS:', 
        totalMale, totalFemale, totalChildren, 
        totalMale + totalFemale + totalChildren,
        totalOfferings, totalTestimonies, totalFirstTimers,
        totalFollowedUp, totalConverted, '', '', '', ''
      ];
      
      // Style totals row
      totalsRow.eachCell((cell, colNumber) => {
        if (colNumber >= 7) { // From "TOTALS" column onwards
          cell.font = { name: 'Calibri', size: 11, bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCE6F1' }
          };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'center' 
          };
        }
      });
      
      // Format totals numbers
      totalsRow.getCell(8).numFmt = '0'; // male
      totalsRow.getCell(9).numFmt = '0'; // female
      totalsRow.getCell(10).numFmt = '0'; // children
      totalsRow.getCell(11).numFmt = '0'; // total
      totalsRow.getCell(12).numFmt = '#,##0.00'; // offerings
      totalsRow.getCell(13).numFmt = '0'; // testimonies
      totalsRow.getCell(14).numFmt = '0'; // first timers
      totalsRow.getCell(15).numFmt = '0'; // followed up
      totalsRow.getCell(16).numFmt = '0'; // converted
    }
    
    // Freeze the header row like Excel
    worksheet.views = [
      { state: 'frozen', ySplit: 1 }
    ];
    
    // Auto-fit columns with reasonable limits
    worksheet.columns.forEach(column => {
      if (column.width && column.width < 10) column.width = 10;
      if (column.width && column.width > 40) column.width = 40;
    });
    
    // Set response headers
    const filename = `weekly-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    
    // Send the file
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      message: 'Export failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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