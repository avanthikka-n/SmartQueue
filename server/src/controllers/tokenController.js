import Token from '../models/Token.js';
import Service from '../models/Service.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';
import QueueEvent from '../models/QueueEvent.js';
import {
  getNextTokenSequence,
  formatTokenNumber,
  getPriorityWeight,
  calculateWaitTime,
  getSortedQueue
} from '../services/tokenEngine.js';
import { emitQueueUpdate } from '../sockets/socketManager.js';

// Helper to check working hours
const isWithinWorkingHours = (hours) => {
  if (!hours || !hours.open || !hours.close) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const start = openH * 60 + (openM || 0);
  const end = closeH * 60 + (closeM || 0);
  return currentMinutes >= start && currentMinutes <= end;
};

// @desc    Generate a new customer token
// @route   POST /api/tokens
// @access  Public
export const generateToken = async (req, res) => {
  try {
    const { organizationId, departmentId, serviceId, customerName, customerPhone, priority, notes } = req.body;

    if (!organizationId || !departmentId || !serviceId || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID, Department ID, Service ID, Customer Name, and Phone are required'
      });
    }

    // Verify department existence & pause status
    const department = await Department.findById(departmentId);
    if (!department || !department.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected department is unavailable'
      });
    }

    if (department.isPaused) {
      return res.status(400).json({
        success: false,
        message: `Department queue is temporarily paused: ${department.pauseReason || 'Please check back shortly.'}`
      });
    }

    if (!isWithinWorkingHours(department.workingHours)) {
      return res.status(400).json({
        success: false,
        message: `Department is currently outside operating hours (${department.workingHours.open} - ${department.workingHours.close})`
      });
    }

    // Verify service existence & prefix
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is unavailable'
      });
    }

    if (!isWithinWorkingHours(service.workingHours)) {
      return res.status(400).json({
        success: false,
        message: `Service is currently outside operating hours (${service.workingHours.open} - ${service.workingHours.close})`
      });
    }

    // Get today's date string (YYYY-MM-DD)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Daily token limit verification
    if (department.dailyTokenLimit > 0) {
      const deptTokensCount = await Token.countDocuments({ departmentId, dateStr });
      if (deptTokensCount >= department.dailyTokenLimit) {
        return res.status(400).json({
          success: false,
          message: `Daily token limit of ${department.dailyTokenLimit} for this department has been reached for today`
        });
      }
    }

    if (service.dailyTokenLimit > 0) {
      const serviceTokensCount = await Token.countDocuments({ serviceId, dateStr });
      if (serviceTokensCount >= service.dailyTokenLimit) {
        return res.status(400).json({
          success: false,
          message: `Daily token limit of ${service.dailyTokenLimit} for this service has been reached for today`
        });
      }
    }

    // Prevent duplicate active booking for same customer across the DEPARTMENT
    const activeQuery = {
      departmentId,
      status: { $in: ['WAITING', 'CALLED', 'SERVING', 'IN_SERVICE'] },
      $or: [
        { customerPhone: customerPhone.trim() },
        ...(req.user?._id ? [{ customerUserId: req.user._id }] : [])
      ]
    };
    const existingActive = await Token.findOne(activeQuery)
      .populate('serviceId', 'name')
      .populate('departmentId', 'name');

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `You already have an active token (${existingActive.tokenNumber}) in ${existingActive.departmentId?.name || 'this department'}. Please wait until your turn or cancel your active token before booking another.`
      });
    }

    // Get next atomic token sequence (concurrency protected)
    const sequence = await getNextTokenSequence(organizationId, serviceId, dateStr);

    // Format token string (e.g. A-001, ECG-002)
    const tokenNumber = formatTokenNumber(service.prefix, sequence);

    // Calculate priority weighting
    const selectedPriority = priority || 'NORMAL';
    const weight = getPriorityWeight(selectedPriority);

    // Calculate initial estimated wait time
    const { peopleAhead, estimatedWaitTimeMinutes } = await calculateWaitTime(
      organizationId,
      departmentId,
      serviceId,
      sequence,
      weight
    );

    // Resolve target facilityId
    const facilityId = service.facilityId || department.facilityId || req.body.facilityId || null;

    // Create Token document
    const token = await Token.create({
      organizationId,
      facilityId,
      departmentId,
      serviceId,
      tokenNumber,
      prefix: service.prefix,
      dateStr,
      tokenSequence: sequence,
      status: 'WAITING',
      priority: selectedPriority,
      priorityWeight: weight,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerUserId: req.user?._id || null,
      estimatedWaitTime: estimatedWaitTimeMinutes,
      notes: notes || ''
    });

    // Log QueueEvent
    await QueueEvent.create({
      organizationId,
      departmentId,
      serviceId,
      tokenId: token._id,
      action: 'token_created',
      performedBy: req.user?._id || null,
      details: { tokenNumber, priority: selectedPriority }
    });

    const populatedToken = await Token.findById(token._id)
      .populate('organizationId', 'name')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name prefix estimatedServiceTime');

    // Emit Socket.IO event to room
    emitQueueUpdate({
      organizationId,
      departmentId,
      eventName: 'token_created',
      payload: {
        token: populatedToken,
        peopleAhead,
        estimatedWaitTime: estimatedWaitTimeMinutes
      }
    });

    res.status(201).json({
      success: true,
      message: 'Token generated successfully',
      token: populatedToken,
      peopleAhead,
      estimatedWaitTime: estimatedWaitTimeMinutes
    });
  } catch (error) {
    console.error('[Generate Token Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating token'
    });
  }
};

