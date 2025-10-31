'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

interface PayoutRequest {
  id: string;
  coach_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  payout_method: string;
  bank_account_id: string;
  fees_cents: number;
  net_amount_cents: number;
  created_at: string;
  processed_at?: string;
  payout_date?: string;
  failure_reason?: string;
  metadata?: {
    notes?: string;
    payment_count?: number;
    requested_amount_cents?: number;
    rejection_reason?: string;
    requested_by_coach?: boolean;
  };
}

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PayoutWithCoach extends PayoutRequest {
  coach?: Coach;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutWithCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<PayoutWithCoach | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = getApiUrl();
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/billing/payouts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payout requests');
      }

      const data = await response.json();
      setPayouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleApprove = async (payoutId: string) => {
    if (!confirm('Are you sure you want to approve this payout request?')) {
      return;
    }

    try {
      setProcessing(payoutId);
      const API_URL = getApiUrl();
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/billing/payouts/${payoutId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve payout');
      }

      alert('Payout approved successfully!');
      await fetchPayouts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve payout');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(selectedPayout.id);
      const API_URL = getApiUrl();
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/billing/payouts/${selectedPayout.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject payout');
      }

      alert('Payout rejected successfully!');
      setShowRejectModal(false);
      setSelectedPayout(null);
      setRejectionReason('');
      await fetchPayouts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject payout');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      failed: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    const matchesSearch = !searchQuery ||
      payout.coach?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.coach?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.coach?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayouts = filteredPayouts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const stats = {
    pending: payouts.filter(p => p.status === 'pending').length,
    approved: payouts.filter(p => p.status === 'approved' || p.status === 'processing').length,
    completed: payouts.filter(p => p.status === 'completed').length,
    rejected: payouts.filter(p => p.status === 'rejected' || p.status === 'failed').length,
    totalPending: payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount_cents, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payout Requests</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">Manage coach payout requests and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Pending Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Pending
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.pending
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrency(stats.totalPending)}</p>
        </div>

        {/* Approved Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Approved
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.approved
              )}
            </div>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-green-100 dark:group-hover:bg-green-900/30">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Completed
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.completed
              )}
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Rejected
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.rejected
              )}
            </div>
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                payouts.length
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 overflow-hidden">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filter Payouts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Search and filter payout requests</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="lg:col-span-1">
              <label htmlFor="payout-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Search Payouts</span>
                </div>
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                <input
                  id="payout-search"
                  type="text"
                  placeholder="Search by coach name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01]"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative group">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span>Status</span>
                </div>
              </label>
              <div className="relative">
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="failed">Failed</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Items Per Page Filter */}
            <div className="relative group">
              <label htmlFor="items-per-page-payouts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span>Items Per Page</span>
                </div>
              </label>
              <div className="relative">
                <select
                  id="items-per-page-payouts"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Payouts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Table Skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Coach
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="hidden md:table-cell px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="hidden xl:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <DollarSign className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No payout requests found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPayouts.map((payout, index) => (
                    <tr
                      key={payout.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'backwards'
                      }}
                    >
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="hidden sm:block">{getStatusIcon(payout.status)}</div>
                        {getStatusBadge(payout.status)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <User className="hidden sm:block h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                            {payout.coach ? `${payout.coach.first_name} ${payout.coach.last_name}` : 'Unknown Coach'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {payout.coach?.email || payout.coach_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(payout.amount_cents)}
                      </div>
                      {payout.fees_cents > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Fee: {formatCurrency(payout.fees_cents)}
                        </div>
                      )}
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Net: {formatCurrency(payout.net_amount_cents)}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {payout.metadata?.payment_count || 0} payments
                      </div>
                      {payout.metadata?.requested_amount_cents && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Requested: {formatCurrency(payout.metadata.requested_amount_cents)}
                        </div>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {new Date(payout.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(payout.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {payout.metadata?.notes || '-'}
                      </div>
                      {payout.metadata?.rejection_reason && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Rejected: {payout.metadata.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      {payout.status === 'pending' && (
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleApprove(payout.id)}
                            disabled={processing === payout.id}
                            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                            title="Approve payout"
                          >
                            {processing === payout.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowRejectModal(true);
                            }}
                            disabled={processing === payout.id}
                            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                            title="Reject payout"
                          >
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </div>
                      )}
                      {payout.status !== 'pending' && (
                        <>
                          {payout.status === 'completed' && (
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Paid</span>
                            </div>
                          )}
                          {payout.status === 'rejected' && (
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Rejected</span>
                            </div>
                          )}
                          {payout.status === 'approved' && (
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Approved</span>
                            </div>
                          )}
                          {payout.status === 'processing' && (
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Processing</span>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredPayouts.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  showItemsRange={true}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject Payout Request
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Coach: {selectedPayout.coach ? `${selectedPayout.coach.first_name} ${selectedPayout.coach.last_name}` : 'Unknown'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Amount: {formatCurrency(selectedPayout.amount_cents)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this payout request..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPayout(null);
                  setRejectionReason('');
                }}
                disabled={processing !== null}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing !== null || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processing === selectedPayout.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Reject Payout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
