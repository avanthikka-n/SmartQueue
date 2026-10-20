import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
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
    required: [true, 'Counter name is required'],
    trim: true
  },
  counterNumber: {
    type: Number,
    required: [true, 'Counter number is required']
  },
  assignedStaff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'break', 'paused'],
    default: 'offline'
  },
  currentTokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

counterSchema.index({ organizationId: 1, departmentId: 1, counterNumber: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
