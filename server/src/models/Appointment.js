import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
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
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required'],
    index: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  customerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    index: true
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  status: {
    type: String,
    enum: ['BOOKED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'BOOKED',
    index: true
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null
  }
}, {
  timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
