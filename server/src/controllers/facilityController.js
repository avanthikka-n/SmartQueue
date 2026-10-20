import Facility from '../models/Facility.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';

// @desc    Get facilities for an organization
// @route   GET /api/facilities
// @access  Public (with ?organizationId) / Private (organization scoped)
export const getFacilities = async (req, res) => {
  try {
    const organizationId = req.query.organizationId || (req.user && req.user.organizationId);
    const { search, type } = req.query;

    let query = {};
    if (organizationId) {
      query.organizationId = organizationId;
    } else if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    if (!req.user || (req.user.role !== 'ORGANIZATION_ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      query.isActive = true;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const facilities = await Facility.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: facilities.length,
      facilities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching facilities'
    });
  }
};

// @desc    Get single facility details
// @route   GET /api/facilities/:id
// @access  Public / Private
export const getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id).populate('organizationId', 'name type address');
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    res.status(200).json({
      success: true,
      facility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching facility'
    });
  }
};

// @desc    Create a new facility
// @route   POST /api/facilities
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const createFacility = async (req, res) => {
  try {
    const { name, type, description, address, phone, email, workingHours } = req.body;
    const organizationId = req.body.organizationId || (req.user && req.user.organizationId);

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Facility name is required' });
    }

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    // Check duplicate facility name within same organization
    const existing = await Facility.findOne({ organizationId, name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Facility '${name.trim()}' already exists in this organization`
      });
    }

    const facility = await Facility.create({
      organizationId,
      name: name.trim(),
      type: type || 'other',
      description: description || '',
      address: address || '',
      phone: phone || '',
      email: email || '',
      workingHours: workingHours || {
        open: '08:00',
        close: '18:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    });

    res.status(201).json({
      success: true,
      message: 'Facility created successfully',
      facility
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Facility '${req.body.name}' already exists in this organization`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating facility'
    });
  }
};

// @desc    Update a facility
// @route   PUT /api/facilities/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const updateFacility = async (req, res) => {
  try {
    const { name, type, description, address, phone, email, workingHours, isActive } = req.body;
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && String(req.user.organizationId) !== String(facility.organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot modify another organization\'s facility' });
    }

    if (name && name.trim() !== facility.name) {
      const existing = await Facility.findOne({
        organizationId: facility.organizationId,
        name: name.trim(),
        _id: { $ne: facility._id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Facility '${name.trim()}' already exists in this organization`
        });
      }
      facility.name = name.trim();
    }

    if (type) facility.type = type;
    if (description !== undefined) facility.description = description;
    if (address !== undefined) facility.address = address;
    if (phone !== undefined) facility.phone = phone;
    if (email !== undefined) facility.email = email;
    if (workingHours) facility.workingHours = { ...facility.workingHours, ...workingHours };
    if (isActive !== undefined) facility.isActive = isActive;

    await facility.save();

    res.status(200).json({
      success: true,
      message: 'Facility updated successfully',
      facility
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Facility '${req.body.name}' already exists in this organization`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating facility'
    });
  }
};

// @desc    Delete / Deactivate a facility
// @route   DELETE /api/facilities/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && String(req.user.organizationId) !== String(facility.organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another organization\'s facility' });
    }

    // Check if departments exist under this facility
    const deptsCount = await Department.countDocuments({ facilityId: facility._id });
    if (deptsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete facility. It has ${deptsCount} associated department(s). Please reassign or delete them first.`
      });
    }

    await Facility.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Facility deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting facility'
    });
  }
};
