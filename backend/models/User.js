// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return v && v.length >= 10;
        },
        message: 'Phone number must be at least 10 characters long'
      }
    },
    role: {
      type: String,
      enum: ['cith_centre', 'area_supervisor', 'zonal_supervisor', 'district_pastor', 'admin'],
      required: true,
    },
    cithCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CithCentre',
    },
    areaSupervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AreaSupervisor',
    },
    zonalSupervisorId: { // Fixed: was ZonalSupervisorId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ZonalSupervisor',
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);