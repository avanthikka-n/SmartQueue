import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect middleware - Verifies JWT Token (Required)
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token validation failed'
    });
  }
};

// Optional Protect middleware - Attaches req.user if Bearer token is provided, without failing if absent
export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Continue without req.user if token is invalid
    next();
  }
};

// Role Authorization Middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to perform this action`
      });
    }

    next();
  };
};

// Organization Access Isolation Middleware
export const requireOrgAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // SUPER_ADMIN has platform-wide access
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const targetOrgId = req.params.organizationId ||
    req.body.organizationId ||
    req.query.organizationId ||
    (req.baseUrl && req.baseUrl.includes('organizations') ? req.params.id : null);

  if (targetOrgId && req.user.organizationId) {
    if (targetOrgId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot access data outside your assigned organization'
      });
    }
  }

  next();
};
