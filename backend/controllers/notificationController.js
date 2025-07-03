// backend/controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
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

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
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

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
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

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
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

// Helper function to create notifications
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to notify supervisors about report submission
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
    
    // Find area supervisor user
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
    
    // Find district pastor user
    if (centre.areaSupervisorId.districtId) {
      const districtPastorUser = await User.findOne({ 
        districtId: centre.areaSupervisorId.districtId._id 
      });
      
      if (districtPastorUser) {
        await createNotification({
          recipient: districtPastorUser._id,
          sender: submittedBy,
          title: 'New Report Submitted',
          message: `A new weekly report has been submitted from ${centre.name} in your district.`,
          type: 'report_submitted',
          actionUrl: `/reports/${reportId}`,
          metadata: { reportId },
        });
      }
    }
  } catch (error) {
    console.error('Error notifying report submission:', error);
  }
};

// Helper function to notify about report approval
const notifyReportApproved = async (reportId, report, approvedBy, approvalLevel) => {
  try {
    // Notify the original submitter
    await createNotification({
      recipient: report.submittedBy,
      sender: approvedBy,
      title: 'Report Approved',
      message: `Your weekly report has been ${approvalLevel} approved.`,
      type: 'report_approved',
      actionUrl: `/reports/${reportId}`,
      metadata: { reportId },
    });
    
    // If area approved, notify district pastor
    if (approvalLevel === 'area') {
      const centre = await CithCentre.findById(report.cithCentreId)
        .populate({
          path: 'areaSupervisorId',
          populate: {
            path: 'districtId',
          }
        });
      
      if (centre?.areaSupervisorId?.districtId) {
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
    }
  } catch (error) {
    console.error('Error notifying report approval:', error);
  }
};

// Helper function to notify about report rejection
const notifyReportRejected = async (reportId, report, rejectedBy, reason) => {
  try {
    await createNotification({
      recipient: report.submittedBy,
      sender: rejectedBy,
      title: 'Report Rejected',
      message: `Your weekly report has been rejected. Reason: ${reason}`,
      type: 'report_rejected',
      actionUrl: `/reports/${reportId}`,
      metadata: { reportId },
    });
  } catch (error) {
    console.error('Error notifying report rejection:', error);
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