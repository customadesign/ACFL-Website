'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Users,
  Shield,
  Settings,
  Eye,
  EyeOff,
  Save,
  User,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  FileText,
  CreditCard,
  Calendar,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  role_level: string;
  status: string;
  permissions?: string[];
}

interface PageCapability {
  id: string;
  name: string;
  description: string;
  icon: any;
  path: string;
  category: string;
  capabilities: Array<{
    id: string;
    name: string;
    description: string;
    level: 'read' | 'write' | 'admin';
  }>;
}

const PAGE_CAPABILITIES: PageCapability[] = [
  {
    id: 'users',
    name: 'User Management',
    description: 'Manage clients, coaches, and staff accounts',
    icon: Users,
    path: '/admin/users',
    category: 'User Management',
    capabilities: [
      { id: 'users.view', name: 'View Users', description: 'View user lists and profiles', level: 'read' },
      { id: 'users.edit', name: 'Edit Users', description: 'Edit user profiles and information', level: 'write' },
      { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', level: 'write' },
      { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', level: 'admin' },
      { id: 'users.status', name: 'Change Status', description: 'Activate/deactivate/suspend users', level: 'admin' },
      { id: 'users.impersonate', name: 'Login As User', description: 'Impersonate users for support', level: 'admin' },
      { id: 'users.reset_password', name: 'Reset Password', description: 'Reset user passwords', level: 'write' }
    ]
  },
  {
    id: 'appointments',
    name: 'Appointment Management',
    description: 'Manage and monitor coaching appointments',
    icon: Calendar,
    path: '/admin/appointments',
    category: 'Operations',
    capabilities: [
      { id: 'appointments.view', name: 'View Appointments', description: 'View appointment lists and details', level: 'read' },
      { id: 'appointments.edit', name: 'Edit Appointments', description: 'Modify appointment details', level: 'write' },
      { id: 'appointments.status', name: 'Change Status', description: 'Update appointment status', level: 'write' },
      { id: 'appointments.reschedule', name: 'Reschedule', description: 'Reschedule appointments', level: 'write' },
      { id: 'appointments.cancel', name: 'Cancel Appointments', description: 'Cancel appointments with reason', level: 'write' },
      { id: 'appointments.notes', name: 'Admin Notes', description: 'Add/edit administrative notes', level: 'write' }
    ]
  },
  {
    id: 'financial',
    name: 'Financial Management',
    description: 'Monitor payments and financial data',
    icon: CreditCard,
    path: '/admin/financials',
    category: 'Finance',
    capabilities: [
      { id: 'financial.view', name: 'View Transactions', description: 'View payment and transaction data', level: 'read' },
      { id: 'financial.stats', name: 'View Statistics', description: 'Access financial reports and stats', level: 'read' },
      { id: 'financial.refund', name: 'Process Refunds', description: 'Process transaction refunds', level: 'admin' },
      { id: 'financial.export', name: 'Export Data', description: 'Export financial reports', level: 'write' }
    ]
  },
  {
    id: 'content',
    name: 'Content Management',
    description: 'Manage website content and pages',
    icon: FileText,
    path: '/admin/content',
    category: 'Content',
    capabilities: [
      { id: 'content.view', name: 'View Content', description: 'View page content and drafts', level: 'read' },
      { id: 'content.edit', name: 'Edit Content', description: 'Edit page content and sections', level: 'write' },
      { id: 'content.publish', name: 'Publish Content', description: 'Publish/unpublish content', level: 'admin' },
      { id: 'content.create', name: 'Create Pages', description: 'Create new content pages', level: 'write' }
    ]
  },
  {
    id: 'messages',
    name: 'Message Center',
    description: 'Communicate with users and manage messages',
    icon: MessageSquare,
    path: '/admin/messages',
    category: 'Communication',
    capabilities: [
      { id: 'messages.view', name: 'View Messages', description: 'View message conversations', level: 'read' },
      { id: 'messages.send', name: 'Send Messages', description: 'Send messages to users', level: 'write' },
      { id: 'messages.moderate', name: 'Moderate Messages', description: 'Moderate and manage conversations', level: 'admin' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    description: 'View platform analytics and generate reports',
    icon: BarChart3,
    path: '/admin/analytics',
    category: 'Analytics',
    capabilities: [
      { id: 'analytics.view', name: 'View Analytics', description: 'View platform analytics and metrics', level: 'read' },
      { id: 'analytics.export', name: 'Export Reports', description: 'Export analytics reports', level: 'write' },
      { id: 'analytics.advanced', name: 'Advanced Analytics', description: 'Access detailed analytics features', level: 'admin' }
    ]
  }
];

export default function StaffCapabilities() {
  const { isAdmin, isStaff } = usePermissions();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [permissions, setPermissions] = useState<{ [staffId: string]: { [capabilityId: string]: boolean } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const isReadOnly = isStaff && !isAdmin;

  // Helper function to check if a permission is a read permission
  const isReadPermission = (permissionId: string): boolean => {
    const readActions = ['.view', '.stats', '.export', '.advanced'];
    return readActions.some(action => permissionId.endsWith(action)) || permissionId.includes('view');
  };

  useEffect(() => {
    fetchStaffMembers();
    fetchPermissions();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();

      const response = await fetch(`${API_URL}/api/admin/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both array format (from users endpoint) and object format (from staff endpoint)
        const staffArray = Array.isArray(data) ? data.filter((user: any) => user.role === 'staff') : data.staff || [];
        setStaffMembers(staffArray);
      }
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setIsLoadingPermissions(true);
    setPermissionError(null);
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();

      console.log('Fetching staff permissions from:', `${API_URL}/api/admin/staff-permissions`);

      const response = await fetch(`${API_URL}/api/admin/staff-permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Staff permissions fetched:', data);
        setPermissions(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch permissions:', response.status, errorText);
        setPermissionError(`Failed to load permissions: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissionError('Failed to load permissions. Please check your connection.');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const updatePermission = (staffId: string, capabilityId: string, granted: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [capabilityId]: granted
      }
    }));
  };

  const savePermissions = async () => {
    setIsSaving(true);
    setPermissionError(null);
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();

      console.log('Saving permissions:', permissions);

      const response = await fetch(`${API_URL}/api/admin/staff-permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Permissions saved successfully:', result);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const errorText = await response.text();
        console.error('Failed to save permissions:', response.status, errorText);
        setPermissionError(`Failed to save permissions: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save permissions:', error);
      setPermissionError('Failed to save permissions. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStaffMembers = staffMembers.filter(staff => {
    const matchesSearch =
      staff.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const categories = ['all', ...Array.from(new Set(PAGE_CAPABILITIES.map(p => p.category)))];
  const filteredCapabilities = selectedCategory === 'all'
    ? PAGE_CAPABILITIES
    : PAGE_CAPABILITIES.filter(p => p.category === selectedCategory);

  const departments = Array.from(new Set(staffMembers.map(s => s.department))).filter(Boolean);

  const getPermissionStatus = (staffId: string, capabilityId: string) => {
    return permissions[staffId]?.[capabilityId] || false;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'read': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'write': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Staff Capabilities</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isReadOnly
                ? 'View staff permissions - Staff have read access to all pages by default and need explicit permissions for edit actions'
                : 'Manage staff permissions - Staff have read access by default, configure edit permissions as needed'}
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={savePermissions}
              disabled={isSaving}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-only notice for staff */}
      {isReadOnly && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-blue-800 dark:text-blue-200">
              You have read access to all admin pages by default. Only administrators can grant additional edit permissions.
            </span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-green-800 dark:text-green-200">Permissions saved successfully!</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {permissionError && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{permissionError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Members List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Staff Members</h2>

            {/* Staff Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredStaffMembers.map((staff) => (
              <button
                key={staff.id}
                onClick={() => setSelectedStaff(staff)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors ${
                  selectedStaff?.id === staff.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {staff.first_name} {staff.last_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {staff.department} • {staff.role_level}
                    </div>
                  </div>
                  {selectedStaff?.id === staff.id && (
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </button>
            ))}

            {filteredStaffMembers.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No staff members found</p>
              </div>
            )}
          </div>
        </div>

        {/* Capabilities Management */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedStaff ? `Permissions for ${selectedStaff.first_name} ${selectedStaff.last_name}` : 'Select a Staff Member'}
                </h2>
                {selectedStaff && (
                  <div className="mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedStaff.department} • {selectedStaff.email}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {/* Count only edit permissions (read permissions are default) */}
                      {Object.values(permissions[selectedStaff.id] || {}).filter(Boolean).length} edit permissions granted
                      {/* Count read permissions separately */}
                      • {filteredCapabilities.reduce((total, page) =>
                        total + page.capabilities.filter(cap => isReadPermission(cap.id)).length, 0
                      )} read permissions (default)
                    </p>
                  </div>
                )}
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoadingPermissions ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading permissions...</span>
              </div>
            ) : selectedStaff ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCapabilities.map((page) => {
                  const Icon = page.icon;
                  return (
                    <div key={page.id} className="p-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">{page.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{page.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
                        {page.capabilities.map((capability) => {
                          const isGranted = getPermissionStatus(selectedStaff.id, capability.id);
                          const isReadPerm = isReadPermission(capability.id);
                          const hasDefaultAccess = isReadPerm; // Staff get read permissions by default

                          return (
                            <div key={capability.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {capability.name}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(capability.level)}`}>
                                    {capability.level}
                                  </span>
                                  {hasDefaultAccess && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {capability.description}
                                  {hasDefaultAccess && <span className="text-blue-600 dark:text-blue-400"> • Staff have this access by default</span>}
                                </p>
                              </div>
                              {hasDefaultAccess ? (
                                <div
                                  className="ml-3 px-3 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  title="Staff have read access by default"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Default Access</span>
                                </div>
                              ) : isReadOnly ? (
                                <div
                                  className={`ml-3 px-3 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium ${
                                    isGranted
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  }`}
                                  title={isGranted ? 'Permission is granted' : 'Permission is denied'}
                                >
                                  {isGranted ? (
                                    <>
                                      <Unlock className="h-4 w-4" />
                                      <span>Granted</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-4 w-4" />
                                      <span>Denied</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => updatePermission(selectedStaff.id, capability.id, !isGranted)}
                                  className={`ml-3 px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium ${
                                    isGranted
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                                      : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                                  }`}
                                  title={isGranted ? 'Click to deny permission' : 'Click to grant permission'}
                                >
                                  {isGranted ? (
                                    <>
                                      <Unlock className="h-4 w-4" />
                                      <span>Granted</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-4 w-4" />
                                      <span>Denied</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Staff Member</h3>
                <p className="text-sm">Choose a staff member from the list to manage their page access and capabilities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}