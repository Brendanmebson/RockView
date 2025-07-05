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
    
     // Allow messaging between all users (removed hierarchy restriction)
    
    const message = await Message.create({
      from: req.user._id,
      to,
      subject: type === 'chat' ? 'Chat Message' : req.body.subject,
      content,
      priority: req.body.priority || 'normal',
      category: req.body.category || 'general',
      messageType: type,
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
    // Get all users except the current user
    const users = await User.find(
      { 
        _id: { $ne: req.user._id },
        isActive: true // Only active users
      }, 
      'name email role phone'
    ).sort({ name: 1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(400).json({ message: error.message });
  }
};

// Helper function to get users based on hierarchy (for notifications only)
const getUsersByHierarchy = async (currentUser) => {
  let users = [];
  
  try {
    if (currentUser.role === 'admin') {
      users = await User.find({ _id: { $ne: currentUser._id } }, 'name email role');
    } else if (currentUser.role === 'district_pastor') {
      // Can receive notifications from area supervisors and CITH centres in their district
      const areaSupervisors = await AreaSupervisor.find({ districtId: currentUser.districtId });
      const areaSupervisorIds = areaSupervisors.map(as => as._id);
      
      const cithCentres = await CithCentre.find({ areaSupervisorId: { $in: areaSupervisorIds } });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      
      users = await User.find({
        $or: [
          { areaSupervisorId: { $in: areaSupervisorIds } },
          { cithCentreId: { $in: cithCentreIds } }
        ]
      }, 'name email role');
    } else if (currentUser.role === 'area_supervisor') {
      // Can receive notifications from CITH centres under them
      const cithCentres = await CithCentre.find({ areaSupervisorId: currentUser.areaSupervisorId });
      const cithCentreIds = cithCentres.map(cc => cc._id);
      
      users = await User.find({
        cithCentreId: { $in: cithCentreIds }
      }, 'name email role');
    }
  } catch (error) {
    console.error('Error getting users by hierarchy:', error);
  }
  
  return users;
};



module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  deleteMessage,
  getUnreadCount,
  markMessagesAsRead,
  getAvailableUsers,
  getUsersByHierarchy,
};