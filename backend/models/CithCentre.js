const mongoose = require('mongoose');

const cithCentreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    areaSupervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AreaSupervisor',
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    leaderName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null, // Will be null until user registers
    },
    contactPhone: {
      type: String,
      trim: true,
      default: null, // Will be null until user registers
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CithCentre', cithCentreSchema);