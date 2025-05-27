// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    category: {
      type: String,
      enum: ['general', 'report', 'announcement', 'prayer_request', 'administrative'],
      default: 'general',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    attachments: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      url: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
messageSchema.index({ from: 1, to: 1 });
messageSchema.index({ to: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);