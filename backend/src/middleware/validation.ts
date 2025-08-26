import { body, ValidationChain } from 'express-validator';

export const validateRegisterClient: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty/optional
      
      // Remove all non-digit characters except +
      const cleaned = value.replace(/[^\d+]/g, '');
      
      // Must start with + and have at least 10 digits total
      if (!cleaned.startsWith('+')) {
        throw new Error('Phone number must start with country code (e.g., +1, +63)');
      }
      
      const digits = cleaned.replace('+', '');
      if (digits.length < 7 || digits.length > 15) {
        throw new Error('Phone number must be between 7-15 digits (including country code)');
      }
      
      return true;
    })
    .withMessage('Valid international phone number is required'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required')
];

export const validateRegisterCoach: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty/optional
      
      // Remove all non-digit characters except +
      const cleaned = value.replace(/[^\d+]/g, '');
      
      // Must start with + and have at least 10 digits total
      if (!cleaned.startsWith('+')) {
        throw new Error('Phone number must start with country code (e.g., +1, +63)');
      }
      
      const digits = cleaned.replace('+', '');
      if (digits.length < 7 || digits.length > 15) {
        throw new Error('Phone number must be between 7-15 digits (including country code)');
      }
      
      return true;
    })
    .withMessage('Valid international phone number is required')
];

export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];