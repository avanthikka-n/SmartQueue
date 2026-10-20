import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Facility from '../models/Facility.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, role, organizationId, orgName, orgType, orgAddress, address } = req.body;

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    let assignedOrgId = organizationId || null;
    let primaryFacilityId = null;

    // Inline Organization creation for ORGANIZATION_ADMIN registration
    if (role === 'ORGANIZATION_ADMIN' && orgName && !organizationId) {
      const newOrg = await Organization.create({
        name: orgName.trim(),
        type: orgType || 'other',
        address: orgAddress || address || '',
        email: email.toLowerCase(),
        phone: phone || ''
      });
      assignedOrgId = newOrg._id;

      // Automatically create the initial default Facility for the organization
      const primaryFacility = await Facility.create({
        organizationId: newOrg._id,
        name: `${newOrg.name} (Main Facility)`,
        type: newOrg.type || 'other',
        address: newOrg.address || '',
        phone: newOrg.phone || '',
        email: newOrg.email || ''
      });
      primaryFacilityId = primaryFacility._id;
    }

    // Default role assignment
    const userRole = role || 'CUSTOMER';

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone ? phone.trim() : '',
      password,
      role: userRole,
      organizationId: assignedOrgId,
      facilityId: primaryFacilityId
    });

    const token = generateToken({
      id: user._id,
      role: user.role,
      organizationId: user.organizationId,
      facilityId: user.facilityId
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        facilityId: user.facilityId,
        departmentId: user.departmentId,
        counterId: user.counterId
      }
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during user registration'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email (include password field for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('organizationId', 'name type logo');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      organizationId: user.organizationId?._id || user.organizationId,
      facilityId: user.facilityId?._id || user.facilityId
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        facilityId: user.facilityId,
        departmentId: user.departmentId,
        counterId: user.counterId
      }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('organizationId', 'name type logo address settings')
      .populate('facilityId', 'name type address phone email workingHours')
      .populate('departmentId', 'name isPaused workingHours dailyTokenLimit')
      .populate('counterId', 'name counterNumber status');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};
