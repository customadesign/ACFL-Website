'use client';

import { useState } from 'react';
import {
  X,
  Send,
  User,
  Mail,
  Building2,
  Shield,
  Clock,
  MessageSquare,
  Plus,
  Check
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface StaffInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message: string) => void;
}

interface InvitationFormData {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  roleLevel: string;
  employmentType: string;
  message: string;
  permissions: { [key: string]: boolean };
}

const DEPARTMENTS = [
  'Administration',
  'Support',
  'Quality Assurance',
  'Technical',
  'Marketing',
  'Finance'
];

const ROLE_LEVELS = [
  { value: 'staff', label: 'Staff' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Administrator' }
];

const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'intern'
];

const AVAILABLE_PERMISSIONS = [
  { id: 'users.view', label: 'View Users', description: 'Can view user profiles and information' },
  { id: 'users.edit', label: 'Edit Users', description: 'Can modify user profiles and settings' },
  { id: 'users.create', label: 'Create Users', description: 'Can create new user accounts' },
  { id: 'users.delete', label: 'Delete Users', description: 'Can delete user accounts' },
  { id: 'users.status', label: 'Manage User Status', description: 'Can activate, deactivate, or suspend users' },
  { id: 'users.impersonate', label: 'Impersonate Users', description: 'Can login as other users' },
  { id: 'coaches.view', label: 'View Coaches', description: 'Can view coach profiles and applications' },
  { id: 'coaches.manage', label: 'Manage Coaches', description: 'Can approve/reject coach applications' },
  { id: 'sessions.view', label: 'View Sessions', description: 'Can view coaching sessions' },
  { id: 'sessions.manage', label: 'Manage Sessions', description: 'Can cancel or modify coaching sessions' },
  { id: 'payments.view', label: 'View Payments', description: 'Can view payment information' },
  { id: 'payments.manage', label: 'Manage Payments', description: 'Can process refunds and payment adjustments' },
  { id: 'messages.view', label: 'View Messages', description: 'Can view user messages and conversations' },
  { id: 'admin.settings', label: 'Admin Settings', description: 'Can modify system settings and configuration' }
];

export default function StaffInvitationModal({
  isOpen,
  onClose,
  onSuccess,
  onError
}: StaffInvitationModalProps) {
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    roleLevel: 'staff',
    employmentType: 'full-time',
    message: '',
    permissions: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/staff/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          department: formData.department,
          role_level: formData.roleLevel,
          employment_type: formData.employmentType,
          message: formData.message,
          permissions: formData.permissions
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          onError('Email Already in Use', result.error || 'A staff member with this email already exists or has a pending invitation.');
        } else if (response.status === 400) {
          onError('Invalid Input', result.error || 'Please check your input and ensure all required fields are filled correctly.');
        } else {
          throw new Error(result.error || 'Failed to send invitation');
        }
        return;
      }

      onSuccess(`Staff invitation sent successfully to ${formData.email}`);
      resetForm();
      onClose();

    } catch (error) {
      console.error('Failed to send staff invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      onError('Invitation Failed', `Failed to send staff invitation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      department: '',
      roleLevel: 'staff',
      employmentType: 'full-time',
      message: '',
      permissions: {}
    });
    setShowPermissions(false);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: !prev.permissions[permissionId]
      }
    }));
  };

  const selectAllPermissions = () => {
    const allPermissions: { [key: string]: boolean } = {};
    AVAILABLE_PERMISSIONS.forEach(permission => {
      allPermissions[permission.id] = true;
    });
    setFormData(prev => ({ ...prev, permissions: allPermissions }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: {} }));
  };

  const getSelectedPermissionsCount = () => {
    return Object.values(formData.permissions).filter(Boolean).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Send Staff Invitation
          </h3>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Personal Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Role Information */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Role Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Role Level *
                </label>
                <select
                  value={formData.roleLevel}
                  onChange={(e) => setFormData({ ...formData, roleLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {ROLE_LEVELS.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Employment Type *
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {EMPLOYMENT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Permissions ({getSelectedPermissionsCount()} selected)
              </h4>
              <button
                type="button"
                onClick={() => setShowPermissions(!showPermissions)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showPermissions ? 'Hide' : 'Show'} Permissions
              </button>
            </div>

            {showPermissions && (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Select All
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={clearAllPermissions}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <label key={permission.id} className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions[permission.id] || false}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Message */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Custom Message (Optional)
            </h4>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              placeholder="Add a personal message to include in the invitation email..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-gray-600 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.firstName || !formData.lastName}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}