'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import Pagination from '@/components/ui/pagination';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  FileText,
  Download,
  Filter,
  Calendar,
  Search,
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';

interface Transaction {
  id: string;
  session_id: string;
  client_id: string;
  coach_id: string;
  amount: number;
  amount_cents?: number;
  currency: string;
  status: string;
  payment_method: string;
  description: string;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
  coach: {
    first_name: string;
    last_name: string;
    email: string;
  };
  session: {
    scheduled_at: string;
    duration_minutes: number;
  };
}

interface TransactionStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedAmount: number;
  averageTransactionValue: number;
  transactionsByStatus: Record<string, number>;
  revenueByDay: Record<string, number>;
}

// Refund Modal Component
interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onRefund: (transactionId: string, reason: string, amount?: number) => void;
}

function RefundModal({ isOpen, onClose, transaction, onRefund }: RefundModalProps) {
  const [reason, setReason] = useState('admin_initiated');
  const [customReason, setCustomReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    // Validate inputs
    if (reason === 'other' && !customReason.trim()) {
      alert('Please provide a custom reason');
      return;
    }

    if (refundType === 'partial') {
      const amount = parseFloat(partialAmount);
      if (!amount || amount <= 0) {
        alert('Please enter a valid partial refund amount');
        return;
      }
      const maxAmount = transaction.amount_cents ? transaction.amount_cents / 100 : transaction.amount;
      if (amount > maxAmount) {
        alert(`Partial refund amount cannot exceed ${maxAmount}`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const finalReason = reason === 'other' ? customReason : reason;
      const refundAmount = refundType === 'partial' ? parseFloat(partialAmount) : undefined;
      await onRefund(transaction.id, finalReason, refundAmount);
      onClose();
      setReason('admin_initiated');
      setCustomReason('');
      setRefundType('full');
      setPartialAmount('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Process Refund
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Transaction Details</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>ID:</strong> {transaction.id.slice(0, 8)}...</p>
                <p><strong>Client:</strong> {transaction.client.first_name} {transaction.client.last_name}</p>
                <p><strong>Amount:</strong> {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(transaction.amount_cents ? transaction.amount_cents / 100 : transaction.amount)}</p>
                <p><strong>Status:</strong> {transaction.status}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refund Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
                  className="mr-2"
                />
                Full Refund (${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(transaction.amount_cents ? transaction.amount_cents / 100 : transaction.amount).replace('$', '')})
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
                  className="mr-2"
                />
                Partial Refund
              </label>
            </div>
          </div>

          {refundType === 'partial' && (
            <div className="mb-4">
              <label htmlFor="partial-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refund Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="partial-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={transaction.amount_cents ? transaction.amount_cents / 100 : transaction.amount}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="refund-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refund Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="admin_initiated">Admin Initiated</option>
              <option value="requested_by_customer">Customer Requested</option>
              <option value="coach_requested">Coach Requested</option>
              <option value="auto_cancellation">Auto Cancellation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {reason === 'other' && (
            <div className="mb-4">
              <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide a detailed reason for this refund..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Important:</p>
                <p>This action will process a refund through Square. Please ensure this is necessary as refunds cannot be undone.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isProcessing}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FinancialManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [refundModal, setRefundModal] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
  }>({
    isOpen: false,
    transaction: null
  });

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    succeeded: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    captured: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    authorized: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    canceled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    refunded: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  };

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [currentPage, itemsPerPage, statusFilter, dateFilter]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (dateFilter !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (dateFilter) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(endDate.getDate() - 90);
            break;
        }
        
        if (dateFilter !== 'all') {
          params.append('start_date', startDate.toISOString());
          params.append('end_date', endDate.toISOString());
        }
      }

      const response = await fetch(`${getApiUrl()}/api/admin/financial/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Financial transactions response:', data);

        // Handle both response structures
        const transactionsArray = data.transactions || [];
        const pagination = data.pagination || data;

        setTransactions(transactionsArray);
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || pagination.totalItems || transactionsArray.length) / itemsPerPage));
        setTotalItems(pagination.total || pagination.totalItems || transactionsArray.length);

        console.log('Pagination info:', {
          totalPages: pagination.totalPages || Math.ceil((pagination.total || pagination.totalItems || transactionsArray.length) / itemsPerPage),
          totalItems: pagination.total || pagination.totalItems || transactionsArray.length,
          itemsPerPage
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();

      if (dateFilter !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (dateFilter) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(endDate.getDate() - 90);
            break;
        }
        
        if (dateFilter !== 'all') {
          params.append('start_date', startDate.toISOString());
          params.append('end_date', endDate.toISOString());
        }
      }

      const response = await fetch(`${getApiUrl()}/api/admin/financial/transactions/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefund = async (transactionId: string, reason: string, amount?: number) => {
    try {
      const requestBody: any = {
        reason: reason,
        description: `Admin initiated refund: ${reason}`
      };

      // Add amount_cents for partial refunds
      if (amount) {
        requestBody.amount_cents = Math.round(amount * 100); // Convert dollars to cents
      }

      const response = await fetch(`${getApiUrl()}/api/admin/payments/${transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        fetchTransactions();
        fetchStats();
        // Show success notification (you could implement a toast notification here)
        console.log('Refund processed successfully:', data);
        alert(`Refund processed successfully! Refund ID: ${data.data.refund_id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(`Error processing refund: ${(error as Error).message}`);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.coach.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.coach.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Financial Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor billing, payments, and financial performance
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Revenue Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-green-100 dark:group-hover:bg-green-900/30">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Revenue
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {statsLoading || !stats ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                formatCurrency(stats.totalRevenue)
              )}
            </div>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Transactions
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {statsLoading || !stats ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.totalTransactions
              )}
            </div>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-green-100 dark:group-hover:bg-green-900/30">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Success Rate
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {statsLoading || !stats ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                `${stats.totalTransactions > 0 ? Math.round((stats.successfulTransactions / stats.totalTransactions) * 100) : 0}%`
              )}
            </div>
          </div>
        </div>

        {/* Average Transaction Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Avg. Transaction
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {statsLoading || !stats ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                formatCurrency(stats.averageTransactionValue)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filter Transactions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Search and filter financial records</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-1">
              <label htmlFor="transaction-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Search Transactions</span>
                </div>
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                <input
                  id="transaction-search"
                  type="text"
                  placeholder="Search by client, coach, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01]"
                />
              </div>
            </div>

            {/* Items Per Page */}
            <div className="relative group">
              <label htmlFor="items-per-page" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span>Per Page</span>
                </div>
              </label>
              <div className="relative">
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
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
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="succeeded">Completed</option>
                  <option value="authorized">Authorized</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="canceled">Canceled</option>
                  <option value="refunded">Refunded</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Date Filter */}
            <div className="relative group">
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span>Date Range</span>
                </div>
              </label>
              <div className="relative">
                <select
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
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

          {/* Active Filter Tags */}
          {(statusFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm border border-blue-200 dark:border-blue-800">
                  <Search className="w-3.5 h-3.5" />
                  Search: {searchTerm.substring(0, 20)}{searchTerm.length > 20 ? '...' : ''}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm border border-green-200 dark:border-green-800">
                  <Filter className="w-3.5 h-3.5" />
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm border border-purple-200 dark:border-purple-800">
                  <Calendar className="w-3.5 h-3.5" />
                  Date: {dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
                  <button
                    onClick={() => setDateFilter('all')}
                    className="ml-1 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Clear All
              </button>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-4 ">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}</>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'Filtered transactions' : 'Total transactions'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        </div>

        {/* Desktop Table View */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[120px]">
                        {transaction.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                        {transaction.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[150px]">
                        {transaction.client.first_name} {transaction.client.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={transaction.client.email}>
                        {transaction.client.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[150px]">
                        {transaction.coach.first_name} {transaction.coach.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={transaction.coach.email}>
                        {transaction.coach.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount_cents ? transaction.amount_cents / 100 : transaction.amount)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[transaction.status] || statusColors.pending
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(transaction.status === 'completed' || transaction.status === 'succeeded' || transaction.status === 'captured') && (
                        <button
                          onClick={() => setRefundModal({
                            isOpen: true,
                            transaction
                          })}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Process Refund"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="xl:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={`mobile-${transaction.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="space-y-3">
                  {/* Header with Status and Amount */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[transaction.status] || statusColors.pending
                    }`}>
                      {transaction.status}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount_cents ? transaction.amount_cents / 100 : transaction.amount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.currency} • {transaction.payment_method}
                      </div>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Transaction ID</div>
                    <div className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {transaction.id.slice(0, 12)}...
                    </div>
                  </div>

                  {/* Client Information */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Client</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.client.first_name} {transaction.client.last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                      {transaction.client.email}
                    </div>
                  </div>

                  {/* Coach Information */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Coach</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.coach.first_name} {transaction.coach.last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                      {transaction.coach.email}
                    </div>
                  </div>

                  {/* Footer with Date and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      {(transaction.status === 'completed' || transaction.status === 'succeeded' || transaction.status === 'captured') && (
                        <button
                          onClick={() => setRefundModal({
                            isOpen: true,
                            transaction
                          })}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded-full transition-colors"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
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

      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModal.isOpen}
        onClose={() => setRefundModal({ isOpen: false, transaction: null })}
        transaction={refundModal.transaction}
        onRefund={handleRefund}
      />
    </div>
  );
}