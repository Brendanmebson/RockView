// backend/controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { to, subject, content, priority, category, replyTo } = req.body;
    
    // Verify recipient exists
    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if user can message this recipient based on hierarchy
    const canMessage = await canUserMessageRecipient(req.user, recipient);
    if (!canMessage) {
      return res.status(403).json({ message: 'You cannot message this user' });
    }
    
    const message = await Message.create({
      from: req.user._id,
      to,
      subject,
      content,
      priority: priority || 'normal',
      category: category || 'general',
      replyTo,
    });
    
    const populatedMessage = await Message.findById(message._id)
      .populate('from', 'name email role')
      .populate('to', 'name email role');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get messages (inbox/sent)
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { type = 'inbox', page = 1, limit = 20, isRead } = req.query;
    
    let query = {};
    
    if (type === 'inbox') {
      query.to = req.user._id;
    } else if (type === 'sent') {
      query.from = req.user._id;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    const messages = await Message.find(query)
      .populate('from', 'name email role')
      .populate('to', 'name email role')
      .populate('replyTo', 'subject')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Message.countDocuments(query);
    
    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get message by ID
// @route   GET /api/messages/:id
// @access  Private
const getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('from', 'name email role')
      .populate('to', 'name email role')
      .populate('replyTo', 'subject content from');
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user can access this message
    if (message.from._id.toString() !== req.user._id.toString() && 
        message.to._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark as read if user is the recipient
    if (message.to._id.toString() === req.user._id.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only sender or recipient can delete
    if (message.from.toString() !== req.user._id.toString() && 
        message.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.user._id,
      isRead: false,
    });
    
    res.json({ count });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        to: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to check messaging permissions
const canUserMessageRecipient = async (sender, recipient) => {
  // Admin can message anyone
  if (sender.role === 'admin') return true;
  
  // Users can message admins
  if (recipient.role === 'admin') return true;
  
  // District pastor can message area supervisors and CITH centre leaders in their district
  if (sender.role === 'district_pastor') {
    if (recipient.role === 'area_supervisor') {
      const area = await AreaSupervisor.findById(recipient.areaSupervisorId);
      return area && area.districtId.toString() === sender.districtId.toString();
    }
    
    if (recipient.role === 'cith_centre') {
      const centre = await CithCentre.findById(recipient.cithCentreId).populate('areaSupervisorId');
      return centre && centre.areaSupervisorId.districtId.toString() === sender.districtId.toString();
    }
  }
  
  // Area supervisor can message CITH centre leaders under them
  if (sender.role === 'area_supervisor' && recipient.role === 'cith_centre') {
    const centre = await CithCentre.findById(recipient.cithCentreId);
    return centre && centre.areaSupervisorId.toString() === sender.areaSupervisorId.toString();
  }
  
  // CITH centre leaders can message their area supervisor
  if (sender.role === 'cith_centre' && recipient.role === 'area_supervisor') {
    const centre = await CithCentre.findById(sender.cithCentreId);
    return centre && centre.areaSupervisorId.toString() === recipient.areaSupervisorId.toString();
  }
  
  // Area supervisors can message their district pastor
  if (sender.role === 'area_supervisor' && recipient.role === 'district_pastor') {
    const area = await AreaSupervisor.findById(sender.areaSupervisorId);
    return area && area.districtId.toString() === recipient.districtId.toString();
  }
  
  return false;
};

module.exports = {
  sendMessage,
  getMessages,
  getMessageById,
  deleteMessage,
  getUnreadCount,
  markMessagesAsRead,
};