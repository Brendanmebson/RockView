// backend/models/PositionChangeRequest.js
const mongoose = require('mongoose');

const positionChangeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentRole: {
      type: String,
      enum: ['cith_centre', 'area_supervisor', 'district_pastor', 'admin'],
      required: true,
    },
    newRole: {
      type: String,
      enum: ['cith_centre', 'area_supervisor', 'district_pastor', 'admin'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PositionChangeRequest', positionChangeRequestSchema);