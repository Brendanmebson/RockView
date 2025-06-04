// backend/models/CithCentre.js
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
      trim: true,
      default: 'Unassigned'
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CithCentre', cithCentreSchema);