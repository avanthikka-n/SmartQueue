import Service from '../models/Service.js';
import Department from '../models/Department.js';

// @desc    Get services by department / organization / facility
// @route   GET /api/services
// @access  Public / Private
export const getServices = async (req, res) => {
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

    const services = await Service.find(query)
      .populate('departmentId', 'name isPaused pauseReason')
      .populate('facilityId', 'name address')
      .populate('nextServiceId', 'name prefix')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching services'
    });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const createService = async (req, res) => {
  try {
    const {
      departmentId,
      facilityId,
      name,
      description,
      prefix,
      estimatedServiceTime,
      priorityEnabled,
      appointmentEnabled,
      dailyTokenLimit,
      workingHours,
      nextServiceId
    } = req.body;

    const organizationId = req.body.organizationId || req.user.organizationId;

    if (!departmentId || !name || !prefix) {
      return res.status(400).json({
        success: false,
        message: 'Department ID, service name, and token prefix are required'
      });
    }

    // Resolve facilityId from department if not directly provided
    let targetFacilityId = facilityId;
    if (!targetFacilityId) {
      const dept = await Department.findById(departmentId);
      if (dept && dept.facilityId) {
        targetFacilityId = dept.facilityId;
      }
    }

    const service = await Service.create({
      organizationId,
      departmentId,
      facilityId: targetFacilityId || null,
      name: name.trim(),
      description: description || '',
      prefix: prefix.trim().toUpperCase(),
      estimatedServiceTime: Number(estimatedServiceTime) || 10,
      priorityEnabled: priorityEnabled !== undefined ? priorityEnabled : true,
      appointmentEnabled: appointmentEnabled !== undefined ? appointmentEnabled : true,
      dailyTokenLimit: Number(dailyTokenLimit) || 0,
      workingHours: workingHours || { open: '08:00', close: '18:00' },
      nextServiceId: nextServiceId || null
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Service '${req.body.name?.trim()}' already exists in this department`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating service'
    });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const updateService = async (req, res) => {
  try {
    const {
      name,
      description,
      prefix,
      facilityId,
      estimatedServiceTime,
      priorityEnabled,
      appointmentEnabled,
      dailyTokenLimit,
      workingHours,
      nextServiceId,
      isActive
    } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && String(service.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot edit another organization\'s service' });
    }

    if (name) service.name = name.trim();
    if (description !== undefined) service.description = description;
    if (prefix) service.prefix = prefix.trim().toUpperCase();
    if (facilityId !== undefined) service.facilityId = facilityId;
    if (estimatedServiceTime !== undefined) service.estimatedServiceTime = Number(estimatedServiceTime);
    if (priorityEnabled !== undefined) service.priorityEnabled = priorityEnabled;
    if (appointmentEnabled !== undefined) service.appointmentEnabled = appointmentEnabled;
    if (dailyTokenLimit !== undefined) service.dailyTokenLimit = Number(dailyTokenLimit);
    if (workingHours) service.workingHours = { ...service.workingHours, ...workingHours };
    if (nextServiceId !== undefined) service.nextServiceId = nextServiceId || null;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Service '${req.body.name?.trim()}' already exists in this department`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating service'
    });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && String(service.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another organization\'s service' });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting service'
    });
  }
};
