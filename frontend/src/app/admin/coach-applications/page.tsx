'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, User, Users, Check, AlertTriangle, FileCheck, MessageSquare, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CoachApplicationSkeleton from '@/components/CoachApplicationSkeleton';
import SearchInput from '@/components/ui/search-input';
import Pagination from '@/components/ui/pagination';

// Simple Badge component since ui/badge doesn't exist
const Badge = ({ children, className = '', variant = 'default' }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface CoachApplication {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  coaching_expertise?: string[] | null;
  coaching_experience_years: string;
  act_training_level: string;
  languages_fluent?: string[] | null;
  coach_id?: string; // The actual coach user ID if application is approved
}

interface ApplicationDetails extends CoachApplication {
  educational_background: string;
  professional_certifications?: string[] | null;
  age_groups_comfortable?: string[] | null;
  coaching_philosophy: string;
  coaching_techniques?: string[] | null;
  session_structure: string;
  scope_handling_approach: string;
  professional_discipline_history: boolean;
  discipline_explanation?: string;
  boundary_maintenance_approach: string;
  comfortable_with_suicidal_thoughts: string;
  self_harm_protocol: string;
  weekly_hours_available: string;
  preferred_session_length: string;
  availability_times?: string[] | null;
  video_conferencing_comfort: string;
  internet_connection_quality: string;
  references: Array<{
    name: string;
    title: string;
    organization: string;
    email: string;
    phone?: string;
  }>;
  agreements_accepted: Record<string, boolean>;
}

export default function CoachApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();

  const handleMessageApplicant = (application: CoachApplication) => {
    const userName = `${application.first_name} ${application.last_name}`;
    
    // Use coach_id if available (for approved applications), otherwise use application.id
    // This ensures we use the actual coach user ID for messaging when possible
    const conversationId = application.coach_id || application.id;
    
    console.log('Messaging applicant:', {
      applicationId: application.id,
      coachId: application.coach_id,
      status: application.status,
      conversationId,
      note: application.coach_id ? 'Using coach_id for existing coach' : 'Using application.id for pending application'
    });
    
    const params = new URLSearchParams({
      conversation_with: conversationId,
      partner_name: encodeURIComponent(userName),
      partner_role: 'coach'
    });
    router.push(`/admin/messages?${params.toString()}`);
  };

  // Debounce search term
  useEffect(() => {
    if (searchTerm === '') {
      // If search is cleared, fetch immediately
      setSearchLoading(false);
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        fetchApplications(storedToken);
      }
      return;
    }

    // Show search loading when user starts typing
    setSearchLoading(true);

    // Debounce search requests
    const timeoutId = setTimeout(() => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        fetchApplications(storedToken).finally(() => {
          setSearchLoading(false);
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch for other filters immediately
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      fetchApplications(storedToken);
    }
  }, [statusFilter, experienceFilter, sortBy, sortOrder, currentPage, itemsPerPage, startDate, endDate]);

  const fetchApplications = async (authToken?: string) => {
    try {
      setLoading(true);
      
      // Get token from parameter or localStorage
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (experienceFilter !== 'all') params.append('experience', experienceFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const url = `${getApiUrl()}/api/coach-applications/applications?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();

      const applicationsArray = data.applications || [];
      const pagination = data.pagination || {};

      // Update pagination state
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);

      // Set applications directly since search is handled server-side
      setApplications(applicationsArray);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/coach-applications/applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      setSelectedApplication(data.application);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, reason?: string) => {
    try {
      setActionLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setActionLoading(false);
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/coach-applications/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reason,
          reviewerId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh applications list
      await fetchApplications();
      setShowModal(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Rejected' },
      suspended: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', label: 'Suspended' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <CoachApplicationSkeleton count={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coach Applications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and manage coach verification applications
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
            </div>
            <FileCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{applications.filter(app => app.status === 'pending').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{applications.filter(app => app.status === 'approved').length}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{applications.filter(app => app.status === 'under_review').length}</p>
            </div>
            <User className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filter Applications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Refine your search to find specific applications</p>
              </div>
            </div>

            {/* Active Filter Count Badge */}
            {(startDate || endDate || statusFilter !== 'all' || searchTerm) && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
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
                  <X className="w-4 h-4 mr-1.5" />
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
              <label htmlFor="application-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Search Applications</span>
                </div>
              </label>
              <SearchInput
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                  if (value) {
                    setSearchLoading(true);
                    setTimeout(() => setSearchLoading(false), 300);
                  } else {
                    setSearchLoading(false);
                  }
                }}
                placeholder="Search by name, email, or expertise..."
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
                    <FileCheck className="w-4 h-4 text-gray-500 dark:text-gray-400" />
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
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
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
                    <option value={5}>5 applications</option>
                    <option value={10}>10 applications</option>
                    <option value={20}>20 applications</option>
                    <option value={50}>50 applications</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Submitted After Date */}
              <div>
                <label htmlFor="submitted-after" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Submitted After</span>
                  </div>
                </label>
                <input
                  id="submitted-after"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* Submitted Before Date */}
              <div>
                <label htmlFor="submitted-before" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Submitted Before</span>
                  </div>
                </label>
                <input
                  id="submitted-before"
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
                    <Search className="w-3.5 h-3.5" />
                    Search: {searchTerm.substring(0, 20)}{searchTerm.length > 20 ? '...' : ''}
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                      aria-label="Clear search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm border border-green-200 dark:border-green-800">
                    <FileCheck className="w-3.5 h-3.5" />
                    Status: {statusFilter.replace('_', ' ')}
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setCurrentPage(1);
                      }}
                      className="ml-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                      aria-label="Clear status filter"
                    >
                      <X className="w-3 h-3" />
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
                      aria-label="Clear start date filter"
                    >
                      <X className="w-3 h-3" />
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
                      aria-label="Clear end date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Summary */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <FileCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Filtered applications' : 'Total applications'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="grid gap-3 sm:gap-4">
        {loading ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
              </div>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center py-8">
              <div className="space-y-2">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No applications found</p>
                {(searchTerm || statusFilter !== 'all' || startDate || endDate) ? (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Try adjusting your filters or search terms
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    No coach applications have been submitted yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mb-3">
                      <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-white">
                        {application.first_name} {application.last_name}
                      </h3>
                      <div className="flex-shrink-0">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="space-y-1">
                        <p className="break-all"><strong>Email:</strong> {application.email}</p>
                        <p><strong>Phone:</strong> {application.phone || 'Not provided'}</p>
                        <p><strong>Experience:</strong> {application.coaching_experience_years}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="break-words"><strong>ACT Training:</strong> {application.act_training_level}</p>
                        <p className="break-words"><strong>Languages:</strong> {application.languages_fluent?.join(', ') || 'Not specified'}</p>
                        <p className="break-words"><strong>Submitted:</strong> {formatDate(application.submitted_at)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                        <strong>Expertise:</strong> {application.coaching_expertise?.slice(0, 3).join(', ') || 'Not specified'}
                        {application.coaching_expertise && application.coaching_expertise.length > 3 && ` +${application.coaching_expertise.length - 3} more`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2 lg:ml-4 flex-shrink-0 coach-app-buttons">
                    <Button
                      onClick={() => fetchApplicationDetails(application.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 lg:flex-none min-h-[44px] text-xs sm:text-sm focus-ring"
                    >
                      Review
                    </Button>
                    
                    <Button
                      onClick={() => handleMessageApplicant(application)}
                      variant="outline"
                      size="sm"
                      className="flex-1 lg:flex-none min-h-[44px] text-xs sm:text-sm focus-ring text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Message</span>
                    </Button>
                    
                    {application.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateApplicationStatus(application.id, 'approved')}
                          size="sm"
                          className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 min-h-[44px] text-xs sm:text-sm focus-ring"
                        >
                          <span className="hidden sm:inline">Quick </span>Approve
                        </Button>
                        <Button
                          onClick={() => updateApplicationStatus(application.id, 'rejected', 'Application did not meet requirements')}
                          size="sm"
                          variant="destructive"
                          className="flex-1 lg:flex-none min-h-[44px] text-xs sm:text-sm focus-ring"
                        >
                          <span className="hidden sm:inline">Quick </span>Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => {
            setShowModal(false);
            setSelectedApplication(null);
          }}
          onStatusUpdate={updateApplicationStatus}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Application Details Modal Component
const ApplicationDetailsModal = ({
  application,
  onClose,
  onStatusUpdate,
  loading
}: {
  application: ApplicationDetails;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, reason?: string) => Promise<void>;
  loading: boolean;
}) => {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  const handleMessageApplicant = () => {
    const userName = `${application.first_name} ${application.last_name}`;
    
    // Use coach_id if available (for approved applications), otherwise use application.id
    // This ensures we use the actual coach user ID for messaging when possible
    const conversationId = application.coach_id || application.id;
    
    console.log('Messaging applicant from modal:', {
      applicationId: application.id,
      coachId: application.coach_id,
      status: application.status,
      conversationId,
      note: application.coach_id ? 'Using coach_id for existing coach' : 'Using application.id for pending application'
    });
    
    const params = new URLSearchParams({
      conversation_with: conversationId,
      partner_name: encodeURIComponent(userName),
      partner_role: 'coach'
    });
    router.push(`/admin/messages?${params.toString()}`);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    // Store the currently focused element
    lastActiveElement.current = document.activeElement as HTMLElement;
    
    // Show modal with animation
    setIsVisible(true);
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      // Restore focus to the previously focused element
      if (lastActiveElement.current) {
        lastActiveElement.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleApprove = () => {
    onStatusUpdate(application.id, 'approved', approvalNotes.trim() || 'Application approved by admin');
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setValidationError('Please provide a reason for rejection');
      return;
    }
    setValidationError('');
    onStatusUpdate(application.id, 'rejected', rejectionReason);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 transition-all duration-200 overflow-y-auto ${
        isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-modal-title"
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl my-2 sm:my-4 max-h-[98vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar mobile-modal-content border-0 transition-all duration-200 transform ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 p-4 sm:p-6 z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg flex-shrink-0">
                {application.first_name[0]}{application.last_name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="application-modal-title" className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {application.first_name} {application.last_name}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-start sm:items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 mt-2 sm:mt-0 flex-shrink-0"></span>
                  <span className="break-all">{application.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3 flex-shrink-0 ml-2">
              <div className="hidden sm:block">
                {getStatusBadge(application.status)}
              </div>
              <Button 
                onClick={handleClose} 
                variant="ghost"
                className="hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 min-h-[44px] sm:min-h-0 focus-ring"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
          <div className="block sm:hidden mt-3">
            {getStatusBadge(application.status)}
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Professional Background */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Professional Background</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Education</label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium mt-1 break-words">{application.educational_background}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Experience</label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium mt-1 break-words">{application.coaching_experience_years}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ACT Training Level</label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium mt-1 break-words">{application.act_training_level}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">Professional Certifications</label>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {(application.professional_certifications?.length ?? 0) > 0 ? (
                    application.professional_certifications?.map((cert, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 break-words">{cert}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None specified</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Specialization */}
          <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Specialization & Expertise</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">Areas of Expertise</label>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {(application.coaching_expertise?.length ?? 0) > 0 ? (
                    application.coaching_expertise?.map((area, index) => (
                      <Badge key={index} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-xs break-words mobile-badge">
                        {area}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None specified</p>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">Comfortable Age Groups</label>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {(application.age_groups_comfortable?.length ?? 0) > 0 ? (
                    application.age_groups_comfortable?.map((group, index) => (
                      <Badge key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 text-xs break-words mobile-badge">
                        {group}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None specified</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Coaching Philosophy */}
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 sm:p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Coaching Philosophy & Approach</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Philosophy Statement</label>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic break-words">
                  "{application.coaching_philosophy}"
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">Techniques Used</label>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {(application.coaching_techniques?.length ?? 0) > 0 ? (
                    application.coaching_techniques?.map((technique, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 break-words">{technique}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None specified</p>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Session Structure</label>
                <p className="text-sm text-gray-900 dark:text-white font-medium break-words">{application.session_structure}</p>
              </div>
            </div>
          </section>

          {/* Ethics & Crisis Management */}
          <section className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 sm:p-6 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Ethics & Crisis Management</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-medium mb-2 text-gray-900 dark:text-white"><strong>Scope Handling Approach:</strong></p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mt-1 break-words text-gray-900 dark:text-white">
                  {application.scope_handling_approach}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-medium break-words text-gray-900 dark:text-white"><strong>Professional Discipline History:</strong> {application.professional_discipline_history ? 'Yes' : 'No'}</p>
                {application.professional_discipline_history && application.discipline_explanation && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded mt-2">
                    <p className="break-words text-gray-900 dark:text-white"><strong>Explanation:</strong> {application.discipline_explanation}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-medium break-words text-gray-900 dark:text-white"><strong>Boundary Maintenance:</strong> {application.boundary_maintenance_approach}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-medium break-words text-gray-900 dark:text-white"><strong>Comfort with Suicidal Thoughts:</strong> {application.comfortable_with_suicidal_thoughts}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-medium mb-2 text-gray-900 dark:text-white"><strong>Self-Harm Protocol:</strong></p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mt-1 break-words text-gray-900 dark:text-white">
                  {application.self_harm_protocol}
                </div>
              </div>
            </div>
          </section>

          {/* Availability & Technology */}
          <section className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 sm:p-6 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Availability & Technology</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                <p className="break-words text-gray-900 dark:text-white"><strong>Weekly Hours:</strong> {application.weekly_hours_available}</p>
                <p className="break-words text-gray-900 dark:text-white"><strong>Session Length:</strong> {application.preferred_session_length}</p>
                <p className="break-words text-gray-900 dark:text-white"><strong>Video Comfort:</strong> {application.video_conferencing_comfort}</p>
                <p className="break-words text-gray-900 dark:text-white"><strong>Internet Quality:</strong> {application.internet_connection_quality}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-medium mb-2 text-gray-900 dark:text-white"><strong>Availability Times:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1 mb-4">
                  {(application.availability_times?.length ?? 0) > 0 ? (
                    application.availability_times?.map((time, index) => (
                      <Badge key={index} variant="outline" className="text-xs break-words">
                        {time}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None specified</p>
                  )}
                </div>

                <p className="font-medium mb-2 text-gray-900 dark:text-white"><strong>Languages:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(application.languages_fluent?.length ?? 0) > 0 ? (
                    application.languages_fluent?.map((lang, index) => (
                      <Badge key={index} variant="secondary" className="text-xs break-words">
                        {lang}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None specified</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Professional References */}
          <section className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Professional References</h3>
            </div>
            <div className="grid gap-4">
              {application.references.map((ref, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Reference {index + 1}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="break-words text-gray-900 dark:text-white"><strong>Name:</strong> {ref.name}</p>
                      <p className="break-words text-gray-900 dark:text-white"><strong>Title:</strong> {ref.title}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="break-words text-gray-900 dark:text-white"><strong>Organization:</strong> {ref.organization}</p>
                      <p className="break-all text-gray-900 dark:text-white"><strong>Email:</strong> {ref.email}</p>
                      {ref.phone && <p className="break-words text-gray-900 dark:text-white"><strong>Phone:</strong> {ref.phone}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Review History & Notes */}
          {(application.reviewed_at || application.rejection_reason) && (
            <section className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-full">
                  <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Review History</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-sm">
                  <div className="space-y-3">
                    <p className="text-gray-900 dark:text-white"><strong>Status:</strong> {getStatusBadge(application.status)}</p>
                    {application.reviewed_at && (
                      <p className="text-gray-900 dark:text-white"><strong>Reviewed:</strong> {formatDate(application.reviewed_at)}</p>
                    )}
                    {application.reviewed_by && (
                      <p className="text-gray-900 dark:text-white"><strong>Reviewed By:</strong> {application.reviewed_by}</p>
                    )}
                  </div>
                  {application.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="font-medium text-red-800 dark:text-red-300 mb-2">Rejection Reason:</p>
                      <p className="text-red-700 dark:text-red-400 break-words">{application.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6 bg-gray-50 dark:bg-gray-800/50 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 rounded-b-xl">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                  {application.status === 'pending' ? 'Application Review' : 'Application Actions'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {application.status === 'pending' ? 'Make a decision on this application' : 'Available actions for this application'}
                </p>
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={handleMessageApplicant}
                  variant="outline"
                  className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200 min-h-[44px] focus-ring"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Applicant
                </Button>
                
                {application.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => setShowRejectionForm(true)}
                      variant="outline"
                      disabled={loading}
                      className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 min-h-[44px] focus-ring"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject with Notes
                    </Button>
                    
                    <Button
                      onClick={() => setShowApprovalForm(true)}
                      disabled={loading}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px] focus-ring"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Approve with Notes</span>
                      <span className="sm:hidden">Approve</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
              
              {/* Approval Form */}
              {showApprovalForm && (
                <div className="mt-4 p-4 sm:p-6 border border-green-200 dark:border-green-800 rounded-xl bg-green-50 dark:bg-green-900/20 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm sm:text-base">Approval Notes</h4>
                  </div>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-sm sm:text-base min-h-[120px] focus-ring-inset"
                    rows={4}
                    placeholder="Add any notes about the approval (optional). These notes will be saved for internal review purposes..."
                  />
                  <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3 mt-4">
                    <Button
                      onClick={() => {
                        setShowApprovalForm(false);
                        setApprovalNotes('');
                      }}
                      variant="outline"
                      className="w-full sm:w-auto transition-all duration-200 min-h-[44px] order-2 sm:order-1 focus-ring"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={loading}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px] order-1 sm:order-2 focus-ring"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          <span className="hidden sm:inline">Approving...</span>
                          <span className="sm:hidden">Approving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Confirm Approval</span>
                          <span className="sm:hidden">Approve</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejection Form */}
              {showRejectionForm && (
                <div className="mt-4 p-4 sm:p-6 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/20 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">Rejection Reason</h4>
                  </div>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    className="w-full px-3 sm:px-4 py-3 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-sm sm:text-base min-h-[120px] focus-ring-inset"
                    rows={4}
                    placeholder="Please provide a detailed reason for rejection. This will be included in the notification email to the applicant..."
                  />
                  {validationError && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationError}
                    </p>
                  )}
                  <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3 mt-4">
                    <Button
                      onClick={() => {
                        setShowRejectionForm(false);
                        setRejectionReason('');
                        setValidationError('');
                      }}
                      variant="outline"
                      className="w-full sm:w-auto transition-all duration-200 min-h-[44px] order-2 sm:order-1 focus-ring"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={loading || !rejectionReason.trim()}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] order-1 sm:order-2 focus-ring"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          <span className="hidden sm:inline">Rejecting...</span>
                          <span className="sm:hidden">Rejecting...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Confirm Rejection</span>
                          <span className="sm:hidden">Reject</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Pending' },
    under_review: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'Under Review' },
    approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Rejected' },
    suspended: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', label: 'Suspended' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
};