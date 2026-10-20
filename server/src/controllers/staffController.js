import User from '../models/User.js';
import Counter from '../models/Counter.js';
import Department from '../models/Department.js';

// @desc    Get staff accounts for an organization
// @route   GET /api/staff
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const getStaff = async (req, res) => {
  try {
    const organizationId = req.query.organizationId || req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    // Tenant isolation: if not SUPER_ADMIN, ensure admin can only query their own org
    if (req.user.role !== 'SUPER_ADMIN' && req.user.organizationId?.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view staff outside your organization'
      });
    }

    const { facilityId } = req.query;
    const staffQuery = {
      organizationId,
      role: 'STAFF'
    };
    if (facilityId) staffQuery.facilityId = facilityId;

    const staff = await User.find(staffQuery)
      .populate('departmentId', 'name')
      .populate('facilityId', 'name address')
      .populate('counterId', 'name counterNumber status')
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching staff accounts'
    });
  }
};

// @desc    Get single staff member details
// @route   GET /api/staff/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const getStaffById = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id)
      .populate('departmentId', 'name')
      .populate('facilityId', 'name address')
      .populate('counterId', 'name counterNumber status')
      .select('-password');

    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && staff.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cross-organization staff access not allowed' });
    }

    res.status(200).json({
      success: true,
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching staff member'
    });
  }
};

// @desc    Create a staff user account
// @route   POST /api/staff
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, facilityId, departmentId, counterId, designation } = req.body;
    const organizationId = req.body.organizationId || req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    if (req.user.role !== 'SUPER_ADMIN' && req.user.organizationId?.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot register staff for another organization'
      });
    }

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone number, and password are required'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Determine target facility
    let targetFacilityId = facilityId;
    if (!targetFacilityId && departmentId) {
      const dept = await Department.findById(departmentId);
      if (dept && dept.facilityId) {
        targetFacilityId = dept.facilityId;
      }
    }

    // Validate Department belongs to the organization
    if (departmentId) {
      const dept = await Department.findOne({ _id: departmentId, organizationId });
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: 'Selected department does not belong to your organization'
        });
      }
    }

    // Validate Counter belongs to the organization and matches department (if department is selected)
    if (counterId) {
      const counterQuery = { _id: counterId, organizationId };
      if (departmentId) {
        counterQuery.departmentId = departmentId;
      }
      const counter = await Counter.findOne(counterQuery);
      if (!counter) {
        return res.status(400).json({
          success: false,
          message: 'Selected counter is invalid or does not belong to the selected department/organization'
        });
      }
    }

    const staff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: 'STAFF',
      organizationId,
      facilityId: targetFacilityId || null,
      departmentId: departmentId || null,
      counterId: counterId || null,
      designation: designation ? designation.trim() : '',
      isActive: true
    });

    // If counter assigned, link to counter's assignedStaff list
    if (counterId) {
      await Counter.findByIdAndUpdate(counterId, {
        $addToSet: { assignedStaff: staff._id }
      });
    }

    // Return created staff details, strictly excluding the password hash
    const populatedStaff = await User.findById(staff._id)
      .populate('departmentId', 'name')
      .populate('facilityId', 'name address')
      .populate('counterId', 'name counterNumber status')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'Staff account registered successfully',
      staff: populatedStaff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating staff account'
    });
  }
};

// @desc    Update staff user profile / department / counter assignment
// @route   PUT /api/staff/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const updateStaff = async (req, res) => {
  try {
    const { name, phone, facilityId, departmentId, counterId, designation, isActive } = req.body;

    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    // Prevent cross-organization updates
    if (req.user.role !== 'SUPER_ADMIN' && staff.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot modify staff from another organization'
      });
    }

    const targetDeptId = departmentId !== undefined ? (departmentId || null) : staff.departmentId;

    // Validate Department belongs to staff's organization
    if (departmentId) {
      const dept = await Department.findOne({ _id: departmentId, organizationId: staff.organizationId });
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: 'Selected department does not belong to this organization'
        });
      }
    }

    // Validate Counter belongs to staff's organization and department
    if (counterId) {
      const counterQuery = { _id: counterId, organizationId: staff.organizationId };
      if (targetDeptId) {
        counterQuery.departmentId = targetDeptId;
      }
      const counter = await Counter.findOne(counterQuery);
      if (!counter) {
        return res.status(400).json({
          success: false,
          message: 'Selected counter does not belong to the assigned department/organization'
        });
      }
    }

    if (name) staff.name = name.trim();
    if (phone) staff.phone = phone.trim();
    if (facilityId !== undefined) staff.facilityId = facilityId || null;
    if (designation !== undefined) staff.designation = designation ? designation.trim() : '';
    if (departmentId !== undefined) staff.departmentId = departmentId || null;

    // Handle counter re-assignment
    if (counterId !== undefined && counterId !== staff.counterId?.toString()) {
      if (staff.counterId) {
        await Counter.findByIdAndUpdate(staff.counterId, {
          $pull: { assignedStaff: staff._id }
        });
      }
      if (counterId) {
        await Counter.findByIdAndUpdate(counterId, {
          $addToSet: { assignedStaff: staff._id }
        });
      }
      staff.counterId = counterId || null;
    }

    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    const populatedStaff = await User.findById(staff._id)
      .populate('departmentId', 'name')
      .populate('facilityId', 'name address')
      .populate('counterId', 'name counterNumber status')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Staff account updated successfully',
      staff: populatedStaff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating staff account'
    });
  }
};

// @desc    Activate or deactivate a staff account
// @route   PATCH /api/staff/:id/status
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const toggleStaffStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && staff.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot change status of staff from another organization'
      });
    }

    staff.isActive = isActive !== undefined ? isActive : !staff.isActive;
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Staff account ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        isActive: staff.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling staff status'
    });
  }
};

// @desc    Delete a staff account
// @route   DELETE /api/staff/:id
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && staff.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot delete staff from another organization'
      });
    }

    if (staff.counterId) {
      await Counter.findByIdAndUpdate(staff.counterId, {
        $pull: { assignedStaff: staff._id }
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Staff account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting staff account'
    });
  }
};

// @desc    Reset a staff account password (admin-initiated)
// @route   PUT /api/staff/:id/reset-password
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const resetStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const staff = await User.findById(req.params.id).select('+password');
    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    // Org isolation: prevent cross-org password reset (SUPER_ADMIN bypasses)
    if (req.user.role !== 'SUPER_ADMIN') {
      const adminOrgId = req.user.organizationId?.toString();
      const staffOrgId = staff.organizationId?.toString();
      if (adminOrgId !== staffOrgId) {
        return res.status(403).json({ success: false, message: 'Access denied: Cross-organization reset not allowed' });
      }
    }

    staff.password = newPassword; // pre-save hook will hash it
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${staff.name}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error resetting staff password'
    });
  }
};
