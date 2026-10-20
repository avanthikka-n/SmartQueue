import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    default: null,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  description: { type: String, default: '' },
  isPaused: { type: Boolean, default: false },
  pauseReason: { type: String, default: '' },
  workingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '18:00' }
  },
  dailyTokenLimit: { type: Number, default: 0 }, // 0 = unlimited
  noShowTimeoutSeconds: { type: Number, default: null }, // null = inherit from org
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

departmentSchema.index({ organizationId: 1, facilityId: 1, name: 1 });

const Department = mongoose.model('Department', departmentSchema);
export default Department;
