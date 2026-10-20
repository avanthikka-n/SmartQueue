import Department from '../models/Department.js';
import Service from '../models/Service.js';
import Counter from '../models/Counter.js';
import Facility from '../models/Facility.js';

// @desc    Get departments for an organization
// @route   GET /api/departments
// @access  Public (with ?organizationId) / Private (derived from req.user.organizationId)
export const getDepartments = async (req, res) => {
  try {
    const organizationId = req.query.organizationId || (req.user && req.user.organizationId);
    const { facilityId } = req.query;

    if (!organizationId && (!req.user || req.user.role !== 'SUPER_ADMIN')) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    const query = {};
    if (organizationId) {
      query.organizationId = organizationId;
    }

    if (facilityId) {
      query.facilityId = facilityId;
    }

    if (!req.user || (req.user.role !== 'ORGANIZATION_ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      query.isActive = true;
    }

    const departments = await Department.find(query)
      .populate('facilityId', 'name address')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching departments'
    });
  }
};

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const createDepartment = async (req, res) => {
  try {
    const {
      name,
      description,
      facilityId,
      workingHours,
      dailyTokenLimit,
      noShowTimeoutSeconds
    } = req.body;
    const organizationId = req.body.organizationId || req.user.organizationId;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    // Determine target facility
    let targetFacilityId = facilityId;
    if (!targetFacilityId) {
      const defaultFacility = await Facility.findOne({ organizationId });
      if (defaultFacility) {
        targetFacilityId = defaultFacility._id;
      }
    }

    const existing = await Department.findOne({
      organizationId,
      ...(targetFacilityId ? { facilityId: targetFacilityId } : {}),
      name: name.trim()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Department '${name.trim()}' already exists in this organization facility`
      });
    }

    const department = await Department.create({
      organizationId,
      facilityId: targetFacilityId || null,
      name: name.trim(),
      description: description || '',
      workingHours: workingHours || { open: '08:00', close: '18:00' },
      dailyTokenLimit: Number(dailyTokenLimit) || 0,
      noShowTimeoutSeconds: noShowTimeoutSeconds !== undefined && noShowTimeoutSeconds !== null ? Number(noShowTimeoutSeconds) : null
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Department '${req.body.name?.trim()}' already exists in this organization`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating department'
    });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const updateDepartment = async (req, res) => {
  try {
    const {
      name,
      description,
      facilityId,
      workingHours,
      dailyTokenLimit,
      noShowTimeoutSeconds,
      isPaused,
      pauseReason,
      isActive
    } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && String(department.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot update another organization\'s department' });
    }

    if (name && name.trim() !== department.name) {
      const existing = await Department.findOne({
        organizationId: department.organizationId,
        facilityId: facilityId || department.facilityId,
        name: name.trim(),
        _id: { $ne: department._id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Department '${name.trim()}' already exists in this facility`
        });
      }
      department.name = name.trim();
    }

    if (description !== undefined) department.description = description;
    if (facilityId !== undefined) department.facilityId = facilityId;
    if (workingHours) department.workingHours = { ...department.workingHours, ...workingHours };
    if (dailyTokenLimit !== undefined) department.dailyTokenLimit = Number(dailyTokenLimit);
    if (noShowTimeoutSeconds !== undefined) department.noShowTimeoutSeconds = noShowTimeoutSeconds === null ? null : Number(noShowTimeoutSeconds);
    if (isPaused !== undefined) department.isPaused = isPaused;
    if (pauseReason !== undefined) department.pauseReason = pauseReason;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Department '${req.body.name?.trim()}' already exists in this organization`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating department'
    });
  }
};

// @desc    Toggle department queue pause status
// @route   PATCH /api/departments/:id/pause
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const toggleDepartmentPause = async (req, res) => {
  try {
    const { isPaused, pauseReason } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && String(department.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot update another organization\'s department' });
    }

    department.isPaused = isPaused !== undefined ? Boolean(isPaused) : !department.isPaused;
    if (pauseReason !== undefined) {
      department.pauseReason = pauseReason;
    }

    await department.save();

    res.status(200).json({
      success: true,
      message: `Department queue ${department.isPaused ? 'paused' : 'resumed'} successfully`,
      department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating department pause state'
    });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && String(department.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another organization\'s department' });
    }

    // Check if services or counters exist under this department
    const servicesCount = await Service.countDocuments({ departmentId: department._id });
    if (servicesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${servicesCount} associated service(s). Please delete services first.`
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting department'
    });
  }
};
