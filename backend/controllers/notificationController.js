// backend/controllers/notificationController.js - Updated with hierarchical notifications
const Notification = require('../models/Notification');
const User = require('../models/User');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');

// Helper function to notify supervisors about report submission (hierarchical)
const notifyReportSubmitted = async (reportId, cithCentreId, submittedBy) => {
 try {
   // Get the CITH centre with populated supervisors
   const centre = await CithCentre.findById(cithCentreId)
     .populate({
       path: 'areaSupervisorId',
       populate: {
         path: 'districtId',
       }
     });
   
   if (!centre || !centre.areaSupervisorId) return;
   
   // Find area supervisor user (direct supervisor)
   const areaSupervisorUser = await User.findOne({ 
     areaSupervisorId: centre.areaSupervisorId._id 
   });
   
   if (areaSupervisorUser) {
     await createNotification({
       recipient: areaSupervisorUser._id,
       sender: submittedBy,
       title: 'New Report Submitted',
       message: `A new weekly report has been submitted from ${centre.name} and requires your approval.`,
       type: 'report_submitted',
       actionUrl: `/reports/${reportId}`,
       metadata: { reportId },
     });
   }
   
   // Find zonal supervisor user (if exists)
   const zonalSupervisorUser = await User.findOne({ 
     zonalSupervisorId: { $exists: true },
     // Additional query to check if this zonal supervisor manages this area
   });
   
   if (zonalSupervisorUser) {
     await createNotification({
       recipient: zonalSupervisorUser._id,
       sender: submittedBy,
       title: 'New Report in Your Zone',
       message: `A new weekly report has been submitted from ${centre.name} in your zone.`,
       type: 'report_submitted',
       actionUrl: `/reports/${reportId}`,
       metadata: { reportId },
     });
   }
   
   // Find district pastor user (overall supervisor)
   if (centre.areaSupervisorId.districtId) {
     const districtPastorUser = await User.findOne({ 
       districtId: centre.areaSupervisorId.districtId._id 
     });
     
     if (districtPastorUser) {
       await createNotification({
         recipient: districtPastorUser._id,
         sender: submittedBy,
         title: 'New Report in Your District',
         message: `A new weekly report has been submitted from ${centre.name} in your district.`,
         type: 'report_submitted',
         actionUrl: `/reports/${reportId}`,
         metadata: { reportId },
       });
     }
   }
   
   // Notify admin (receives all notifications)
   const adminUsers = await User.find({ role: 'admin' });
   for (const admin of adminUsers) {
     await createNotification({
       recipient: admin._id,
       sender: submittedBy,
       title: 'New Report Submitted',
       message: `A new weekly report has been submitted from ${centre.name}.`,
       type: 'report_submitted',
       actionUrl: `/reports/${reportId}`,
       metadata: { reportId },
     });
   }
 } catch (error) {
   console.error('Error notifying report submission:', error);
 }
};

// Helper function to notify about report approval (hierarchical)
const notifyReportApproved = async (reportId, report, approvedBy, approvalLevel) => {
 try {
   // Always notify the original submitter
   await createNotification({
     recipient: report.submittedBy,
     sender: approvedBy,
     title: 'Report Approved',
     message: `Your weekly report has been ${approvalLevel} approved.`,
     type: 'report_approved',
     actionUrl: `/reports/${reportId}`,
     metadata: { reportId },
   });
   
   // Get centre information for hierarchical notifications
   const centre = await CithCentre.findById(report.cithCentreId)
     .populate({
       path: 'areaSupervisorId',
       populate: {
         path: 'districtId',
       }
     });
   
   // If area approved, notify higher levels
   if (approvalLevel === 'area' && centre?.areaSupervisorId?.districtId) {
     // Notify zonal supervisor
     const zonalSupervisorUser = await User.findOne({ 
       zonalSupervisorId: { $exists: true },
       // Add proper zonal supervisor query based on your schema
     });
     
     if (zonalSupervisorUser) {
       await createNotification({
         recipient: zonalSupervisorUser._id,
         sender: approvedBy,
         title: 'Report Pending Zonal Approval',
         message: `A report from ${centre.name} has been area approved and is pending your approval.`,
         type: 'report_submitted',
         actionUrl: `/reports/${reportId}`,
         metadata: { reportId },
       });
     }
     
     // Notify district pastor
     const districtPastorUser = await User.findOne({ 
       districtId: centre.areaSupervisorId.districtId._id 
     });
     
     if (districtPastorUser) {
       await createNotification({
         recipient: districtPastorUser._id,
         sender: approvedBy,
         title: 'Report Pending District Approval',
         message: `A report from ${centre.name} has been area approved and is pending your final approval.`,
         type: 'report_submitted',
         actionUrl: `/reports/${reportId}`,
         metadata: { reportId },
       });
     }
   }
   
   // If zonal approved, notify district pastor
   if (approvalLevel === 'zonal' && centre?.areaSupervisorId?.districtId) {
     const districtPastorUser = await User.findOne({ 
       districtId: centre.areaSupervisorId.districtId._id 
     });
     
     if (districtPastorUser) {
       await createNotification({
         recipient: districtPastorUser._id,
         sender: approvedBy,
         title: 'Report Pending Final Approval',
         message: `A report from ${centre.name} has been zonal approved and is pending your final approval.`,
         type: 'report_submitted',
         actionUrl: `/reports/${reportId}`,
         metadata: { reportId },
       });
     }
   }
   
   // Always notify admin
   const adminUsers = await User.find({ role: 'admin' });
   for (const admin of adminUsers) {
     await createNotification({
       recipient: admin._id,
       sender: approvedBy,
       title: `Report ${approvalLevel} Approved`,
       message: `A report from ${centre?.name} has been ${approvalLevel} approved.`,
       type: 'report_approved',
       actionUrl: `/reports/${reportId}`,
       metadata: { reportId },
     });
   }
 } catch (error) {
   console.error('Error notifying report approval:', error);
 }
};

