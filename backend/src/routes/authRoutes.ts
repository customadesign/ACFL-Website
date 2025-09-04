import { Router } from 'express';
import {
  registerClient,
  registerCoach,
  login,
  logout,
  getProfile,
  createAdmin
} from '../controllers/authController';
import {
  validateRegisterClient,
  validateRegisterCoach,
  validateLogin
} from '../middleware/validation';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register/client', validateRegisterClient, registerClient);
router.post('/register/coach', validateRegisterCoach, registerCoach);
router.post('/login', validateLogin, login);
router.post('/logout', authenticate, logout); // Protect logout to access user info for logging

// Admin routes (protected)
router.post('/create-admin', requireAdmin, createAdmin);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;