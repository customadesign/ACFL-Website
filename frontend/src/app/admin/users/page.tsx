
'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Eye,
  UserPlus,
  Save,
  X,
  LogIn,
  User,
  UserX, 
  CircleUserRound,
  Copy,
  AlertTriangle,
  Info
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'coach' | 'staff';
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  last_login?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  specialties?: string[];
  years_experience?: number;
  hourly_rate_usd?: number;
  // Client specific fields
  dob?: string;
  gender_identity?: string;
  ethnic_identity?: string;
  religious_background?: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: 'client' | 'coach' | 'staff';
  status: string;
  // Client specific
  dob?: string;
  genderIdentity?: string;
  ethnicIdentity?: string;
  religiousBackground?: string;
  // Coach specific
  specialties?: string[];
  yearsExperience?: number;
  hourlyRate?: number;
  bio?: string;
  qualifications?: string;
  // Staff specific
  department?: string;
  permissions?: string[];
  roleLevel?: string;
  // Advanced settings
  emailVerified?: boolean;
  profileComplete?: boolean;
  adminNotes?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'client' | 'coach' | 'staff'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    email: string;
    password: string;
    userType: string;
  } | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState<{
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: 'client',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      console.log('Fetching users from:', `${API_URL}/api/admin/users`);
      
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, removing token and redirecting');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: Failed to fetch users`);
      }

      const data = await response.json();
      console.log('Raw response data:', data);
      
      const usersArray = Array.isArray(data) ? data : (data.users || data.data || []);
      console.log('Processed users array:', usersArray);
      console.log('Number of users:', usersArray.length);
      
      setUsers(usersArray);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showError(
        'Failed to Load Users',
        'Unable to fetch user data from the server. Please check your internet connection and try refreshing the page.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users;

    // Filter by active tab first
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(user => {
        const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Remove roleFilter as it's now handled by tabs
    // if (roleFilter !== 'all') {
    //   filtered = filtered.filter(user => user.role === roleFilter);
    // }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (userId: string, action: string, userType: string) => {
    // Add confirmation for destructive actions
    const destructiveActions = ['deactivate', 'suspend', 'reject'];
    if (destructiveActions.includes(action)) {
      const actionMessages = {
        deactivate: 'This will deactivate the user account. The user will not be able to log in until reactivated.',
        suspend: 'This will suspend the user account. The user will not be able to log in until reactivated.',
        reject: 'This will reject the user application. This action can be reversed later.'
      };
      
      setShowActionMenu(null);
      showWarning(
        `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        `Are you sure you want to ${action} this user?\n\n${actionMessages[action as keyof typeof actionMessages] || ''}`,
        () => performUserAction(userId, action, userType),
        () => {} // Do nothing on cancel
      );
      return;
    }
    
    // For non-destructive actions, proceed directly
    await performUserAction(userId, action, userType);
  };

  const performUserAction = async (userId: string, action: string, userType: string) => {

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userType })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      const result = await response.json();
      
      // Update local state with the returned user data
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user.id === userId) {
            return { ...user, ...result.user };
          }
          return user;
        })
      );
      
      setShowActionMenu(null);

      // Show success message for important actions
      if (['deactivate', 'activate', 'suspend', 'approve', 'reject'].includes(action)) {
        const successMessages = {
          deactivate: 'User has been deactivated successfully.',
          activate: 'User has been activated successfully.',
          suspend: 'User has been suspended successfully.',
          approve: 'User has been approved successfully.',
          reject: 'User has been rejected successfully.'
        };
        
        showInfo(
          'Action Completed',
          successMessages[action as keyof typeof successMessages] || `User ${action} completed successfully.`
        );
      }
      
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      showError(
        'Action Failed',
        `Failed to ${action} user. Please check your connection and try again.`
      );
    }
  };

  const handleLoginAsUser = async (userId: string, userType: string, userName: string) => {
    showWarning(
      'Login as User',
      `Are you sure you want to login as ${userName}? This will redirect you to their dashboard and you will be impersonating this user.`,
      () => performLoginAsUser(userId, userType, userName),
      () => {} // Do nothing on cancel
    );
  };

  const performLoginAsUser = async (userId: string, userType: string, userName: string) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const API_URL = getApiUrl();
        const response = await fetch(`${API_URL}/api/admin/users/${userId}/impersonate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userType })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to impersonate user');
        }

        const result = await response.json();
        
        // Store the original admin token for later restoration
        localStorage.setItem('admin_token', token);
        localStorage.setItem('impersonating', 'true');
        localStorage.setItem('impersonated_user', JSON.stringify({
          id: userId,
          type: userType,
          name: userName
        }));
        
        // Replace current token with impersonation token
        localStorage.setItem('token', result.token);
        
        // Redirect based on user type
        if (userType === 'client') {
          window.location.href = '/clients';
        } else if (userType === 'coach') {
          window.location.href = '/coaches';
        } else {
          window.location.href = '/admin';
        }
        
      } catch (error) {
        console.error('Failed to impersonate user:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        showError(
          'Login Failed',
          `Failed to login as user: ${errorMessage}. Please try again.`
        );
      }
  };

  const handleDeleteUser = async (userId: string, userType: string) => {
    showWarning(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.',
      () => performDeleteUser(userId, userType),
      () => {} // Do nothing on cancel
    );
  };

  const performDeleteUser = async (userId: string, userType: string) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const API_URL = getApiUrl();
        const response = await fetch(`${API_URL}/api/admin/users/${userId}?userType=${userType}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setShowActionMenu(null);
        showInfo('User Deleted', 'User has been deleted successfully.');
      } catch (error) {
        console.error('Failed to delete user:', error);
        showError(
          'Delete Failed',
          'Failed to delete user. Please check your connection and try again.'
        );
      }
  };

  // Generate temporary password
  const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure password has at least one uppercase, lowercase, number, and special character
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase  
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      
      // Generate temporary password for the new user
      const temporaryPassword = generateTemporaryPassword();
      
      // Log the request data for debugging (don't log password)
      console.log('Creating user with data:', {
        userType: formData.userType,
        userData: { ...formData, password: '[HIDDEN]' }
      });
      
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userType: formData.userType,
          userData: {
            ...formData,
            password: temporaryPassword
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          // Email already exists
          showError(
            'Email Already Exists',
            result.message || 'A user with this email already exists in the system. Please use a different email address.'
          );
          return;
        } else if (response.status === 400) {
          // Validation error
          showError(
            'Invalid Input',
            result.error || 'Please check your input and ensure all required fields are filled correctly.'
          );
          return;
        } else {
          throw new Error(result.error || 'Failed to create user');
        }
      }

      console.log('User created successfully:', result);
      
      // Show success modal with credentials
      setSuccessData({
        email: formData.email,
        password: temporaryPassword,
        userType: formData.userType
      });
      setShowSuccessModal(true);
      
      // Add new user to local state
      setUsers(prevUsers => [...prevUsers, result.user]);
      
      // Reset form and close modal
      resetForm();
      
    } catch (error) {
      console.error('Failed to create user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      showError(
        'User Creation Failed',
        `Failed to create user: ${errorMessage}. Please check your connection and try again.`
      );
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userType: formData.userType,
          userData: formData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          // Email already exists
          showError(
            'Email Already Exists',
            result.message || 'A user with this email already exists in the system. Please use a different email address.'
          );
          return;
        } else if (response.status === 400) {
          // Validation error
          showError(
            'Invalid Input',
            result.error || 'Please check your input and ensure all required fields are filled correctly.'
          );
          return;
        } else {
          throw new Error(result.error || 'Failed to update user');
        }
      }
      
      // Update user in local state
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user.id === selectedUser.id) {
            return { ...user, ...result.user };
          }
          return user;
        })
      );
      
      // Show success message
      showInfo(
        'User Updated',
        `${formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1)} profile has been updated successfully.`
      );
      
      // Reset form and close modal
      resetForm();
      
    } catch (error) {
      console.error('Failed to update user:', error);
      showError(
        'Update Failed',
        'Failed to update user. Please check your connection and try again.'
      );
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      userType: 'client',
      status: 'active'
    });
    setShowUserModal(false);
    setSelectedUser(null);
    setIsEditMode(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
  };

  const showAlert = (config: {
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
  }) => {
    setAlertData(config);
    setShowAlertModal(true);
  };

  const closeAlertModal = () => {
    setShowAlertModal(false);
    setAlertData(null);
  };

  const showError = (title: string, message: string) => {
    showAlert({ type: 'error', title, message, confirmText: 'OK' });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => {
    showAlert({
      type: 'warning',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showCancel: true
    });
  };

  const showInfo = (title: string, message: string) => {
    showAlert({ type: 'info', title, message, confirmText: 'OK' });
  };

  const openCreateModal = () => {
    resetForm();
    setShowUserModal(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email,
      phone: user.phone || '',
      userType: user.role,
      status: user.status,
      department: user.department,
      specialties: user.specialties,
      yearsExperience: user.years_experience,
      hourlyRate: user.hourly_rate_usd,
      // Client specific fields
      dob: user.dob || '',
      genderIdentity: user.gender_identity || '',
      ethnicIdentity: user.ethnic_identity || '',
      religiousBackground: user.religious_background || ''
    });
    setSelectedUser(user);
    setIsEditMode(true);
    setShowUserModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      suspended: { color: 'bg-red-100 text-red-800', icon: Ban },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: XCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      client: 'bg-blue-100 text-blue-800',
      coach: 'bg-purple-100 text-purple-800',
      staff: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 bg-gray-200 rounded w-1/3 animate-pulse mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="py-2 px-1 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage all platform users including clients, coaches, and staff</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-max"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
            {[
              { key: 'all', label: 'All Users', count: users.length},
              { key: 'client', label: 'Clients', count: users.filter(u => u.role === 'client').length },
              { key: 'coach', label: 'Coaches', count: users.filter(u => u.role === 'coach').length},
              { key: 'staff', label: 'Staff', count: users.filter(u => u.role === 'staff').length}
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 sm:py-1 px-1 sm:px-2 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.name ? user.name.charAt(0).toUpperCase() : (user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {showActionMenu === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                openEditModal(user);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                openEditModal(user);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </button>
                            <button
                              onClick={() => {
                                handleLoginAsUser(user.id, user.role, user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim());
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 w-full text-left"
                            >
                              <LogIn className="h-4 w-4 mr-2" />
                              Login As User
                            </button>
                            {user.status === 'active' ? (
                              <>
                                <button
                                  onClick={() => handleUserAction(user.id, 'deactivate', user.role)}
                                  className="flex items-center px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 w-full text-left"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate User
                                </button>
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend', user.role)}
                                  className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
                                </button>
                              </>
                            ) : user.status === 'inactive' ? (
                              <button
                                onClick={() => handleUserAction(user.id, 'activate', user.role)}
                                className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate User
                              </button>
                            ) : user.status === 'suspended' ? (
                              <button
                                onClick={() => handleUserAction(user.id, 'activate', user.role)}
                                className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reactivate User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.id, 'activate', user.role)}
                                className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate User
                              </button>
                            )}
                            {user.role === 'coach' && user.status === 'pending' && (
                              <button
                                onClick={() => handleUserAction(user.id, 'approve', user.role)}
                                className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Coach
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.role)}
                              className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {isLoading ? 'Loading users...' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {isEditMode ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <select
                    value={formData.userType}
                    onChange={(e) => setFormData({ ...formData, userType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isEditMode}
                  >
                    <option value="client">Client</option>
                    <option value="coach">Coach</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    {formData.userType === 'coach' && (
                      <>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Role-specific fields */}
              {formData.userType === 'client' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900">Client Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dob || ''}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender Identity
                      </label>
                      <input
                        type="text"
                        value={formData.genderIdentity || ''}
                        onChange={(e) => setFormData({ ...formData, genderIdentity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Male, Female, Non-binary, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ethnic Identity
                      </label>
                      <input
                        type="text"
                        value={formData.ethnicIdentity || ''}
                        onChange={(e) => setFormData({ ...formData, ethnicIdentity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Religious Background
                      </label>
                      <input
                        type="text"
                        value={formData.religiousBackground || ''}
                        onChange={(e) => setFormData({ ...formData, religiousBackground: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.userType === 'coach' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900">Coach Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={formData.yearsExperience || ''}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate (USD)
                      </label>
                      <input
                        type="number"
                        value={formData.hourlyRate || ''}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formData.userType === 'staff' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900">Staff Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department || ''}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        <option value="Administration">Administration</option>
                        <option value="Support">Support</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Technical">Technical</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role Level
                      </label>
                      <select
                        value={formData.roleLevel || 'staff'}
                        onChange={(e) => setFormData({ ...formData, roleLevel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="staff">Staff</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Profile Settings */}
              {isEditMode && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900">Advanced Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Login
                      </label>
                      <input
                        type="text"
                        value={selectedUser?.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Created
                      </label>
                      <input
                        type="text"
                        value={selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'Unknown'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.emailVerified !== false}
                        onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Email Verified</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.profileComplete !== false}
                        onChange={(e) => setFormData({ ...formData, profileComplete: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Profile Complete</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={formData.adminNotes || ''}
                      onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                      rows={3}
                      placeholder="Internal notes about this user (not visible to the user)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={isEditMode ? handleUpdateUser : handleCreateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isEditMode ? 'Update User' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && alertData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                alertData.type === 'error' ? 'bg-red-100' :
                alertData.type === 'warning' ? 'bg-yellow-100' :
                alertData.type === 'success' ? 'bg-green-100' :
                'bg-blue-100'
              }`}>
                {alertData.type === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
                {alertData.type === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
                {alertData.type === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
                {alertData.type === 'info' && <Info className="h-6 w-6 text-blue-600" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {alertData.title}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {alertData.message}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              {alertData.showCancel && (
                <button
                  onClick={() => {
                    alertData.onCancel?.();
                    closeAlertModal();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {alertData.cancelText || 'Cancel'}
                </button>
              )}
              <button
                onClick={() => {
                  alertData.onConfirm?.();
                  closeAlertModal();
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  alertData.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  alertData.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                  alertData.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {alertData.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for User Creation */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {successData.userType.charAt(0).toUpperCase() + successData.userType.slice(1)} Created Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                The new {successData.userType} account has been created. Please share these credentials securely.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={successData.email}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                  <button
                    onClick={() => copyToClipboard(successData.email)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy email"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={successData.password}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(successData.password)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> The user should change their password upon first login for security.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  copyToClipboard(`Email: ${successData.email}\nPassword: ${successData.password}`);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Both</span>
              </button>
              <button
                onClick={closeSuccessModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}