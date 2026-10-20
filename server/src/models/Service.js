import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required'],
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
    required: [true, 'Service name is required'],
    trim: true
  },
  description: { type: String, default: '' },
  prefix: {
    type: String,
    required: [true, 'Service token prefix is required'],
    uppercase: true,
    trim: true,
    maxlength: 5
  },
  estimatedServiceTime: {
    type: Number,
    required: [true, 'Estimated service time in minutes is required'],
    default: 10
  },
  priorityEnabled: { type: Boolean, default: true },
  appointmentEnabled: { type: Boolean, default: true },
  dailyTokenLimit: { type: Number, default: 0 }, // 0 = unlimited
  workingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '18:00' }
  },
  nextServiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

serviceSchema.index({ organizationId: 1, departmentId: 1, name: 1 }, { unique: true });

const Service = mongoose.model('Service', serviceSchema);
export default Service;
