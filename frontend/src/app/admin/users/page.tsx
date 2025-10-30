
'use client';

import { useEffect, useState } from 'react';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/PermissionGate';
import StaffInvitationModal from '@/components/admin/StaffInvitationModal';
import StaffInvitationManager from '@/components/admin/StaffInvitationManager';
import CSVImportModal from '@/components/admin/CSVImportModal';
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
  Info,
  MessageSquare,
  Key,
  Users,
  Send,
  Upload,
  FileText,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import SearchInput from '@/components/ui/search-input';
import Pagination from '@/components/ui/pagination';

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
  profile_photo?: string;
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
  const router = useRouter();
  const { hasPermission, isAdmin, isStaff } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'client' | 'coach' | 'staff'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [roleCounts, setRoleCounts] = useState({
    all: 0,
    client: 0,
    coach: 0,
    staff: 0
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [showStaffInviteModal, setShowStaffInviteModal] = useState(false);
  const [showStaffManagement, setShowStaffManagement] = useState(false);
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

  const handleMessageUser = (user: User) => {
    const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const params = new URLSearchParams({
      conversation_with: user.id,
      partner_name: encodeURIComponent(userName),
      partner_role: user.role
    });
    router.push(`/admin/messages?${params.toString()}`);
    setShowActionMenu(null);
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();

      // Apply current filters to export
      let queryParams = new URLSearchParams();
      if (activeTab !== 'all') {
        queryParams.append('role', activeTab);
      }
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`${API_URL}/api/admin/users/export?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, removing token and redirecting');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to export users`);
      }

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'users_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create a blob from the response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showInfo('Export Complete', 'User data has been exported successfully');
    } catch (error) {
      console.error('Failed to export users:', error);
      showError(
        'Export Failed',
        'Unable to export user data. Please check your internet connection and try again.'
      );
    }
  };

  // Permission check
  useEffect(() => {
    if (!hasPermission(PERMISSIONS.USERS_VIEW)) {
      router.push('/admin');
      return;
    }
  }, [hasPermission, router]);

  // Keyboard navigation for action menus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showActionMenu) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showActionMenu]);

  // Click outside to close action menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionMenu && !(event.target as Element).closest('[data-action-menu]')) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage, statusFilter, activeTab, startDate, endDate]);

  // Fetch role counts separately when filters change (but not when tab changes)
  useEffect(() => {
    fetchRoleCounts();
  }, [statusFilter, startDate, endDate]);

  // Initial fetch of role counts on component mount
  useEffect(() => {
    fetchRoleCounts();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(activeTab !== 'all' && { role: activeTab }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const url = `${API_URL}/api/admin/users?${queryParams}`;
      console.log('Fetching users from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });


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
      const pagination = data.pagination || {};

      console.log('Processed users array:', usersArray);
      console.log('Pagination info:', pagination);
      console.log('Number of users:', usersArray.length);

      // Update pagination state
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);

      setUsers(usersArray);
      setFilteredUsers(usersArray); // Set filtered users directly from server response
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

  const fetchRoleCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Build query parameters (same filters but without role restriction)
      const baseParams = new URLSearchParams({
        page: '1',
        limit: '1', // We only need the count, not the data
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      // Fetch counts for each role
      const [allResponse, clientsResponse, coachesResponse, staffResponse] = await Promise.all([
        fetch(`${getApiUrl()}/api/admin/users?${baseParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${getApiUrl()}/api/admin/users?${baseParams.toString()}&role=client`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${getApiUrl()}/api/admin/users?${baseParams.toString()}&role=coach`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${getApiUrl()}/api/admin/users?${baseParams.toString()}&role=staff`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      const [allData, clientsData, coachesData, staffData] = await Promise.all([
        allResponse.ok ? allResponse.json() : { pagination: { total: 0 } },
        clientsResponse.ok ? clientsResponse.json() : { pagination: { total: 0 } },
        coachesResponse.ok ? coachesResponse.json() : { pagination: { total: 0 } },
        staffResponse.ok ? staffResponse.json() : { pagination: { total: 0 } }
      ]);

      setRoleCounts({
        all: allData.pagination?.total || 0,
        client: clientsData.pagination?.total || 0,
        coach: coachesData.pagination?.total || 0,
        staff: staffData.pagination?.total || 0
      });
    } catch (error) {
      console.error('Failed to fetch role counts:', error);
      // Keep existing counts on error
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    // Only apply search term filtering (client-side) since status and role are handled server-side
    if (searchTerm) {
      const filtered = users.filter(user => {
        const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredUsers(filtered);
    }
    // If no search term, filteredUsers should already be set from server response in fetchUsers()
  };

  const handleUserAction = async (userId: string, action: string, userType: string) => {

    // Check permissions for staff members
    if (!isAdmin && isStaff) {
      const permissionRequired = {
        deactivate: PERMISSIONS.USERS_STATUS,
        activate: PERMISSIONS.USERS_STATUS,
        suspend: PERMISSIONS.USERS_STATUS,
        approve: PERMISSIONS.USERS_STATUS,
        reject: PERMISSIONS.USERS_STATUS,
        delete: PERMISSIONS.USERS_DELETE
      };

      const permission = permissionRequired[action as keyof typeof permissionRequired];
      if (permission && !hasPermission(permission)) {
        showError(
          'Permission Required',
          `You don't have permission to ${action} users. Please contact an administrator if you need this access.`
        );
        setShowActionMenu(null);
        return;
      }
    }

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
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`Failed to ${action} user: ${response.status} - ${errorText}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(
        'Action Failed',
        errorMessage
      );
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update user status to ${newStatus}`);
      }

      // Update the user status in the local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: newStatus as any } : user
        )
      );

      setFilteredUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: newStatus as any } : user
        )
      );

      const statusMessages = {
        active: 'User has been activated successfully.',
        inactive: 'User has been deactivated successfully.',
        suspended: 'User has been suspended successfully.'
      };

      showInfo(
        'Status Updated',
        statusMessages[newStatus as keyof typeof statusMessages] || `User status updated to ${newStatus} successfully.`
      );

    } catch (error) {
      console.error(`Failed to change user status to ${newStatus}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(
        'Status Update Failed',
        errorMessage
      );
    }
  };

  const handleLoginAsUser = async (userId: string, userType: string, userName: string) => {
    // Check permission first
    if (!hasPermission(PERMISSIONS.USERS_IMPERSONATE)) {
      showError(
        'Permission Required',
        'You do not have permission to impersonate users. This feature is restricted to administrators for security reasons.'
      );
      setShowActionMenu(null);
      return;
    }

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
    // Check permission first
    if (!hasPermission(PERMISSIONS.USERS_DELETE)) {
      showError(
        'Permission Required',
        'You do not have permission to delete users. Please contact an administrator if you believe this user needs to be removed.'
      );
      setShowActionMenu(null);
      return;
    }

    const user = users.find(u => u.id === userId);
    const userName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'this user';

    const userTypeMessages = {
      client: 'This will permanently delete the client account including all appointment history, session notes, and personal data.',
      coach: 'This will permanently delete the coach account including all sessions, client relationships, earnings history, and profile information.',
      staff: 'This will permanently delete the staff account including all administrative permissions and activity history.'
    };

    showWarning(
      `Delete ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
      `Are you sure you want to delete ${userName}?\n\n${userTypeMessages[userType as keyof typeof userTypeMessages]}\n\nThis action cannot be undone.`,
      () => performDeleteUser(userId, userType),
      () => {} // Do nothing on cancel
    );
  };

  const performDeleteUser = async (userId: string, userType: string) => {
      try {
        const user = users.find(u => u.id === userId);
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
        const deletedUserName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
        showInfo(
          `${userType.charAt(0).toUpperCase() + userType.slice(1)} Deleted`,
          `${deletedUserName} has been permanently deleted from the system.`
        );
      } catch (error) {
        console.error('Failed to delete user:', error);
        showError(
          'Delete Failed',
          'Failed to delete user. Please check your connection and try again.'
        );
      }
  };

  const handleResetPassword = async (userId: string, userType: string, userName: string) => {
    // Check permission first for staff members
    if (!isAdmin && isStaff && !hasPermission(PERMISSIONS.USERS_RESET_PASSWORD)) {
      showError(
        'Permission Required',
        'You do not have permission to reset user passwords. Please contact an administrator if a user needs their password reset.'
      );
      setShowActionMenu(null);
      return;
    }

    showWarning(
      'Reset Password',
      `Are you sure you want to reset the password for ${userName}? A new temporary password will be generated and sent to their email address.`,
      () => performResetPassword(userId, userType, userName),
      () => {} // Do nothing on cancel
    );
  };

  const performResetPassword = async (userId: string, userType: string, userName: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userType })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setShowActionMenu(null);

      if (result.emailSent) {
        showInfo(
          'Password Reset Successful', 
          `Password has been reset for ${userName}. New credentials have been sent to their email address.`
        );
      } else {
        showWarning(
          'Password Reset Completed', 
          `Password has been reset for ${userName}, but the email notification failed to send. Please contact the user directly with their new credentials.\n\nError: ${result.emailError || 'Unknown email error'}`
        );
      }
      
    } catch (error) {
      console.error('Failed to reset password:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showError(
        'Password Reset Failed',
        `Failed to reset password for ${userName}: ${errorMessage}. Please try again.`
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
          const existingType = result.existingUserType || 'user';
          const title = `Email Already in Use`;
          const message = result.message || `A ${existingType} with this email already exists in the system. Please use a different email address or check if you need to modify the existing ${existingType} instead.`;
          
          showError(title, message);
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
          const existingType = result.existingUserType || 'user';
          const title = `Email Already in Use`;
          const message = result.message || `A ${existingType} with this email already exists in the system. Please use a different email address or check if you need to modify the existing ${existingType} instead.`;
          
          showError(title, message);
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

  const showSuccess = (title: string, message: string) => {
    showAlert({ type: 'success', title, message, confirmText: 'OK' });
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
      client: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      coach: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      staff: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  // User Action Menu Component for better organization and reusability
  const UserActionMenu = ({ user, onClose, onViewEdit, onMessage, onLoginAs, onResetPassword, onUserAction, onDelete, isMobile = false }: {
    user: User;
    onClose: () => void;
    onViewEdit: (user: User) => void;
    onMessage: (user: User) => void;
    onLoginAs: (userId: string, userType: string, userName: string) => void;
    onResetPassword: (userId: string, userType: string, userName: string) => void;
    onUserAction: (userId: string, action: string, userType: string) => void;
    onDelete: (userId: string, userType: string) => void;
    isMobile?: boolean;
  }) => {
    const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();

    const menuClass = isMobile
      ? "grid grid-cols-2 gap-2"
      : "absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700 py-1";

    const buttonClass = isMobile
      ? "flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-colors"
      : "flex items-center px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left transition-colors";

    return (
      <div className={menuClass}>
        <button
          onClick={() => onViewEdit(user)}
          className={`${buttonClass} ${
            isMobile
              ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          <Eye className="h-4 w-4 mr-2" />
          {isMobile ? 'View' : 'View Details'}
        </button>

        <PermissionGate permission={PERMISSIONS.USERS_EDIT}>
          <button
            onClick={() => onViewEdit(user)}
            className={`${buttonClass} ${
              isMobile
                ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isMobile ? 'Edit' : 'Edit Profile'}
          </button>
        </PermissionGate>

        <button
          onClick={() => onMessage(user)}
          className={`${buttonClass} ${
            isMobile
              ? 'border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {isMobile ? 'Message' : 'Send Message'}
        </button>

        <PermissionGate permission={PERMISSIONS.USERS_IMPERSONATE}>
          <button
            onClick={() => onLoginAs(user.id, user.role, userName)}
            className={`${buttonClass} ${
              isMobile
                ? 'border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {isMobile ? 'Login As' : 'Login As User'}
          </button>
        </PermissionGate>

        <button
          onClick={() => onResetPassword(user.id, user.role, userName)}
          className={`${buttonClass} ${
            isMobile
              ? 'border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              : 'text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
          }`}
        >
          <Key className="h-4 w-4 mr-2" />
          {isMobile ? 'Reset PWD' : 'Reset Password'}
        </button>

        {user.status === 'active' ? (
          <>
            <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
              <button
                onClick={() => onUserAction(user.id, 'deactivate', user.role)}
                className={`${buttonClass} ${
                  isMobile
                    ? 'border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    : 'text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                }`}
              >
                <UserX className="h-4 w-4 mr-2" />
                {isMobile ? 'Deactivate' : 'Deactivate User'}
              </button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
              <button
                onClick={() => onUserAction(user.id, 'suspend', user.role)}
                className={`${buttonClass} ${
                  isMobile
                    ? 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <Ban className="h-4 w-4 mr-2" />
                {isMobile ? 'Suspend' : 'Suspend User'}
              </button>
            </PermissionGate>
          </>
        ) : (
          <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
            <button
              onClick={() => onUserAction(user.id, 'activate', user.role)}
              className={`${buttonClass} ${
                isMobile
                  ? 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  : 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isMobile ? 'Activate' : user.status === 'suspended' ? 'Reactivate User' : 'Activate User'}
            </button>
          </PermissionGate>
        )}

        {user.role === 'coach' && user.status === 'pending' && (
          <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
            <button
              onClick={() => onUserAction(user.id, 'approve', user.role)}
              className={`${buttonClass} ${
                isMobile
                  ? 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  : 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isMobile ? 'Approve' : 'Approve Coach'}
            </button>
          </PermissionGate>
        )}

        <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
          <button
            onClick={() => onDelete(user.id, user.role)}
            className={`${buttonClass} ${
              isMobile
                ? 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 col-span-2'
                : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isMobile ? 'Delete User' : 'Delete User'}
          </button>
        </PermissionGate>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full">
          {/* Enhanced Header Skeleton */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start">
              <div className="flex-1">
                <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 animate-pulse mb-3"></div>
                <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 lg:gap-3 w-full lg:w-auto lg:ml-auto">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Tabs Skeleton */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
              <div className="flex space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-1 py-2.5 px-3 animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Filter Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 max-w-md h-11 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="w-full sm:w-40 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            </div>
          </div>

          {/* Enhanced Table/Cards Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Desktop skeleton */}
            <div className="hidden lg:block">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile skeleton */}
            <div className="lg:hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                          <div className="flex space-x-2">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col space-y-4 lg:flex-col">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                User Management
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                Manage all platform users including clients, coaches, and staff members. Add new users, update profiles, and control access permissions.
              </p>
              <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4 mr-1.5" />
                <span>{totalItems} {activeTab === 'all' ? 'total users' : `${activeTab}${totalItems !== 1 ? 's' : ''}`}</span>
              </div>
            </div>

            {/* Action Buttons - Mobile First Design */}
            <div className="flex-shrink-0 w-full lg:w-auto lg:ml-auto">
              {/* Mobile: Stack buttons vertically, Desktop: Horizontal layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 lg:gap-3">
                {/* Primary Actions */}
                <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors shadow-sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span>Add User</span>
                  </button>
                </PermissionGate>

                {/* Secondary Actions Group */}
                <div className="flex gap-2 lg:contents">
                  <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
                    <button
                      onClick={() => setShowCSVImportModal(true)}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 lg:px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors shadow-sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Import</span>
                      <span className="sm:hidden">Import</span>
                    </button>
                  </PermissionGate>

                  <PermissionGate permission={PERMISSIONS.USERS_VIEW}>
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 lg:px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors shadow-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Export</span>
                      <span className="sm:hidden">Export</span>
                    </button>
                  </PermissionGate>
                </div>

                {/* Staff Management Actions */}
                <div className="flex gap-2 lg:contents">
                  <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
                    <button
                      onClick={() => setShowStaffInviteModal(true)}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 lg:px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors shadow-sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Invite</span>
                      <span className="sm:hidden">Invite</span>
                    </button>
                  </PermissionGate>

                  <button
                    onClick={() => setShowStaffManagement(!showStaffManagement)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 lg:px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors shadow-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">{showStaffManagement ? 'Hide' : 'Manage'} Invitations</span>
                    <span className="lg:hidden">Manage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Tabs with horizontal scroll and fade indicators */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 relative">
            {/* Fade indicators for scrollable content */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none z-10 rounded-l-xl opacity-0 transition-opacity duration-200" id="scroll-fade-left"></div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10 rounded-r-xl opacity-0 transition-opacity duration-200" id="scroll-fade-right"></div>

            {/* Desktop: Grid layout, Mobile: Horizontal scroll */}
            <nav
              className="hidden sm:flex lg:grid lg:grid-cols-4 lg:gap-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:snap-none lg:overflow-visible scroll-smooth"
              role="tablist"
              aria-label="User type filters"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => {
                const container = e.target as HTMLElement;
                const fadeLeft = document.getElementById('scroll-fade-left');
                const fadeRight = document.getElementById('scroll-fade-right');

                if (fadeLeft && fadeRight) {
                  // Show/hide fade indicators based on scroll position
                  const canScrollLeft = container.scrollLeft > 10; // Small threshold to prevent flickering
                  const canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth - 10;

                  // Only show fade indicators on mobile/tablet screens
                  const isMobile = window.innerWidth < 1024; // lg breakpoint

                  fadeLeft.style.opacity = (canScrollLeft && isMobile) ? '1' : '0';
                  fadeRight.style.opacity = (canScrollRight && isMobile) ? '1' : '0';
                }
              }}
              ref={(nav) => {
                // Initialize fade indicators on mount
                if (nav) {
                  const fadeLeft = document.getElementById('scroll-fade-left');
                  const fadeRight = document.getElementById('scroll-fade-right');

                  if (fadeLeft && fadeRight) {
                    const isMobile = window.innerWidth < 1024;
                    const canScrollRight = nav.scrollWidth > nav.clientWidth;

                    fadeLeft.style.opacity = '0';
                    fadeRight.style.opacity = (canScrollRight && isMobile) ? '1' : '0';
                  }
                }
              }}
            >
              {[
                { key: 'all', label: 'All Users', count: roleCounts.all, icon: Users },
                { key: 'client', label: 'Clients', count: roleCounts.client, icon: User },
                { key: 'coach', label: 'Coaches', count: roleCounts.coach, icon: CircleUserRound },
                { key: 'staff', label: 'Staff', count: roleCounts.staff, icon: Users }
              ].map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key as any);
                      setCurrentPage(1); // Reset to first page when tab changes
                    }}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.key}`}
                    className={`
                      flex-shrink-0 lg:flex-shrink lg:w-auto
                      min-w-[140px] sm:min-w-[160px] lg:min-w-0
                      flex items-center justify-center gap-2
                      py-3 px-4
                      rounded-lg font-medium text-sm
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      dark:focus:ring-offset-gray-800
                      snap-center lg:snap-none
                      touch-manipulation
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${index === 0 ? 'ml-1 lg:ml-0' : ''}
                      ${index === 3 ? 'mr-1 lg:mr-0' : ''}
                    `}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />

                    {/* Responsive text display */}
                    <span className="hidden sm:inline lg:hidden xl:inline truncate">
                      {tab.label}
                    </span>
                    <span className="sm:hidden lg:inline xl:hidden truncate">
                      {tab.key === 'all' ? 'All' : tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}
                    </span>

                    {/* Count badge */}
                    <span className={`
                      inline-flex items-center justify-center
                      min-w-[1.25rem] h-5
                      text-xs font-medium rounded-full px-1.5
                      flex-shrink-0
                      ${isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }
                    `}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Alternative: Two-row layout for very small screens (xs breakpoint) */}
            <div className="sm:hidden">
              <div className="grid grid-cols-2 gap-1">
                {[
                  { key: 'all', label: 'All Users', count: roleCounts.all, icon: Users },
                  { key: 'client', label: 'Clients', count: roleCounts.client, icon: User },
                  { key: 'coach', label: 'Coaches', count: roleCounts.coach, icon: CircleUserRound },
                  { key: 'staff', label: 'Staff', count: roleCounts.staff, icon: Users }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={`alt-${tab.key}`}
                      onClick={() => {
                      setActiveTab(tab.key as any);
                      setCurrentPage(1); // Reset to first page when tab changes
                    }}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`tabpanel-${tab.key}`}
                      className={`
                        flex items-center justify-center gap-1.5
                        py-2.5 px-3
                        rounded-lg font-medium text-xs
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                        ${isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className="truncate text-xs">
                        {tab.key === 'all' ? 'All' : tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}
                      </span>
                      <span className={`
                        inline-flex items-center justify-center
                        min-w-[1rem] h-4
                        text-xs font-medium rounded-full px-1
                        flex-shrink-0
                        ${isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }
                      `}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alternative: Dropdown for very small screens (optional) */}
            <div className="hidden">
              <select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value as any);
                  setCurrentPage(1); // Reset to first page when tab changes
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                aria-label="Select user type filter"
              >
                <option value="all">All Users ({users.length})</option>
                <option value="client">Clients ({users.filter(u => u.role === 'client').length})</option>
                <option value="coach">Coaches ({users.filter(u => u.role === 'coach').length})</option>
                <option value="staff">Staff ({users.filter(u => u.role === 'staff').length})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          {/* Filter Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filter Users</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Refine your search with advanced filters</p>
                </div>
              </div>

              {/* Active Filter Count Badge */}
              {(startDate || endDate || statusFilter !== 'all' || searchTerm) && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    {[startDate, endDate, statusFilter !== 'all', searchTerm].filter(Boolean).length} active
                  </span>
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setStatusFilter('all');
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Search Bar - Full Width Priority */}
              <div>
                <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search Users</span>
                  </div>
                </label>
                <SearchInput
                  value={searchTerm}
                  onChange={(value) => {
                    setSearchTerm(value);
                    if (value) {
                      setSearchLoading(true);
                      setTimeout(() => setSearchLoading(false), 300);
                    } else {
                      setSearchLoading(false);
                    }
                  }}
                  placeholder="Search by name, email, or role..."
                  isLoading={searchLoading}
                  size="md"
                  className="w-full"
                />
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Status</span>
                    </div>
                  </label>
                  <div className="relative">
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Items Per Page */}
                <div>
                  <label htmlFor="items-per-page" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>Per Page</span>
                    </div>
                  </label>
                  <div className="relative">
                    <select
                      id="items-per-page"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value={10}>10 users</option>
                      <option value={20}>20 users</option>
                      <option value={50}>50 users</option>
                      <option value={100}>100 users</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Joined After Date */}
                <div>
                  <label htmlFor="joined-after" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Joined After</span>
                    </div>
                  </label>
                  <input
                    id="joined-after"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                {/* Joined Before Date */}
                <div>
                  <label htmlFor="joined-before" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Joined Before</span>
                    </div>
                  </label>
                  <input
                    id="joined-before"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Active Filter Tags */}
              {(startDate || endDate || statusFilter !== 'all' || searchTerm) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm border border-blue-200 dark:border-blue-800">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search: {searchTerm.substring(0, 20)}{searchTerm.length > 20 ? '...' : ''}
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm border border-green-200 dark:border-green-800">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status: {statusFilter}
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {startDate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm border border-purple-200 dark:border-purple-800">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      After: {new Date(startDate).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setStartDate('');
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {endDate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-sm border border-orange-200 dark:border-orange-800">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Before: {new Date(endDate).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setEndDate('');
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:bg-orange-100 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Results Summary */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Filtered results' : 'Total users'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Staff Management Section */}
      {showStaffManagement && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 lg:p-8">
          <StaffInvitationManager
            onError={showError}
            onSuccess={showInfo}
            onWarning={showWarning}
          />
          </div>
        </div>
      )}

      {/* Users Table - Desktop & Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profile_photo ? (
                          <img
                            src={user.profile_photo}
                            alt={`${user.name || user.first_name || 'User'} profile`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name ? user.name.charAt(0).toUpperCase() : (user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center max-w-[200px]" title={user.email}>
                          <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center max-w-[200px]">
                            <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{user.phone}</span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        data-action-menu
                        onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {showActionMenu === user.id && (
                        <div
                          data-action-menu
                          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                          style={{
                            zIndex: 9999,
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                          }}>

                          {/* Information & Profile Section */}
                          <div className="py-1">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Profile & Info
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                openEditModal(user);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 w-full text-left transition-colors duration-150"
                            >
                              <Eye className="h-4 w-4 mr-3 text-blue-500" />
                              View Details
                            </button>
                            {/* <PermissionGate permission={PERMISSIONS.USERS_EDIT}> */}
                              <button
                                onClick={() => {
                                  openEditModal(user);
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 w-full text-left transition-colors duration-150"
                              >
                                <Edit className="h-4 w-4 mr-3 text-blue-500" />
                                Edit Profile
                              </button>
                            {/* </PermissionGate> */}
                          </div>

                          {/* Communication & Access Section */}
                          <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Communication & Access
                              </p>
                            </div>
                            <button
                              onClick={() => handleMessageUser(user)}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400 w-full text-left transition-colors duration-150"
                            >
                              <MessageSquare className="h-4 w-4 mr-3 text-purple-500" />
                              Send Message
                            </button>
                            {/* <PermissionGate permission={PERMISSIONS.USERS_IMPERSONATE}> */}
                              <button
                                onClick={() => {
                                  handleLoginAsUser(user.id, user.role, user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim());
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 w-full text-left transition-colors duration-150"
                              >
                                <LogIn className="h-4 w-4 mr-3 text-indigo-500" />
                                Login As User
                              </button>
                            {/* </PermissionGate> */}
                          </div>

                          {/* Account Management Section */}
                          <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Account Management
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                handleResetPassword(user.id, user.role, user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim());
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-700 dark:hover:text-orange-400 w-full text-left transition-colors duration-150"
                            >
                              <Key className="h-4 w-4 mr-3 text-orange-500" />
                              Reset Password
                            </button>

                            {/* Status Management Actions */}
                            {user.status === 'active' ? (
                              <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
                                <button
                                  onClick={() => handleUserAction(user.id, 'deactivate', user.role)}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-400 w-full text-left transition-colors duration-150"
                                >
                                  <UserX className="h-4 w-4 mr-3 text-yellow-500" />
                                  Deactivate User
                                </button>
                              </PermissionGate>
                            ) : user.status === 'inactive' ? (
                              <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate', user.role)}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 w-full text-left transition-colors duration-150"
                                >
                                  <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                                  Activate User
                                </button>
                              </PermissionGate>
                            ) : user.status === 'suspended' ? (
                              <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate', user.role)}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 w-full text-left transition-colors duration-150"
                                >
                                  <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                                  Reactivate User
                                </button>
                              </PermissionGate>
                            ) : (
                              <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate', user.role)}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 w-full text-left transition-colors duration-150"
                                >
                                  <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                                  Activate User
                                </button>
                              </PermissionGate>
                            )}

                            {/* Coach Approval */}
                            {user.role === 'coach' && user.status === 'pending' && (
                              <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
                                <button
                                  onClick={() => handleUserAction(user.id, 'approve', user.role)}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 w-full text-left transition-colors duration-150"
                                >
                                  <CheckCircle className="h-4 w-4 mr-3 text-emerald-500" />
                                  Approve Coach
                                </button>
                              </PermissionGate>
                            )}
                          </div>

                          {/* Security Actions Section */}
                          <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Security Actions
                              </p>
                            </div>

                            {/* Suspend Action (only for active users) */}
                            {user.status === 'active' && (
                              <PermissionGate permission={PERMISSIONS.USERS_STATUS}>
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend', user.role)}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 w-full text-left transition-colors duration-150"
                                >
                                  <Ban className="h-4 w-4 mr-3 text-red-500" />
                                  Suspend User
                                </button>
                              </PermissionGate>
                            )}

                            {/* Delete Action */}
                            <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.role)}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 w-full text-left transition-colors duration-150 border-t border-red-100 dark:border-red-900/30"
                              >
                                <Trash2 className="h-4 w-4 mr-3 text-red-600" />
                                <span className="font-medium">Delete User</span>
                              </button>
                            </PermissionGate>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {isLoading ? 'Loading users...' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="xl:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? filteredUsers.map((user) => (
            <div key={`mobile-${user.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="space-y-3">
                {/* Header with Role and Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </div>
                  <div className="relative" data-user-action-container>
                    <button
                      data-action-menu
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionMenu(showActionMenu === user.id ? null : user.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {showActionMenu === user.id && (
                      <>
                        {/* Mobile backdrop */}
                        <div
                          className="fixed inset-0 bg-black/20 sm:hidden z-[9998]"
                          onClick={() => setShowActionMenu(null)}
                        />
                        <div
                          data-action-menu
                          className="fixed sm:absolute right-2 sm:right-0 sm:top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999]"
                          style={{
                            bottom: typeof window !== 'undefined' && window.innerWidth < 640 ? '20px' : 'auto',
                            maxHeight: typeof window !== 'undefined' && window.innerWidth < 640 ? 'calc(100vh - 100px)' : 'auto',
                            overflowY: typeof window !== 'undefined' && window.innerWidth < 640 ? 'auto' : 'visible'
                          }}
                        >
                        {/* Information & Profile Section */}
                        <div className="py-1">
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              User Actions
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowActionMenu(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left"
                          >
                            <Eye className="h-4 w-4 mr-3" />
                            View Profile
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditMode(true);
                              // Pre-populate form with user data
                              setFormData({
                                firstName: user.first_name || user.name?.split(' ')[0] || '',
                                lastName: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
                                email: user.email || '',
                                phone: user.phone || '',
                                userType: user.role || 'client',
                                status: user.status || 'active'
                              });
                              setShowUserModal(true);
                              setShowActionMenu(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full text-left"
                          >
                            <Edit className="h-4 w-4 mr-3" />
                            Edit User
                          </button>

                          <button
                            onClick={() => handleMessageUser(user)}
                            className="flex items-center px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full text-left"
                          >
                            <Mail className="h-4 w-4 mr-3" />
                            Send Message
                          </button>

                          <button
                            onClick={() => {
                              handleLoginAsUser(user.id, user.role, user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim());
                              setShowActionMenu(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 w-full text-left"
                          >
                            <LogIn className="h-4 w-4 mr-3" />
                            Login As User
                          </button>

                          <button
                            onClick={() => {
                              handleResetPassword(user.id, user.role, user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim());
                              setShowActionMenu(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 w-full text-left"
                          >
                            <Key className="h-4 w-4 mr-3" />
                            Reset Password
                          </button>
                        </div>

                        {/* Status Actions */}
                        <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status Actions
                            </p>
                          </div>

                          {user.status === 'suspended' ? (
                            <button
                              onClick={() => handleStatusChange(user.id, 'active')}
                              className="flex items-center px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 w-full text-left"
                            >
                              <CheckCircle className="h-4 w-4 mr-3" />
                              Activate User
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setAlertData({
                                  type: 'warning',
                                  title: 'Suspend User',
                                  message: `Are you sure you want to suspend ${user.name || user.email}? They will not be able to access their account.`,
                                  onConfirm: () => handleStatusChange(user.id, 'suspended'),
                                  confirmText: 'Suspend User',
                                  showCancel: true
                                });
                                setShowAlertModal(true);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 w-full text-left"
                            >
                              <Ban className="h-4 w-4 mr-3" />
                              Suspend User
                            </button>
                          )}

                          {user.status !== 'inactive' && (
                            <button
                              onClick={() => handleStatusChange(user.id, 'inactive')}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left"
                            >
                              <XCircle className="h-4 w-4 mr-3" />
                              Deactivate User
                            </button>
                          )}
                        </div>

                        {/* Danger Zone */}
                        <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">
                              Danger Zone
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setAlertData({
                                type: 'error',
                                title: 'Delete User',
                                message: `Are you sure you want to permanently delete ${user.name || user.email}? This action cannot be undone and will remove all associated data.`,
                                onConfirm: () => handleDeleteUser(user.id, user.role),
                                confirmText: 'Delete User',
                                showCancel: true
                              });
                              setShowAlertModal(true);
                              setShowActionMenu(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                          >
                            <Trash2 className="h-4 w-4 mr-3" />
                            Delete User
                          </button>
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                </div>

                {/* User Information */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    {user.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={`${user.name || user.first_name || 'User'} profile`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name ? user.name.charAt(0).toUpperCase() : (user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center" title={user.email}>
                      <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="break-words">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="break-words">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates Information */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <span className="font-medium">Joined:</span> {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Login:</span> {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">
                {isLoading ? 'Loading users...' : 'No users found'}
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            showItemsRange={true}
          />
        </div>
      </div>

        {/* Enhanced User Modal with Better Mobile Support */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
              {/* Modal Header - Fixed */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditMode ? 'Edit User Profile' : 'Create New User'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {isEditMode ? 'Update user information and settings' : 'Add a new user to the platform'}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">

                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  isEditMode ? handleUpdateUser() : handleCreateUser();
                }}>
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Basic Information</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Personal details and contact information</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Account Settings Section */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Account Settings</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">User role and account status configuration</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          User Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="userType"
                          value={formData.userType}
                          onChange={(e) => setFormData({ ...formData, userType: e.target.value as any })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                          disabled={isEditMode}
                        >
                          <option value="client">Client</option>
                          <option value="coach">Coach</option>
                          <option value="staff">Staff</option>
                        </select>
                        {isEditMode && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">User type cannot be changed after creation</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Account Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          {formData.userType === 'coach' && (
                            <>
                              <option value="pending">Pending Approval</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

              {/* Role-specific fields */}
              {formData.userType === 'client' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Client Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dob || ''}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gender Identity
                      </label>
                      <input
                        type="text"
                        value={formData.genderIdentity || ''}
                        onChange={(e) => setFormData({ ...formData, genderIdentity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Male, Female, Non-binary, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ethnic Identity
                      </label>
                      <input
                        type="text"
                        value={formData.ethnicIdentity || ''}
                        onChange={(e) => setFormData({ ...formData, ethnicIdentity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Religious Background
                      </label>
                      <input
                        type="text"
                        value={formData.religiousBackground || ''}
                        onChange={(e) => setFormData({ ...formData, religiousBackground: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.userType === 'coach' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Coach Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={formData.yearsExperience || ''}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hourly Rate (USD)
                      </label>
                      <input
                        type="number"
                        value={formData.hourlyRate || ''}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formData.userType === 'staff' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Staff Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department || ''}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role Level
                      </label>
                      <select
                        value={formData.roleLevel || 'staff'}
                        onChange={(e) => setFormData({ ...formData, roleLevel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <h4 className="font-medium text-gray-900 dark:text-white">Advanced Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <span className="text-sm text-gray-700 dark:text-white">Email Verified</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.profileComplete !== false}
                        onChange={(e) => setFormData({ ...formData, profileComplete: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-white">Profile Complete</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={formData.adminNotes || ''}
                      onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                      rows={3}
                      placeholder="Internal notes about this user (not visible to the user)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

                </form>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex-shrink-0 px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={isEditMode ? handleUpdateUser : handleCreateUser}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isEditMode ? 'Update User' : 'Create User'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Alert Modal */}
        {showAlertModal && alertData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                    alertData.type === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
                    alertData.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    alertData.type === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                    'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    {alertData.type === 'error' && <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />}
                    {alertData.type === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
                    {alertData.type === 'success' && <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />}
                    {alertData.type === 'info' && <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {alertData.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {alertData.message}
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                  {alertData.showCancel && (
                    <button
                      onClick={() => {
                        alertData.onCancel?.();
                        closeAlertModal();
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors font-medium"
                    >
                      {alertData.cancelText || 'Cancel'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      alertData.onConfirm?.();
                      closeAlertModal();
                    }}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${
                      alertData.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' :
                      alertData.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500' :
                      alertData.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' :
                      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                    }`}
                  >
                    {alertData.confirmText || 'OK'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Success Modal for User Creation */}
        {showSuccessModal && successData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {successData.userType.charAt(0).toUpperCase() + successData.userType.slice(1)} Created Successfully!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    The new {successData.userType} account has been created. Please share these credentials securely with the user.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={successData.email}
                        readOnly
                        className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
                      />
                      <button
                        onClick={() => copyToClipboard(successData.email)}
                        className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="Copy email"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Temporary Password
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={successData.password}
                        readOnly
                        className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(successData.password)}
                        className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="Copy password"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Important:</strong> The user should change their password upon first login for security. Make sure to share these credentials through a secure channel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => {
                      copyToClipboard(`Email: ${successData.email}\nPassword: ${successData.password}`);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Both</span>
                  </button>
                  <button
                    onClick={closeSuccessModal}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        <CSVImportModal
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onImportComplete={() => {
            fetchUsers();
            showInfo('Import Complete', 'Users have been successfully imported');
          }}
        />

        {/* Staff Invitation Modal */}
        <StaffInvitationModal
          isOpen={showStaffInviteModal}
          onClose={() => setShowStaffInviteModal(false)}
          onSuccess={(message) => {
            showInfo('Invitation Sent', message);
            // Refresh staff management if it's open
            if (showStaffManagement) {
              // The StaffInvitationManager will refresh automatically via its useEffect
            }
          }}
          onError={showError}
        />
      </div>
    </div>
  );
}