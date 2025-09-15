import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

interface PermissionCheck {
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

export const usePermissions = (): PermissionCheck => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Admins have all permissions
      if (user.role === 'admin') {
        setPermissions({});
        setIsLoading(false);
        return;
      }

      // For staff, fetch their specific permissions
      if (user.role === 'staff') {
        try {
          const token = localStorage.getItem('token');
          const API_URL = getApiUrl();

          const response = await fetch(`${API_URL}/api/admin/staff-permissions`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Extract permissions for this staff member
            const staffPermissions = data[user.id] || {};
            setPermissions(staffPermissions);
          } else {
            console.error('Failed to fetch staff permissions:', response.status);
            setPermissions({});
          }
        } catch (error) {
          console.error('Failed to fetch staff permissions:', error);
          setPermissions({});
        }
      }

      setIsLoading(false);
    };

    fetchPermissions();
  }, [user]);

  const isReadPermission = (permission: string): boolean => {
    const readActions = ['.view', '.stats', '.export', '.advanced'];
    return readActions.some(action => permission.endsWith(action)) || permission.includes('view');
  };

  const hasPermission = (permission: string): boolean => {
    // Admins have all permissions
    if (user?.role === 'admin') {
      return true;
    }

    // Staff have read access by default, need explicit permission for write/edit actions
    if (user?.role === 'staff') {
      // Staff get all read/view permissions by default
      if (isReadPermission(permission)) {
        return true;
      }

      // For edit/write/delete/create actions, check explicit permissions
      return permissions[permission] === true;
    }

    // Other roles have no admin permissions
    return false;
  };

  return {
    hasPermission,
    isLoading,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff'
  };
};

// Specific permission constants to avoid typos
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_EDIT: 'users.edit',
  USERS_CREATE: 'users.create',
  USERS_DELETE: 'users.delete',
  USERS_STATUS: 'users.status',
  USERS_IMPERSONATE: 'users.impersonate',
  USERS_RESET_PASSWORD: 'users.reset_password',

  // Appointments
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_STATUS: 'appointments.status',
  APPOINTMENTS_RESCHEDULE: 'appointments.reschedule',
  APPOINTMENTS_CANCEL: 'appointments.cancel',
  APPOINTMENTS_NOTES: 'appointments.notes',

  // Financial
  FINANCIAL_VIEW: 'financial.view',
  FINANCIAL_STATS: 'financial.stats',
  FINANCIAL_REFUND: 'financial.refund',
  FINANCIAL_EXPORT: 'financial.export',

  // Content
  CONTENT_VIEW: 'content.view',
  CONTENT_EDIT: 'content.edit',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_CREATE: 'content.create',

  // Messages
  MESSAGES_VIEW: 'messages.view',
  MESSAGES_SEND: 'messages.send',
  MESSAGES_MODERATE: 'messages.moderate',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  ANALYTICS_ADVANCED: 'analytics.advanced'
} as const;