import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types/auth';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Middleware to ensure user is an admin
export const requireAdminRole = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'You do not have permission to access this resource'
    });
  }

  next();
};

// Middleware to check specific staff permissions (for future use)
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // If user is admin, allow all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // For staff members, check specific permissions
    if (req.user.role === 'staff') {
      const hasRequiredPermission = await hasPermission(req.user.id || req.user.userId, permission);

      if (!hasRequiredPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required_permission: permission
        });
      }

      return next();
    }

    return res.status(403).json({
      error: 'Access denied',
      message: 'Invalid role for this resource'
    });
  };
};

// Helper function to check if user has specific permission
export const hasPermission = async (userId: string, permission: string): Promise<boolean> => {
  try {
    // Import here to avoid circular dependencies
    const { getStaffMemberPermissions } = await import('../controllers/staffController');
    const permissions = await getStaffMemberPermissions(userId);
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};