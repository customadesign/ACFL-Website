import { Request, Response } from 'express';
import multer from 'multer';
import { csvImportService } from '../services/csvImportService';
import { supabase } from '../lib/supabase';

interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    role: 'client' | 'coach' | 'admin' | 'staff';
    email: string;
    [key: string]: any;
  };
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export const uploadMiddleware = upload.single('csvFile');

// Import users from CSV
export const importUsers = async (req: AuthRequest, res: Response) => {
  try {
    console.log('CSV Import request received');
    console.log('User from auth:', req.user);
    console.log('Request headers:', req.headers.authorization ? 'Token present' : 'No token');

    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      console.log('Admin access denied:', { user: req.user?.email, role: req.user?.role });
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const { sendEmails } = req.body;

    // Always use unified import
    const userType = 'unified';

    console.log(`Starting CSV import for ${userType} users...`);
    console.log(`File size: ${req.file.size} bytes`);
    console.log(`Send emails: ${sendEmails === 'true'}`);

    const result = await csvImportService.importUsers(
      req.file.buffer,
      userType,
      sendEmails === 'true'
    );

    if (result.success) {
      res.status(200).json({
        message: result.message,
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors
      });
    } else {
      res.status(400).json({
        message: result.message,
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors
      });
    }

  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({
      error: 'Failed to import users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get sample CSV template
export const getSampleCSV = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Always provide unified template
    const userType = 'unified';

    const sampleCSV = csvImportService.generateSampleCSV(userType as 'client' | 'coach' | 'staff');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users_template.csv"`);
    res.status(200).send(sampleCSV);

  } catch (error) {
    console.error('Sample CSV generation error:', error);
    res.status(500).json({
      error: 'Failed to generate sample CSV',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Validate CSV format without importing
export const validateCSV = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    // Always use unified validation
    const userType = 'unified';

    // Perform validation only (parse and check format without importing)
    const result = await csvImportService.validateCSVFormat(
      req.file.buffer,
      userType
    );

    res.status(200).json({
      valid: result.errorCount === 0,
      message: result.errorCount === 0 ? 'CSV format is valid' : 'CSV contains errors',
      totalRows: result.successCount + result.errorCount,
      validRows: result.successCount,
      invalidRows: result.errorCount,
      errors: result.errors
    });

  } catch (error) {
    console.error('CSV validation error:', error);
    res.status(500).json({
      error: 'Failed to validate CSV',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get import history/statistics
export const getImportStats = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get user counts from database
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    const { count: coachCount } = await supabase
      .from('coaches')
      .select('*', { count: 'exact', head: true });

    const { count: staffCount } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      totalUsers: {
        clients: clientCount || 0,
        coaches: coachCount || 0,
        staff: staffCount || 0
      },
      lastImport: new Date().toISOString() // This would need to be tracked in a separate table for real implementation
    });

  } catch (error) {
    console.error('Import stats error:', error);
    res.status(500).json({
      error: 'Failed to get import statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};