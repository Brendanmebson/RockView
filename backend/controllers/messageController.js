// backend/controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');

// @desc    Send a message (chat style)
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { to, content, type = 'chat' } = req.body;
    
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
      subject: type === 'chat' ? 'Chat Message' : req.body.subject,
      content,
      priority: req.body.priority || 'normal',
      category: req.body.category || 'general',
      messageType: type, // 'chat' or 'email'
    });
    
    const populatedMessage = await Message.findById(message._id)
      .populate('from', 'name email role')
      .populate('to', 'name email role');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    // Get all users that the current user has had conversations with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { from: req.user._id },
            { to: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$from', req.user._id] },
              '$to',
              '$from'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$to', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            isRead: '$lastMessage.isRead'
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);
    
    res.json(conversations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversationMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: userId },
        { from: userId, to: req.user._id }
      ]
    })
    .populate('from', 'name email role')
    .populate('to', 'name email role')
    .sort({ createdAt: 1 }) // Ascending order for chat
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    // Get user info
    const user = await User.findById(userId, 'name email role');
    
    res.json({
      user,
      messages,
      total: messages.length
    });
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
    const { messageIds, userId } = req.body;
    
    let query = {
      to: req.user._id,
      isRead: false,
    };
    
    if (messageIds && messageIds.length > 0) {
      query._id = { $in: messageIds };
    } else if (userId) {
      query.from = userId;
    }
    
    await Message.updateMany(query, {
      isRead: true,
      readAt: new Date(),
    });
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get available users for messaging
// @route   GET /api/messages/users
// @access  Private
const getAvailableUsers = async (req, res) => {
  try {
    const users = await getUsersByHierarchy(req.user);
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to get users based on hierarchy
const getUsersByHierarchy = async (currentUser) => {
  let users = [];
  
  try {
    if (currentUser.role === 'admin') {
      users = await User.find({ _id: { $ne: currentUser._id } }, 'name email role');
    } else if (currentUser.role === 'district_pastor') {
      // Can message area supervisors and CITH centres in their district
      const areaSupervisors = await AreaSupervisor.find({ districtId: currentUser.districtId });
      const areaSupervisorIds = areaSupervisors.map(as => as._id);
      
      const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      
      users = await User.find({
        $or: [
          { role: 'admin' },
          { areaSupervisorId: { $in: areaSupervisorIds } },
          { cithCentreId: { $in: cithCentreIds } }
        ],
        _id: { $ne: currentUser._id }
      }, 'name email role');
    } else if (currentUser.role === 'area_supervisor') {
      // Can message CITH centres under them and their district pastor
      const cithCentres = await CithCentre.find({ areaSupervisorId: currentUser.areaSupervisorId });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      
      users = await User.find({
        $or: [
          { role: 'admin' },
          { role: 'district_pastor', districtId: currentUser.districtId },
          { cithCentreId: { $in: cithCentreIds } }
        ],
        _id: { $ne: currentUser._id }
      }, 'name email role');
    } else if (currentUser.role === 'cith_centre') {
      // Can message their area supervisor, district pastor, and admin
      const centre = await CithCentre.findById(currentUser.cithCentreId).populate('areaSupervisorId');
      
      users = await User.find({
        $or: [
          { role: 'admin' },
          { areaSupervisorId: centre?.areaSupervisorId?._id },
          { role: 'district_pastor', districtId: centre?.areaSupervisorId?.districtId }
        ],
        _id: { $ne: currentUser._id }
      }, 'name email role');
    }
  } catch (error) {
    console.error('Error getting users by hierarchy:', error);
  }
  
  return users;
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

const getAvailableUsers = async (req, res) => {
  try {
    const users = await getUsersByHierarchy(req.user);
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  deleteMessage,
  getUnreadCount,
  markMessagesAsRead,
  getAvailableUsers,
};