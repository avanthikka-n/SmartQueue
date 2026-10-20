import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
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
  customerName: {
    type: String,
    default: 'Anonymous'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
