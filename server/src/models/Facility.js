import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Facility name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: [
      'hospital',
      'bank',
      'government',
      'education',
      'hotel',
      'salon',
      'clinic',
      'service_center',
      'other'
    ],
    default: 'other'
  },
  description: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  workingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '18:00' },
    days: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

facilitySchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;
