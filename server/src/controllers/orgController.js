import Organization from '../models/Organization.js';

// @desc    Get all active organizations (or all for SUPER_ADMIN)
// @route   GET /api/organizations
// @access  Public / Private
export const getOrganizations = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = { isActive: true };

    if (req.user && req.user.role === 'SUPER_ADMIN') {
      delete query.isActive; // SUPER_ADMIN sees active & inactive
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const organizations = await Organization.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: organizations.length,
      organizations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching organizations'
    });
  }
};

// @desc    Get single organization details
// @route   GET /api/organizations/:id
// @access  Public
export const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching organization'
    });
  }
};

// @desc    Create new organization
// @route   POST /api/organizations
// @access  Private (SUPER_ADMIN / ORGANIZATION_ADMIN)
export const createOrganization = async (req, res) => {
  try {
    const { name, type, description, address, phone, email, settings } = req.body;

    const organization = await Organization.create({
      name,
      type: type || 'other',
      description,
      address,
      phone,
      email,
      settings: settings || {}
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating organization'
    });
  }
};

// @desc    Update organization details & settings
// @route   PUT /api/organizations/:id
// @access  Private (ORGANIZATION_ADMIN / SUPER_ADMIN)
export const updateOrganization = async (req, res) => {
  try {
    const { name, type, description, address, phone, email, settings, isActive } = req.body;

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    if (name) organization.name = name;
    if (type) organization.type = type;
    if (description !== undefined) organization.description = description;
    if (address !== undefined) organization.address = address;
    if (phone !== undefined) organization.phone = phone;
    if (email !== undefined) organization.email = email;
    if (settings) organization.settings = { ...organization.settings, ...settings };
    if (isActive !== undefined && req.user.role === 'SUPER_ADMIN') {
      organization.isActive = isActive;
    }

    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating organization'
    });
  }
};
