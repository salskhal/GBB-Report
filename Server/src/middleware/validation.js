import { body, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User login validation
export const validateUserLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, dots, underscores, and hyphens'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// Admin login validation
export const validateAdminLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// User creation validation
export const validateUserCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, dots, underscores, and hyphens'),
  body('contactEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('mdaReference')
    .trim()
    .isLength({ min: 1 })
    .withMessage('MDA reference is required'),
  handleValidationErrors
];

// MDA creation validation
export const validateMDACreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('MDA name must be between 2 and 100 characters'),
  body('reports')
    .isArray({ min: 1 })
    .withMessage('At least one report is required'),
  body('reports.*.title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Report title must be between 1 and 100 characters'),
  body('reports.*.url')
    .isURL()
    .withMessage('Please provide a valid report URL'),
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required'),
  handleValidationErrors
];

// Default export object for backward compatibility
export default {
  validateUserLogin,
  validateAdminLogin,
  validateUserCreation,
  validateMDACreation,
  validatePasswordChange,
  handleValidationErrors
};