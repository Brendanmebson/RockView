const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema(
  {
    cithCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CithCentre',
      required: true,
    },
    week: {
      type: Date,
      required: true,
    },
    data: {
      male: {
        type: Number,
        required: true,
        min: 0,
      },
      female: {
        type: Number,
        required: true,
        min: 0,
      },
      children: {
        type: Number,
        required: true,
        min: 0,
      },
      offerings: {
        type: Number,
        required: true,
        min: 0,
      },
      numberOfTestimonies: {
        type: Number,
        required: true,
        min: 0,
      },
      numberOfFirstTimers: {
        type: Number,
        required: true,
        min: 0,
      },
      firstTimersFollowedUp: {
        type: Number,
        required: true,
        min: 0,
      },
      firstTimersConvertedToCITH: {
        type: Number,
        required: true,
        min: 0,
      },
      modeOfMeeting: {
        type: String,
        enum: ['physical', 'virtual', 'hybrid'],
        required: true,
      },
      remarks: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'area_approved', 'district_approved', 'rejected'],
      default: 'pending',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    areaApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    areaApprovedAt: Date,
    districtApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    districtApprovedAt: Date,
    rejectionReason: String,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Ensure one report per centre per week
weeklyReportSchema.index({ cithCentreId: 1, week: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);