// @desc    Get live status of a single token
// @route   GET /api/tokens/:id
// @access  Public
export const getTokenById = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('organizationId', 'name address phone logo')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name prefix estimatedServiceTime')
      .populate('counterId', 'name counterNumber status')
      .populate('staffId', 'name');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    let peopleAhead = 0;
    let estimatedWaitTime = 0;

    if (token.status === 'WAITING') {
      const waitCalc = await calculateWaitTime(
        token.organizationId._id,
        token.departmentId._id,
        token.serviceId._id,
        token.tokenSequence,
        token.priorityWeight
      );
      peopleAhead = waitCalc.peopleAhead;
      estimatedWaitTime = waitCalc.estimatedWaitTimeMinutes;
    }

    // Get current serving token for the same department/service
    const currentlyServing = await Token.findOne({
      departmentId: token.departmentId._id,
      status: { $in: ['CALLED', 'IN_SERVICE'] }
    })
      .populate('counterId', 'counterNumber name')
      .sort({ calledAt: -1 });

    res.status(200).json({
      success: true,
      token,
      peopleAhead,
      estimatedWaitTime,
      currentlyServingToken: currentlyServing ? currentlyServing.tokenNumber : '—',
      counterNumber: currentlyServing?.counterId?.counterNumber || token.counterId?.counterNumber || '—'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching token status'
    });
  }
};

