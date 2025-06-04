// backend/models/District.js
const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    districtNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      unique: true,
    },
    pastorName: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('District', districtSchema);