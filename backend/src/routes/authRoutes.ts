import { Router } from 'express';
import {
  registerClient,
  registerCoach,
  login,
  logout,
  getProfile
} from '../controllers/authController';
import {
  validateRegisterClient,
  validateRegisterCoach,
  validateLogin
} from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register/client', validateRegisterClient, registerClient);
router.post('/register/coach', validateRegisterCoach, registerCoach);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;