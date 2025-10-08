import { Request, Response, NextFunction } from 'express';
import jwt = require('jsonwebtoken');
import { JWTPayload } from '../types/auth';
import { supabase } from '../lib/supabase';

interface AuthRequest extends Request {
  user?: JWTPayload;
  headers: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Auth middleware - headers:', req.headers.authorization ? 'Token present' : 'No token');
    console.log('Auth middleware - path:', req.path);

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('DEBUG: No authentication token provided');
      console.log('DEBUG: All headers:', Object.keys(req.headers));
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload;

    console.log('DEBUG: JWT decoded successfully:', { 
      userId: decoded.userId, 
      role: decoded.role,
      email: decoded.email 
    });

    req.user = decoded;
    next();
  } catch (error) {
    console.log('DEBUG: Authentication failed:', error.message);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// Admin-specific middleware
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Additional admin verification could go here
    // For example, checking if admin account is still active
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Middleware to verify admin token and get admin profile
export const verifyAdminToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload;

    // Verify admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid admin token' });
  }
};

// Middleware to check if user account is active
export const requireActiveUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    const { userId, role } = req.user;
    let tableName: string;

    // Determine which table to check based on user role
    switch (role) {
      case 'client':
        tableName = 'clients';
        break;
      case 'coach':
        tableName = 'coaches';
        break;
      case 'staff':
      case 'admin':
        tableName = 'staff';
        break;
      default:
        return res.status(400).json({ error: 'Invalid user role' });
    }

    // Check if user is active
    const { data: user, error } = await supabase
      .from(tableName)
      .select('is_active, status')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user status:', error);
      return res.status(500).json({ error: 'Failed to verify user status' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is inactive/deactivated
    if (user.is_active === false || user.status === 'inactive') {
      return res.status(403).json({
        error: 'Account is deactivated. Please contact support to reactivate your account.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    next();
  } catch (error) {
    console.error('Active user check error:', error);
    res.status(500).json({ error: 'Failed to verify user status' });
  }
};

// Middleware that allows deactivated users to access specific endpoints
export const allowDeactivatedUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // This middleware simply passes through without checking active status
  // Use this for endpoints that deactivated users should be able to access
  next();
};