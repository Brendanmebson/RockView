// backend/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getMessageById,
  deleteMessage,
  getUnreadCount,
  markMessagesAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMessages)
  .post(sendMessage);

router.get('/unread/count', getUnreadCount);
router.put('/mark-read', markMessagesAsRead);

router.route('/:id')
  .get(getMessageById)
  .delete(deleteMessage);

module.exports = router;