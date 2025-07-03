// backend/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversationMessages,
  deleteMessage,
  getUnreadCount,
  markMessagesAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Chat-style routes
router.get('/conversations', getConversations);
router.get('/conversation/:userId', getConversationMessages);
router.get('/Users', getAvailableUsers);
router.post('/send', sendMessage);
router.get('/unread/count', getUnreadCount);
router.put('/mark-read', markMessagesAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;