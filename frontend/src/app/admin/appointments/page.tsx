'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical,
  Video,
  MapPin,
  MessageSquare,
  Edit,
  Save,
  FileText,
  BarChart3
} from 'lucide-react';
import SearchInput from '@/components/ui/search-input';
import Pagination from '@/components/ui/pagination';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import RescheduleModal from '@/components/RescheduleModal';
import NotificationModal from '@/components/NotificationModal';
import useNotification from '@/hooks/useNotification';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  coachName: string;
  coachEmail: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'confirmed';
  type: 'video' | 'in-person';
  notes?: string;
  created_at: string;
  sessionNotes?: string;
  client_id?: string;
  coach_id?: string;
  clientPhoto?: string;
  coachPhoto?: string;
  adminNotes?: string;
  cancellationReason?: string;
}

export default function AppointmentManagement() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const { notification, hideNotification, showError, showConfirm } = useNotification();

  const handleMessageClient = (appointment: Appointment) => {
    if (!appointment.client_id) {
      alert('Client ID not available for this appointment. Cannot send message.');
      return;
    }
    
    const params = new URLSearchParams({
      conversation_with: appointment.client_id,
      partner_name: encodeURIComponent(appointment.clientName),
      partner_role: 'client'
    });
    router.push(`/admin/messages?${params.toString()}`);
    setShowActionMenu(null);
  };

  const handleMessageCoach = (appointment: Appointment) => {
    if (!appointment.coach_id) {
      alert('Coach ID not available for this appointment. Cannot send message.');
      return;
    }
    
    const params = new URLSearchParams({
      conversation_with: appointment.coach_id,
      partner_name: encodeURIComponent(appointment.coachName),
      partner_role: 'coach'
    });
    router.push(`/admin/messages?${params.toString()}`);
    setShowActionMenu(null);
  };

  const saveAdminNotes = async (appointmentId: string, notes: string) => {
    setIsSavingNotes(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/api/admin/appointments/${appointmentId}/notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes: notes })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save notes: ${errorText}`);
      }

      // Update the appointment in state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, adminNotes: notes } : apt
      ));
      
      setIsEditingNotes(false);
      setEditingNotesText('');
      
    } catch (error) {
      console.error('Error saving admin notes:', error);
      showError('Save Error', `Failed to save notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingNotes(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, itemsPerPage, statusFilter, startDate, endDate]);

  // Debounce search term
  useEffect(() => {
    if (searchTerm === '') {
      setSearchLoading(false);
      filterAppointments();
      return;
    }

    setSearchLoading(true);
    const timeoutId = setTimeout(() => {
      filterAppointments();
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, appointments]);

  useEffect(() => {
    filterAppointments();
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        showError('Authentication Error', 'No authentication token found. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const API_URL = getApiUrl();
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const url = `${API_URL}/api/admin/appointments?${queryParams}`;
      console.log('Fetching appointments from:', url);
      console.log('Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, removing token and redirecting');
          localStorage.removeItem('token');
          showError('Session Expired', 'Your session has expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        showError('Fetch Error', `Failed to fetch appointments: HTTP ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: Failed to fetch appointments`);
      }

      const data = await response.json();
      console.log('Raw response data:', data);

      const appointmentsArray = Array.isArray(data) ? data : (data.appointments || data.data || []);
      const pagination = data.pagination || {};

      console.log('Processed appointments array:', appointmentsArray);
      console.log('Pagination info:', pagination);
      console.log('Number of appointments:', appointmentsArray.length);

      // Update pagination state
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);
      
      // Transform the data to match our interface
      const transformedAppointments: Appointment[] = appointmentsArray.map((apt: any) => ({
        id: apt.id,
        clientName: apt.clientName || 'Unknown Client',
        clientEmail: apt.clientEmail || 'N/A',
        clientPhoto: apt.clientPhoto || '',
        coachName: apt.coachName || 'Unknown Coach',
        coachEmail: apt.coachEmail || 'N/A',
        coachPhoto: apt.coachPhoto || '',
        date: apt.date || new Date().toISOString().split('T')[0],
        time: apt.time || '00:00',
        duration: apt.duration || 60,
        status: apt.status || 'scheduled',
        type: apt.type || 'video',
        notes: apt.notes || '',
        created_at: apt.created_at || new Date().toISOString(),
        sessionNotes: apt.sessionNotes || undefined,
        client_id: apt.client_id,
        coach_id: apt.coach_id,
        adminNotes: apt.adminNotes || '',
        cancellationReason: apt.cancellationReason || ''
      }));
      
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showError('Load Error', `Failed to load appointments: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Only apply search term filtering (client-side) since status and date are handled server-side
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.coachName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.coachEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string, reason?: string) => {
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/api/admin/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || '',
          cancellationReason: newStatus === 'cancelled' ? reason : undefined
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update appointment: ${errorText}`);
      }

      // Update the appointment in state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { 
          ...apt, 
          status: newStatus as any,
          cancellationReason: newStatus === 'cancelled' ? reason : apt.cancellationReason
        } : apt
      ));
      
      setShowActionMenu(null);
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showError('Update Error', `Failed to update appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelWithReason = (appointmentId: string) => {
    setSelectedAppointment(appointments.find(apt => apt.id === appointmentId) || null);
    setShowCancellationModal(true);
    setShowActionMenu(null);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    const confirmMessage = `Are you sure you want to mark this appointment as ${newStatus.toUpperCase()}?`;
    
    if (newStatus === 'cancelled') {
      // Use the special cancellation modal with reason
      handleCancelWithReason(appointmentId);
    } else {
      showConfirm(
        'Update Status',
        confirmMessage,
        async () => {
          await updateAppointmentStatus(appointmentId, newStatus);
        },
        'Confirm',
        'Cancel'
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock, label: 'Scheduled' },
      confirmed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: CheckCircle, label: 'Confirmed' },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle, label: 'Cancelled' },
      'no-show': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: AlertCircle, label: 'No Show' },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock, label: 'Pending' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      icon: AlertCircle,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === 'video' ? (
      <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
    );
  };

  const formatDateTime = (date: string, time: string) => {
    const appointmentDate = new Date(`${date}T${time}`);
    return {
      date: appointmentDate.toLocaleDateString(),
      time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    noShow: appointments.filter(a => a.status === 'no-show').length
  };

  if (isLoading) {
    return (
      <div className="w-full">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse mb-3"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        {/* Filters Skeleton */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage all platform appointments
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/appointments/reports')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">No Shows</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.noShow}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* Search Input - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Appointments
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client, coach, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filter Selects - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Per Page
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            {/* Apply Button - Full Width on Mobile */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <button
                onClick={() => fetchAppointments()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Date Filters and Clear Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            {(startDate || endDate || statusFilter !== 'all' || searchTerm) && (
              <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setStatusFilter('all');
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Table - Desktop & Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        {/* Desktop Table View */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.date, appointment.time);
                return (
                  <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {appointment.clientPhoto ? (
                            <img
                              src={appointment.clientPhoto}
                              alt={`${appointment.clientName} profile`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{appointment.clientName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={appointment.clientEmail}>{appointment.clientEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {appointment.coachPhoto ? (
                            <img
                              src={appointment.coachPhoto}
                              alt={`${appointment.coachName} profile`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{appointment.coachName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={appointment.coachEmail}>{appointment.coachEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {date}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {time} ({appointment.duration} min)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(appointment.type)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                          {appointment.type === 'video' ? 'Video Call' : 'In Person'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === appointment.id ? null : appointment.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {showActionMenu === appointment.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowAppointmentModal(true);
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setEditingNotesText(appointment.adminNotes || '');
                                  setIsEditingNotes(true);
                                  setShowAppointmentModal(true);
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Edit Client Notes
                              </button>
                              
                              {/* Message Actions */}
                              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                              
                              <button
                                onClick={() => handleMessageClient(appointment)}
                                className="flex items-center px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full text-left"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message Client
                              </button>
                              
                              <button
                                onClick={() => handleMessageCoach(appointment)}
                                className="flex items-center px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full text-left"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message Coach
                              </button>
                              
                              {/* Status Actions */}
                              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                              
                              {appointment.status !== 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                  disabled={isUpdatingStatus}
                                  className="flex items-center px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full text-left disabled:opacity-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Confirmed
                                </button>
                              )}
                              
                              {appointment.status !== 'completed' && (
                                <button
                                  onClick={() => handleStatusChange(appointment.id, 'completed')}
                                  disabled={isUpdatingStatus}
                                  className="flex items-center px-4 py-2 text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 w-full text-left disabled:opacity-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </button>
                              )}
                              
                              {appointment.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                  disabled={isUpdatingStatus}
                                  className="flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Appointment
                                </button>
                              )}
                              
                              {appointment.status !== 'no-show' && (
                                <button
                                  onClick={() => handleStatusChange(appointment.id, 'no-show')}
                                  disabled={isUpdatingStatus}
                                  className="flex items-center px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 w-full text-left disabled:opacity-50"
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Mark as No Show
                                </button>
                              )}
                              
                              {/* Reschedule Action */}
                              {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                                <>
                                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                  <button
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setShowRescheduleModal(true);
                                      setShowActionMenu(null);
                                    }}
                                    disabled={isUpdatingStatus}
                                    className="flex items-center px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full text-left disabled:opacity-50"
                                  >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Reschedule
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="xl:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAppointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.date, appointment.time);
            return (
              <div key={`mobile-${appointment.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="space-y-3">
                  {/* Header with Status and Type */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(appointment.status)}
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        {getTypeIcon(appointment.type)}
                        <span className="capitalize">
                          {appointment.type === 'video' ? 'Video' : 'In Person'}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === appointment.id ? null : appointment.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {showActionMenu === appointment.id && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowAppointmentModal(true);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </button>

                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setEditingNotesText(appointment.adminNotes || '');
                                setIsEditingNotes(true);
                                setShowAppointmentModal(true);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Edit Notes
                            </button>

                            {/* Message Actions */}
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                            <button
                              onClick={() => handleMessageClient(appointment)}
                              className="flex items-center px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full text-left"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Client
                            </button>

                            <button
                              onClick={() => handleMessageCoach(appointment)}
                              className="flex items-center px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full text-left"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Coach
                            </button>

                            {/* Status Actions */}
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                            {appointment.status !== 'confirmed' && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                disabled={isUpdatingStatus}
                                className="flex items-center px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full text-left disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Confirmed
                              </button>
                            )}

                            {appointment.status !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, 'completed')}
                                disabled={isUpdatingStatus}
                                className="flex items-center px-4 py-2 text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 w-full text-left disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </button>
                            )}

                            {appointment.status !== 'cancelled' && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                disabled={isUpdatingStatus}
                                className="flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Appointment
                              </button>
                            )}

                            {appointment.status !== 'no-show' && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, 'no-show')}
                                disabled={isUpdatingStatus}
                                className="flex items-center px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 w-full text-left disabled:opacity-50"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Mark as No Show
                              </button>
                            )}

                            {/* Reschedule Action */}
                            {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                              <>
                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                <button
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowRescheduleModal(true);
                                    setShowActionMenu(null);
                                  }}
                                  disabled={isUpdatingStatus}
                                  className="flex items-center px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full text-left disabled:opacity-50"
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Reschedule
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client and Coach Info */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Client */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-8 w-8">
                          {appointment.clientPhoto ? (
                            <img
                              src={appointment.clientPhoto}
                              alt={`${appointment.clientName} profile`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{appointment.clientName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 break-words">{appointment.clientEmail}</div>
                        </div>
                      </div>
                    </div>

                    {/* Coach */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coach</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-8 w-8">
                          {appointment.coachPhoto ? (
                            <img
                              src={appointment.coachPhoto}
                              alt={`${appointment.coachName} profile`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{appointment.coachName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 break-words">{appointment.coachEmail}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{time} ({appointment.duration} min)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              showItemsRange={true}
            />
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Details</h3>
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  setSelectedAppointment(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <div className="flex items-center mt-1">
                    {getTypeIcon(selectedAppointment.type)}
                    <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                      {selectedAppointment.type === 'video' ? 'Video Call' : 'In Person'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.clientName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAppointment.clientEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coach</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.coachName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAppointment.coachEmail}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(selectedAppointment.date, selectedAppointment.time).date}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(selectedAppointment.date, selectedAppointment.time).time}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.duration} minutes</p>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.notes}</p>
                </div>
              )}
              
              {selectedAppointment.sessionNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Notes</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.sessionNotes}</p>
                </div>
              )}

              {/* Admin Notes Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Notes</label>
                  {!isEditingNotes && (
                    <button
                      onClick={() => {
                        setEditingNotesText(selectedAppointment.adminNotes || '');
                        setIsEditingNotes(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingNotesText}
                      onChange={(e) => setEditingNotesText(e.target.value)}
                      placeholder="Add administrative notes about this client or appointment..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsEditingNotes(false);
                          setEditingNotesText('');
                        }}
                        className="px-3 py-1 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveAdminNotes(selectedAppointment.id, editingNotesText)}
                        disabled={isSavingNotes}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
                      >
                        {isSavingNotes && <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-1"></div>}
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white min-h-[1.5rem]">
                    {selectedAppointment.adminNotes || (
                      <span className="text-gray-400 dark:text-gray-500 italic">No admin notes yet</span>
                    )}
                  </p>
                )}
              </div>

              {/* Cancellation Reason */}
              {selectedAppointment.cancellationReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cancellation Reason</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.cancellationReason}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(selectedAppointment.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => handleMessageClient(selectedAppointment)}
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Message Client</span>
                </button>
                <button
                  onClick={() => handleMessageCoach(selectedAppointment)}
                  className="px-4 py-2 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Message Coach</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  setSelectedAppointment(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          appointment={{
            id: selectedAppointment.id,
            client_id: 'admin-reschedule', // Admin can reschedule any appointment
            coach_id: selectedAppointment.id, // Will be handled by the component
            starts_at: `${selectedAppointment.date}T${selectedAppointment.time}`,
            ends_at: `${selectedAppointment.date}T${selectedAppointment.time}`, // Will calculate end time
            status: selectedAppointment.status,
            clients: {
              first_name: selectedAppointment.clientName.split(' ')[0] || '',
              last_name: selectedAppointment.clientName.split(' ')[1] || ''
            }
          }}
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
            fetchAppointments(); // Refresh the appointments list
          }}
        />
      )}

      {/* Cancellation Modal */}
      {showCancellationModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel Appointment</h3>
              <button
                onClick={() => {
                  setShowCancellationModal(false);
                  setSelectedAppointment(null);
                  setCancellationReason('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to cancel this appointment? This action will notify both the client and coach about the cancellation.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for the cancellation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCancellationModal(false);
                    setSelectedAppointment(null);
                    setCancellationReason('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={async () => {
                    if (selectedAppointment) {
                      await updateAppointmentStatus(selectedAppointment.id, 'cancelled', cancellationReason);
                      setShowCancellationModal(false);
                      setSelectedAppointment(null);
                      setCancellationReason('');
                    }
                  }}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {isUpdatingStatus && <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>}
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        onConfirm={notification.onConfirm}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
        loading={notification.loading}
      />
    </div>
  );
}