// backend/models/AreaSupervisor.js
const mongoose = require('mongoose');

const areaSupervisorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
    },
    supervisorName: {
      type: String,
      trim: true,
      default: 'Unassigned',
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

module.exports = mongoose.model('AreaSupervisor', areaSupervisorSchema);