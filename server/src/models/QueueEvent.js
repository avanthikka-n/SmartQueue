import mongoose from 'mongoose';

const queueEventSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: [true, 'Token ID is required'],
    index: true
  },
  action: {
    type: String,
    enum: [
      'token_created',
      'token_called',
      'token_recalled',
      'token_skipped',
      'service_started',
      'service_completed',
      'token_transferred',
      'token_cancelled'
    ],
    required: [true, 'Queue event action is required'],
    index: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  counterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

const QueueEvent = mongoose.model('QueueEvent', queueEventSchema);
export default QueueEvent;
