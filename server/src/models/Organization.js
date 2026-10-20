import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Organization type is required'],
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
  logo: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  settings: {
    tokenResetFrequency: {
      type: String,
      enum: ['daily', 'monthly', 'never'],
      default: 'daily'
    },
    allowAppointments: { type: Boolean, default: true },
    maxTokensPerCustomerDay: { type: Number, default: 5 },
    noShowTimeoutSeconds: { type: Number, default: 300 },
    smsNotificationsEnabled: { type: Boolean, default: false },
    emailNotificationsEnabled: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
