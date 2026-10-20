import TokenSequence from '../models/TokenSequence.js';
import Token from '../models/Token.js';
import Service from '../models/Service.js';
import QueueEvent from '../models/QueueEvent.js';

// Get priority weight value
export const getPriorityWeight = (priority) => {
  switch (priority) {
    case 'EMERGENCY':
      return 100;
    case 'VIP':
      return 80;
    case 'SENIOR_CITIZEN':
    case 'ELDERLY':
    case 'PREGNANT':
    case 'DISABLED':
      return 60;
    case 'APPOINTMENT':
    case 'PRIORITY':
      return 40;
    case 'NORMAL':
    default:
      return 10;
  }
};

// Format token number string (e.g. A-001, C-042, MED-103)
export const formatTokenNumber = (prefix, sequence) => {
  const p = (prefix || 'T').toUpperCase().trim();
  const padded = String(sequence).padStart(3, '0');
  return `${p}-${padded}`;
};

// Generate atomic next token sequence for department/service on a given date (Concurrency Safe)
export const getNextTokenSequence = async (organizationId, serviceOrDeptId, dateStr, isDepartment = false) => {
  const filter = isDepartment
    ? { organizationId, departmentId: serviceOrDeptId, dateStr }
    : { organizationId, serviceId: serviceOrDeptId, dateStr };
  const update = { $inc: { lastSequence: 1 } };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const seqDoc = await TokenSequence.findOneAndUpdate(filter, update, options);
  return seqDoc.lastSequence;
};

// Calculate estimated wait time for a new token or existing token
export const calculateWaitTime = async (organizationId, departmentId, serviceId, tokenSequence, priorityWeight) => {
  try {
    const service = await Service.findById(serviceId);
    const avgServiceTime = service?.estimatedServiceTime || 10;

    // Count people ahead in the same department/service who are WAITING
    const peopleAheadCount = await Token.countDocuments({
      organizationId,
      departmentId,
      status: 'WAITING',
      $or: [
        { priorityWeight: { $gt: priorityWeight } },
        { priorityWeight: priorityWeight, tokenSequence: { $lt: tokenSequence } }
      ]
    });

    return {
      peopleAhead: peopleAheadCount,
      estimatedWaitTimeMinutes: peopleAheadCount * avgServiceTime
    };
  } catch (error) {
    console.error('[Wait Time Calc Error]', error);
    return { peopleAhead: 0, estimatedWaitTimeMinutes: 10 };
  }
};

// Queue Sorting Algorithm with Starvation Prevention (supports both direct Array and DB query)
export const getSortedQueue = (input) => {
  const now = Date.now();
  const STARVATION_THRESHOLD_MS = 30 * 60 * 1000; // 30 mins

  // Helper to sort a list of token objects
  const sortTokenList = (tokensList) => {
    const processedTokens = tokensList.map((t) => {
      const tokenObj = typeof t.toObject === 'function' ? t.toObject() : { ...t };
      const waitDuration = now - new Date(tokenObj.createdAt || now).getTime();

      if (waitDuration > STARVATION_THRESHOLD_MS && tokenObj.priority === 'NORMAL') {
        tokenObj.effectiveWeight = (tokenObj.priorityWeight || 10) + 50; // Anti-starvation boost
      } else {
        tokenObj.effectiveWeight = tokenObj.priorityWeight !== undefined ? tokenObj.priorityWeight : getPriorityWeight(tokenObj.priority);
      }
      return tokenObj;
    });

    processedTokens.sort((a, b) => {
      if (b.effectiveWeight !== a.effectiveWeight) {
        return b.effectiveWeight - a.effectiveWeight;
      }
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    return processedTokens;
  };

  // If input is an Array, sort synchronously
  if (Array.isArray(input)) {
    return sortTokenList(input);
  }

  // Otherwise, if input is query options, fetch from DB asynchronously
  return (async () => {
    const { organizationId, departmentId, serviceId, status = 'WAITING' } = input || {};
    let query = { status };
    if (organizationId) query.organizationId = organizationId;
    if (departmentId) query.departmentId = departmentId;
    if (serviceId) query.serviceId = serviceId;

    const tokens = await Token.find(query)
      .populate('serviceId', 'name prefix estimatedServiceTime')
      .populate('departmentId', 'name')
      .populate('counterId', 'name counterNumber')
      .populate('staffId', 'name')
      .sort({ priorityWeight: -1, createdAt: 1 });

    return sortTokenList(tokens);
  })();
};
