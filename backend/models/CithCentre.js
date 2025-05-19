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
    },
    contactPhone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CithCentre', cithCentreSchema);