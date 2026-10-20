import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required'],
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required'],
    index: true
  },
  prefix: {
    type: String,
    default: 'A',
    uppercase: true,
    trim: true
  },
  tokenNumber: {
    type: String,
    required: [true, 'Token number is required'],
    trim: true,
    index: true
  },
  tokenSequence: {
    type: Number,
    required: [true, 'Token sequence is required']
  },
  dateStr: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
    index: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'CALLED', 'SERVING', 'IN_SERVICE', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'TRANSFERRED', 'EXPIRED'],
    default: 'WAITING',
    index: true
  },
  priority: {
    type: String,
    enum: ['EMERGENCY', 'SENIOR_CITIZEN', 'APPOINTMENT', 'PRIORITY', 'NORMAL'],
    default: 'NORMAL',
    index: true
  },
  priorityWeight: {
    type: Number,
    default: 0
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone number is required'],
    trim: true
  },
  customerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  counterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
    default: null
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  calledByStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  servedByStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedWaitTime: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  calledAt: { type: Date, default: null },
  serviceStartedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  skippedAt: { type: Date, default: null },
  transferredAt: { type: Date, default: null },
  transferredFromTokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null
  }
}, {
  timestamps: true
});

tokenSchema.index({ organizationId: 1, departmentId: 1, status: 1, priorityWeight: -1, createdAt: 1 });
tokenSchema.index({ departmentId: 1, dateStr: 1, tokenSequence: 1 }, { unique: true });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