// @desc    Get sorted active queue for department/organization
// @route   GET /api/queue or GET /api/tokens/queue
// @access  Public
export const getQueue = async (req, res) => {
  try {
    const departmentId = req.query.departmentId;
    const organizationId = req.query.organizationId || req.user?.organizationId;
    const serviceId = req.query.serviceId;

    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (organizationId) filter.organizationId = organizationId;
    if (serviceId) filter.serviceId = serviceId;

    // Filter active today or active status
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tokens = await Token.find({
      ...filter,
      $or: [
        { status: { $in: ['WAITING', 'CALLED', 'IN_SERVICE'] } },
        { createdAt: { $gte: startOfDay } }
      ]
    })
      .populate('serviceId', 'name prefix estimatedServiceTime')
      .populate('departmentId', 'name')
      .populate('counterId', 'counterNumber name')
      .populate('staffId', 'name')
      .sort({ priorityWeight: -1, createdAt: 1 });

    const waiting = tokens.filter(t => t.status === 'WAITING');
    const called = tokens.filter(t => t.status === 'CALLED');
    const inService = tokens.filter(t => t.status === 'IN_SERVICE');
    const completed = tokens.filter(t => t.status === 'COMPLETED');
    const skipped = tokens.filter(t => t.status === 'SKIPPED');
    const activeServing = tokens.filter(t => ['CALLED', 'IN_SERVICE'].includes(t.status));

    res.status(200).json({
      success: true,
      count: tokens.length,
      queue: tokens,
      waitingQueue: waiting,
      currentlyServing: activeServing,
      summary: {
        waiting: waiting.length,
        called: called.length,
        inService: inService.length,
        completed: completed.length,
        skipped: skipped.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching queue' });
  }
};

// @desc    Call next token (or call specific token)
// @route   POST /api/tokens/:id/call
// @access  Private (STAFF, ORGANIZATION_ADMIN, SUPER_ADMIN)
export const callToken = async (req, res) => {
  try {
    const { counterId } = req.body;
    const staffId = req.user._id;

    // Determine target counter
    const activeCounterId = counterId || req.user.counterId?._id || req.user.counterId;
    if (!activeCounterId) {
      return res.status(400).json({ success: false, message: 'No counter assigned to staff or provided in request' });
    }

    const counter = await Counter.findById(activeCounterId);
    if (!counter) {
      return res.status(404).json({ success: false, message: 'Assigned counter not found' });
    }

    // Atomic update: only transition if status is currently WAITING or SKIPPED
    const token = await Token.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ['WAITING', 'SKIPPED'] }
      },
      {
        status: 'CALLED',
        counterId: counter._id,
        staffId: staffId,
        calledByStaffId: staffId,
        calledAt: new Date()
      },
      { new: true }
    )
      .populate('organizationId', 'name')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name prefix')
      .populate('counterId', 'name counterNumber')
      .populate('staffId', 'name');

    if (!token) {
      const existing = await Token.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Token not found' });
      }
      return res.status(400).json({
        success: false,
        message: `Token ${existing.tokenNumber} is already in status '${existing.status}' and cannot be called.`
      });
    }

    // Update counter status
    counter.status = 'busy';
    counter.currentTokenId = token._id;
    await counter.save();

    // Log QueueEvent
    await QueueEvent.create({
      organizationId: token.organizationId?._id || token.organizationId,
      departmentId: token.departmentId?._id || token.departmentId,
      serviceId: token.serviceId?._id || token.serviceId,
      tokenId: token._id,
      counterId: counter._id,
      action: 'token_called',
      performedBy: staffId,
      details: { tokenNumber: token.tokenNumber, counterNumber: counter.counterNumber }
    });

    // Socket broadcast
    emitQueueUpdate({
      organizationId: token.organizationId?._id || token.organizationId,
      departmentId: token.departmentId?._id || token.departmentId,
      eventName: 'token_called',
      payload: { token, counterNumber: counter.counterNumber }
    });

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} called to Counter ${counter.counterNumber}`,
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error calling token' });
  }
};

// @desc    Recall token (re-announce token to counter)
// @route   POST /api/tokens/:id/recall
// @access  Private (STAFF, ORGANIZATION_ADMIN, SUPER_ADMIN)
export const recallToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('counterId', 'name counterNumber')
      .populate('serviceId', 'name prefix');

    if (!token || (token.status !== 'CALLED' && token.status !== 'IN_SERVICE')) {
      return res.status(400).json({ success: false, message: 'Token is not currently called or in service' });
    }

    token.calledAt = new Date();
    await token.save();

    await QueueEvent.create({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      serviceId: token.serviceId,
      tokenId: token._id,
      counterId: token.counterId?._id,
      action: 'token_recalled',
      performedBy: req.user._id,
      details: { tokenNumber: token.tokenNumber }
    });

    emitQueueUpdate({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      eventName: 'token_recalled',
      payload: { token, counterNumber: token.counterId?.counterNumber }
    });

    res.status(200).json({
      success: true,
      message: `Recalled token ${token.tokenNumber}`,
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error recalling token' });
  }
};

// @desc    Start service for a token
// @route   POST /api/tokens/:id/start
// @access  Private (STAFF, ORGANIZATION_ADMIN, SUPER_ADMIN)
export const startService = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token || token.status !== 'CALLED') {
      return res.status(400).json({ success: false, message: 'Token must be CALLED before starting service' });
    }

    token.status = 'IN_SERVICE';
    token.serviceStartedAt = new Date();
    token.servedByStaffId = req.user._id;
    await token.save();

    await QueueEvent.create({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      serviceId: token.serviceId,
      tokenId: token._id,
      counterId: token.counterId,
      action: 'service_started',
      performedBy: req.user._id
    });

    emitQueueUpdate({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      eventName: 'service_started',
      payload: { token }
    });

    res.status(200).json({
      success: true,
      message: `Started service for token ${token.tokenNumber}`,
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error starting service' });
  }
};

// @desc    Complete service for a token
// @route   POST /api/tokens/:id/complete
// @access  Private (STAFF, ORGANIZATION_ADMIN, SUPER_ADMIN)
export const completeService = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token || (token.status !== 'IN_SERVICE' && token.status !== 'CALLED')) {
      return res.status(400).json({ success: false, message: 'Token must be CALLED or IN_SERVICE to complete' });
    }

    token.status = 'COMPLETED';
    token.completedAt = new Date();
    if (!token.servedByStaffId) {
      token.servedByStaffId = req.user._id;
    }
    await token.save();

    // Reset counter status to available
    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, {
        status: 'available',
        currentTokenId: null
      });
    }

    await QueueEvent.create({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      serviceId: token.serviceId,
      tokenId: token._id,
      counterId: token.counterId,
      action: 'service_completed',
      performedBy: req.user._id
    });

    emitQueueUpdate({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      eventName: 'service_completed',
      payload: { token }
    });

    res.status(200).json({
      success: true,
      message: `Completed service for token ${token.tokenNumber}`,
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error completing service' });
  }
};

// @desc    Skip a token
// @route   POST /api/tokens/:id/skip
// @access  Private (STAFF, ORGANIZATION_ADMIN, SUPER_ADMIN)
export const skipToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token || (token.status !== 'CALLED' && token.status !== 'WAITING')) {
      return res.status(400).json({ success: false, message: 'Token cannot be skipped in current status' });
    }

    token.status = 'SKIPPED';
    token.skippedAt = new Date();
    await token.save();

    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, {
        status: 'available',
        currentTokenId: null
      });
    }

    await QueueEvent.create({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      serviceId: token.serviceId,
      tokenId: token._id,
      counterId: token.counterId,
      action: 'token_skipped',
      performedBy: req.user._id
    });

    emitQueueUpdate({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      eventName: 'token_skipped',
      payload: { token }
    });

    res.status(200).json({
      success: true,
      message: `Skipped token ${token.tokenNumber}`,
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error skipping token' });
  }
};

// @desc    Transfer token to another service / counter
// @route   POST /api/tokens/:id/transfer
// @access  Private (STAFF, ORGANIZATION_ADMIN, SUPER_ADMIN)
export const transferToken = async (req, res) => {
  try {
    const { targetServiceId, notes } = req.body;
    const currentToken = await Token.findById(req.params.id);

    if (!currentToken) {
      return res.status(404).json({ success: false, message: 'Original token not found' });
    }

    const targetService = await Service.findById(targetServiceId);
    if (!targetService) {
      return res.status(400).json({ success: false, message: 'Target transfer service not found' });
    }

    // Mark current token TRANSFERRED
    currentToken.status = 'TRANSFERRED';
    await currentToken.save();

    if (currentToken.counterId) {
      await Counter.findByIdAndUpdate(currentToken.counterId, {
        status: 'available',
        currentTokenId: null
      });
    }

    // Generate new token for target service
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const sequence = await getNextTokenSequence(currentToken.organizationId, targetService._id, dateStr);
    const tokenNumber = formatTokenNumber(targetService.prefix, sequence);

    const { peopleAhead, estimatedWaitTimeMinutes } = await calculateWaitTime(
      currentToken.organizationId,
      targetService.departmentId,
      targetService._id,
      sequence,
      currentToken.priorityWeight
    );

    const newToken = await Token.create({
      organizationId: currentToken.organizationId,
      departmentId: targetService.departmentId,
      serviceId: targetService._id,
      tokenNumber,
      tokenSequence: sequence,
      status: 'WAITING',
      priority: currentToken.priority,
      priorityWeight: currentToken.priorityWeight,
      customerName: currentToken.customerName,
      customerPhone: currentToken.customerPhone,
      customerUserId: currentToken.customerUserId,
      estimatedWaitTime: estimatedWaitTimeMinutes,
      transferredFromTokenId: currentToken._id,
      notes: notes || `Transferred from ${currentToken.tokenNumber}`
    });

    await QueueEvent.create({
      organizationId: currentToken.organizationId,
      departmentId: currentToken.departmentId,
      serviceId: currentToken.serviceId,
      tokenId: currentToken._id,
      action: 'token_transferred',
      performedBy: req.user._id,
      details: { newTokenNumber: tokenNumber, targetService: targetService.name }
    });

    const populatedNewToken = await Token.findById(newToken._id)
      .populate('departmentId', 'name')
      .populate('serviceId', 'name prefix');

    emitQueueUpdate({
      organizationId: currentToken.organizationId,
      departmentId: targetService.departmentId,
      eventName: 'token_transferred',
      payload: { oldToken: currentToken, newToken: populatedNewToken }
    });

    res.status(200).json({
      success: true,
      message: `Token transferred to ${targetService.name} as ${tokenNumber}`,
      newToken: populatedNewToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error transferring token' });
  }
};

// @desc    Get current customer's tokens (active & history)
// @route   GET /api/tokens/my-tokens
// @access  Private (CUSTOMER, STAFF, ADMIN)
export const getMyTokens = async (req, res) => {
  try {
    const userId = req.user._id;
    const userPhone = req.user.phone;

    const query = {
      $or: [
        { customerUserId: userId },
        ...(userPhone ? [{ customerPhone: userPhone }] : [])
      ]
    };

    const tokens = await Token.find(query)
      .populate('organizationId', 'name type address phone logo')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name prefix estimatedServiceTime')
      .populate('counterId', 'name counterNumber status')
      .sort({ createdAt: -1 });

    const populated = await Promise.all(tokens.map(async (t) => {
      const doc = t.toObject();
      if (t.status === 'WAITING') {
        const waitCalc = await calculateWaitTime(
          t.organizationId?._id || t.organizationId,
          t.departmentId?._id || t.departmentId,
          t.serviceId?._id || t.serviceId,
          t.tokenSequence,
          t.priorityWeight
        );
        doc.peopleAhead = waitCalc.peopleAhead;
        doc.estimatedWaitTime = waitCalc.estimatedWaitTimeMinutes;
        doc.queuePosition = waitCalc.peopleAhead + 1;
      }
      return doc;
    }));

    const activeTokens = populated.filter(t => ['WAITING', 'CALLED', 'IN_SERVICE'].includes(t.status));
    const previousTokens = populated.filter(t => ['COMPLETED', 'SKIPPED', 'CANCELLED'].includes(t.status));

    res.status(200).json({
      success: true,
      count: tokens.length,
      activeTokens,
      previousTokens,
      tokens: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customer tokens'
    });
  }
};

// @desc    Cancel an active token
// @route   POST /api/tokens/:id/cancel
// @access  Public / Customer Private
export const cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (token.status !== 'WAITING') {
      return res.status(400).json({
        success: false,
        message: `Token in status '${token.status}' cannot be cancelled`
      });
    }

    // Verify ownership if authenticated as customer
    if (req.user && req.user.role === 'CUSTOMER') {
      const isOwner = (token.customerUserId && token.customerUserId.toString() === req.user._id.toString()) ||
                      (token.customerPhone === req.user.phone);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this token' });
      }
    }

    token.status = 'CANCELLED';
    await token.save();

    await QueueEvent.create({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      serviceId: token.serviceId,
      tokenId: token._id,
      action: 'token_cancelled',
      performedBy: req.user?._id || null,
      details: { tokenNumber: token.tokenNumber }
    });

    emitQueueUpdate({
      organizationId: token.organizationId,
      departmentId: token.departmentId,
      eventName: 'token_cancelled',
      payload: { token, tokenId: token._id }
    });

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} has been successfully cancelled`,
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling token'
    });
  }
};

