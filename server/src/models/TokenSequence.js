import mongoose from 'mongoose';

const tokenSequenceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null,
    index: true
  },
  dateStr: {
    type: String,
    required: true,
    index: true
  },
  lastSequence: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

tokenSequenceSchema.index({ organizationId: 1, serviceId: 1, dateStr: 1 }, { unique: true });

const TokenSequence = mongoose.model('TokenSequence', tokenSequenceSchema);
export default TokenSequence;