// Helper function to notify about report rejection (hierarchical)
const notifyReportRejected = async (reportId, report, rejectedBy, reason) => {
 try {
   // Notify the original submitter
   await createNotification({
     recipient: report.submittedBy,
     sender: rejectedBy,
     title: 'Report Rejected',
     message: `Your weekly report has been rejected. Reason: ${reason}`,
     type: 'report_rejected',
     actionUrl: `/reports/${reportId}`,
     metadata: { reportId },
   });
   
   // Get centre information
   const centre = await CithCentre.findById(report.cithCentreId)
     .populate({
       path: 'areaSupervisorId',
       populate: {
         path: 'districtId',
       }
     });
   
   // Notify the direct supervisor (area supervisor)
   if (centre?.areaSupervisorId) {
     const areaSupervisorUser = await User.findOne({ 
       areaSupervisorId: centre.areaSupervisorId._id 
     });
     
     if (areaSupervisorUser && areaSupervisorUser._id.toString() !== rejectedBy.toString()) {
       await createNotification({
         recipient: areaSupervisorUser._id,
         sender: rejectedBy,
         title: 'Report Rejected in Your Area',
         message: `A report from ${centre.name} has been rejected. Reason: ${reason}`,
         type: 'report_rejected',
         actionUrl: `/reports/${reportId}`,
         metadata: { reportId },
       });
     }
   }
   
   // Notify admin
   const adminUsers = await User.find({ role: 'admin' });
   for (const admin of adminUsers) {
     await createNotification({
       recipient: admin._id,
       sender: rejectedBy,
       title: 'Report Rejected',
       message: `A report from ${centre?.name} has been rejected.`,
       type: 'report_rejected',
       actionUrl: `/reports/${reportId}`,
       metadata: { reportId },
     });
   }
 } catch (error) {
   console.error('Error notifying report rejection:', error);
 }
};

// Rest of the notification controller functions remain the same...
const getNotifications = async (req, res) => {
 try {
   const { page = 1, limit = 20, unreadOnly = false } = req.query;
   
   let query = { recipient: req.user._id };
   if (unreadOnly === 'true') {
     query.read = false;
   }
   
   const notifications = await Notification.find(query)
     .populate('sender', 'name email role')
     .sort({ createdAt: -1 })
     .limit(limit * 1)
     .skip((page - 1) * limit);
   
   const total = await Notification.countDocuments(query);
   const unreadCount = await Notification.countDocuments({
     recipient: req.user._id,
     read: false,
   });
   
   res.json({
     notifications,
     totalPages: Math.ceil(total / limit),
     currentPage: page,
     total,
     unreadCount,
   });
 } catch (error) {
   res.status(400).json({ message: error.message });
 }
};

const markAsRead = async (req, res) => {
 try {
   const notification = await Notification.findOneAndUpdate(
     { _id: req.params.id, recipient: req.user._id },
     { read: true },
     { new: true }
   );
   
   if (!notification) {
     return res.status(404).json({ message: 'Notification not found' });
   }
   
   res.json(notification);
 } catch (error) {
   res.status(400).json({ message: error.message });
 }
};

const markAllAsRead = async (req, res) => {
 try {
   await Notification.updateMany(
     { recipient: req.user._id, read: false },
     { read: true }
   );
   
   res.json({ message: 'All notifications marked as read' });
 } catch (error) {
   res.status(400).json({ message: error.message });
 }
};

const getUnreadCount = async (req, res) => {
 try {
   const count = await Notification.countDocuments({
     recipient: req.user._id,
     read: false,
   });
   
   res.json({ count });
 } catch (error) {
   res.status(400).json({ message: error.message });
 }
};

const createNotification = async (data) => {
 try {
   const notification = await Notification.create(data);
   return notification;
 } catch (error) {
   console.error('Error creating notification:', error);
 }
};

module.exports = {
 getNotifications,
 markAsRead,
 markAllAsRead,
 getUnreadCount,
 createNotification,
 notifyReportSubmitted,
 notifyReportApproved,
 notifyReportRejected,
};