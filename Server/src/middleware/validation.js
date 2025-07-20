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
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('mdaId')
    .isMongoId()
    .withMessage('Please provide a valid MDA ID'),
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
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('mdaId')
    .isMongoId()
    .withMessage('Please provide a valid MDA ID'),
  handleValidationErrors
];

// MDA creation validation
export const validateMDACreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('MDA name must be between 2 and 100 characters'),
  body('reportUrl')
    .isURL()
    .withMessage('Please provide a valid URL'),
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