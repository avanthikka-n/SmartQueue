import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Token from '../models/Token.js';
import QueueEvent from '../models/QueueEvent.js';
import { getNextTokenSequence, formatTokenNumber, calculateWaitTime } from '../services/tokenEngine.js';
import { emitQueueUpdate } from '../sockets/socketManager.js';

// @desc    Book an advance appointment
// @route   POST /api/appointments
// @access  Public
export const createAppointment = async (req, res) => {
  try {
    const {
      organizationId,
      departmentId,
      serviceId,
      customerName,
      customerPhone,
      customerEmail,
      appointmentDate,
      appointmentTime
    } = req.body;

    if (!organizationId || !departmentId || !serviceId || !customerName || !customerPhone || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Organization, Department, Service, Customer Name, Phone, Date, and Time are required'
      });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.appointmentEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Appointments are not enabled for this service'
      });
    }

    const appointment = await Appointment.create({
      organizationId,
      departmentId,
      serviceId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail || '',
      customerUserId: req.user?._id || null,
      appointmentDate: new Date(appointmentDate),
      appointmentTime
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('organizationId', 'name')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name prefix');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error booking appointment'
    });
  }
};

// @desc    Check-in for an appointment (Generates APPOINTMENT priority token)
// @route   POST /api/appointments/:id/check-in
// @access  Public / Staff
export const checkInAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('serviceId', 'prefix name estimatedServiceTime');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        message: 'Appointment has already been checked in',
        tokenId: appointment.tokenId
      });
    }

    // Generate APPOINTMENT priority token
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const sequence = await getNextTokenSequence(
      appointment.organizationId,
      appointment.serviceId._id,
      dateStr
    );
    const tokenNumber = formatTokenNumber(appointment.serviceId.prefix, sequence);

    const { peopleAhead, estimatedWaitTimeMinutes } = await calculateWaitTime(
      appointment.organizationId,
      appointment.departmentId,
      appointment.serviceId._id,
      sequence,
      60 // APPOINTMENT priority weight
    );

    const token = await Token.create({
      organizationId: appointment.organizationId,
      departmentId: appointment.departmentId,
      serviceId: appointment.serviceId._id,
      tokenNumber,
      tokenSequence: sequence,
      status: 'WAITING',
      priority: 'APPOINTMENT',
      priorityWeight: 60,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      customerUserId: appointment.customerUserId,
      estimatedWaitTime: estimatedWaitTimeMinutes,
      notes: `Appointment Check-in for ${appointment.appointmentTime}`
    });

    // Update appointment
    appointment.status = 'CHECKED_IN';
    appointment.tokenId = token._id;
    await appointment.save();

    await QueueEvent.create({
      organizationId: appointment.organizationId,
      departmentId: appointment.departmentId,
      serviceId: appointment.serviceId._id,
      tokenId: token._id,
      action: 'token_created',
      performedBy: req.user?._id || null,
      details: { appointmentId: appointment._id, tokenNumber }
    });

    emitQueueUpdate({
      organizationId: appointment.organizationId,
      departmentId: appointment.departmentId,
      eventName: 'token_created',
      payload: { token, peopleAhead, estimatedWaitTime: estimatedWaitTimeMinutes }
    });

    res.status(200).json({
      success: true,
      message: `Checked in! Generated token ${tokenNumber}`,
      token,
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking in appointment'
    });
  }
};

// @desc    Get appointments list
// @route   GET /api/appointments
// @access  Private (ADMIN, STAFF)
export const getAppointments = async (req, res) => {
  try {
    const { organizationId, departmentId, date, status } = req.query;
    const orgId = organizationId || req.user?.organizationId;

    let query = {};
    if (orgId) query.organizationId = orgId;
    if (departmentId) query.departmentId = departmentId;
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('departmentId', 'name')
      .populate('serviceId', 'name prefix')
      .populate('tokenId', 'tokenNumber status')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointments'
    });
  }
};
