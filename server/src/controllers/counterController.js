import Counter from '../models/Counter.js';
import Department from '../models/Department.js';

// @desc    Get counters by department / organization / facility
// @route   GET /api/counters
// @access  Public / Private
export const getCounters = async (req, res) => {
  try {
    const { departmentId, organizationId, facilityId } = req.query;
    let query = {};

    if (departmentId) query.departmentId = departmentId;
    if (facilityId) query.facilityId = facilityId;
    if (organizationId || req.user?.organizationId) {
      query.organizationId = organizationId || req.user?.organizationId;
    }

    if (!req.user || (req.user.role !== 'ORGANIZATION_ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      query.isActive = true;
    }

    const counters = await Counter.find(query)
      .populate('departmentId', 'name')
      .populate('facilityId', 'name')
      .populate('assignedStaff', 'name email phone')
      .populate('currentTokenId', 'tokenNumber status customerName')
      .sort({ counterNumber: 1 });

    res.status(200).json({
      success: true,
      count: counters.length,
      counters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching counters'
    });
  }
};

// @desc    Create a new counter
// @route   POST /api/counters
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const createCounter = async (req, res) => {
  try {
    const { departmentId, facilityId, name, counterNumber, assignedStaff } = req.body;
    const organizationId = req.body.organizationId || req.user.organizationId;

    if (!departmentId || !name || counterNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Department ID, counter name, and counter number are required'
      });
    }

    // Resolve facilityId from department if not specified
    let targetFacilityId = facilityId;
    if (!targetFacilityId) {
      const dept = await Department.findById(departmentId);
      if (dept && dept.facilityId) {
        targetFacilityId = dept.facilityId;
      }
    }

    const existing = await Counter.findOne({
      organizationId,
      departmentId,
      counterNumber: Number(counterNumber)
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Counter #${counterNumber} already exists in this department`
      });
    }

    const counter = await Counter.create({
      organizationId,
      facilityId: targetFacilityId || null,
      departmentId,
      name: name.trim(),
      counterNumber: Number(counterNumber),
      assignedStaff: assignedStaff || []
    });

    res.status(201).json({
      success: true,
      message: 'Counter created successfully',
      counter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating counter'
    });
  }
};

// @desc    Update counter details / assigned staff / status
// @route   PUT /api/counters/:id
// @access  Private (STAFF, ORGANIZATION_ADMIN, SUPER_ADMIN)
export const updateCounter = async (req, res) => {
  try {
    const { name, counterNumber, facilityId, assignedStaff, status, isActive } = req.body;

    const counter = await Counter.findById(req.params.id);
    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    if (name) counter.name = name.trim();
    if (counterNumber !== undefined) counter.counterNumber = Number(counterNumber);
    if (facilityId !== undefined) counter.facilityId = facilityId;
    if (assignedStaff !== undefined) counter.assignedStaff = assignedStaff;
    if (status) counter.status = status;
    if (isActive !== undefined) counter.isActive = isActive;

    await counter.save();

    res.status(200).json({
      success: true,
      message: 'Counter updated successfully',
      counter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating counter'
    });
  }
};

// @desc    Delete a counter
// @route   DELETE /api/counters/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const deleteCounter = async (req, res) => {
  try {
    const counter = await Counter.findById(req.params.id);
    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    await Counter.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Counter deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting counter'
    });
  }
};
