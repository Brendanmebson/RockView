// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['report_submitted', 'report_approved', 'report_rejected', 'system', 'message'],
      default: 'system',
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WeeklyReport',
      },
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);