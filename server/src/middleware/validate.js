/**
 * validate.js — Request body validation middleware
 *
 * Provides lightweight, zero-dependency validation helpers.
 * All validators return Express middleware (req, res, next).
 * Errors are returned as:  { success: false, message: '...', errors: [...] }
 */

// ─── Core helper ─────────────────────────────────────────────────────────────
const validationError = (res, errors) =>
  res.status(422).json({ success: false, message: 'Validation failed', errors });

// ─── Auth validators ──────────────────────────────────────────────────────────
export const validateRegister = (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('Valid email address is required');
  if (!password || password.length < 6)
    errors.push('Password must be at least 6 characters');
  if (confirmPassword !== undefined && password !== confirmPassword)
    errors.push('Passwords do not match');
  if (role && !['CUSTOMER', 'STAFF', 'ORGANIZATION_ADMIN'].includes(role))
    errors.push('Invalid role specified');

  if (errors.length) return validationError(res, errors);
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('Valid email address is required');
  if (!password || password.length < 1)
    errors.push('Password is required');

  if (errors.length) return validationError(res, errors);
  next();
};

// ─── Token generation validator ───────────────────────────────────────────────
export const validateGenerateToken = (req, res, next) => {
  const { serviceId, customerName, customerPhone } = req.body;
  const errors = [];

  if (!serviceId || !serviceId.match(/^[0-9a-fA-F]{24}$/))
    errors.push('Valid serviceId (MongoDB ObjectId) is required');
  if (!customerName || customerName.trim().length < 2)
    errors.push('Customer name must be at least 2 characters');
  if (customerPhone && !/^\+?[\d\s\-().]{7,20}$/.test(customerPhone))
    errors.push('Customer phone number format is invalid');

  if (errors.length) return validationError(res, errors);
  next();
};

// ─── Feedback validator ───────────────────────────────────────────────────────
export const validateFeedback = (req, res, next) => {
  const { tokenId, rating } = req.body;
  const errors = [];

  if (!tokenId || !tokenId.match(/^[0-9a-fA-F]{24}$/))
    errors.push('Valid tokenId (MongoDB ObjectId) is required');
  if (!rating || isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)
    errors.push('Rating must be a number between 1 and 5');

  if (errors.length) return validationError(res, errors);
  next();
};

// ─── Organization validator ───────────────────────────────────────────────────
export const validateOrganization = (req, res, next) => {
  const { name, type } = req.body;
  const errors = [];
  const VALID_TYPES = ['HOSPITAL', 'BANK', 'GOVERNMENT', 'TELECOM', 'RETAIL', 'OTHER'];

  if (!name || name.trim().length < 2)
    errors.push('Organization name must be at least 2 characters');
  if (type && !VALID_TYPES.includes(type))
    errors.push(`Organization type must be one of: ${VALID_TYPES.join(', ')}`);

  if (errors.length) return validationError(res, errors);
  next();
};

// ─── Department validator ─────────────────────────────────────────────────────
export const validateDepartment = (req, res, next) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2)
    return validationError(res, ['Department name must be at least 2 characters']);
  next();
};

// ─── Service validator ────────────────────────────────────────────────────────
export const validateService = (req, res, next) => {
  const { name, prefix, estimatedServiceTime } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push('Service name must be at least 2 characters');
  if (prefix && (prefix.length < 1 || prefix.length > 5))
    errors.push('Service prefix must be 1-5 characters');
  if (estimatedServiceTime !== undefined && (isNaN(Number(estimatedServiceTime)) || Number(estimatedServiceTime) < 1))
    errors.push('Estimated service time must be a positive number (minutes)');

  if (errors.length) return validationError(res, errors);
  next();
};

// ─── Appointment validator ────────────────────────────────────────────────────
export const validateAppointment = (req, res, next) => {
  const { serviceId, customerName, scheduledAt } = req.body;
  const errors = [];

  if (!serviceId || !serviceId.match(/^[0-9a-fA-F]{24}$/))
    errors.push('Valid serviceId is required');
  if (!customerName || customerName.trim().length < 2)
    errors.push('Customer name must be at least 2 characters');
  if (scheduledAt && isNaN(Date.parse(scheduledAt)))
    errors.push('scheduledAt must be a valid ISO date string');

  if (errors.length) return validationError(res, errors);
  next();
};
