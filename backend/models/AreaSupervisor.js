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

module.exports = mongoose.model('AreaSupervisor', areaSupervisorSchema);