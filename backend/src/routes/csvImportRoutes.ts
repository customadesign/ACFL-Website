import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  importUsers,
  getSampleCSV,
  validateCSV,
  getImportStats,
  uploadMiddleware
} from '../controllers/csvImportController';

const router = express.Router();

// All routes require authentication and admin access (handled in controller)
router.use(authenticate);

// Import users from CSV
router.post('/import', uploadMiddleware, importUsers);

// Validate CSV format without importing
router.post('/validate', uploadMiddleware, validateCSV);

// Download sample CSV template
router.get('/template/:userType', getSampleCSV);

// Get import statistics
router.get('/stats', getImportStats);

// Debug endpoint to test auth
router.get('/test-auth', (req: any, res) => {
  console.log('Test auth endpoint hit');
  console.log('User:', req.user);
  res.json({
    message: 'Auth working',
    user: {
      id: req.user?.userId,
      email: req.user?.email,
      role: req.user?.role
    }
  });
});

export default router;