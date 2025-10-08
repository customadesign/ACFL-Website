'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import PaymentStatusBadge, { PaymentStatus } from './PaymentStatusBadge';
import PaymentDetails from './PaymentDetails';
import { toast } from 'react-toastify';

interface PaymentSummary {
  total_payments: number;
  total_amount_cents: number;
  authorized_count: number;
  authorized_amount_cents: number;
  succeeded_count: number;
  succeeded_amount_cents: number;
  failed_count: number;
  refunded_count: number;
  refunded_amount_cents: number;
}

interface PaymentListItem {
  id: string;
  client_name: string;
  coach_name: string;
  amount_cents: number;
  status: PaymentStatus;
  created_at: string;
  description?: string;
  session_date?: string;
}

interface PaymentManagementProps {
  isAdmin?: boolean;
  coachId?: string; // For coach-specific view
  clientId?: string; // For client-specific view
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({
  isAdmin = false,
  coachId,
  clientId
}) => {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPayments();
    loadSummary();
  }, [statusFilter, dateRange, currentPage, coachId, clientId]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange !== 'all' && { date_range: dateRange }),
        ...(coachId && { coach_id: coachId }),
        ...(clientId && { client_id: clientId })
      });

      const endpoint = isAdmin ? '/api/admin/payments' : '/api/payments';
      const response = await fetch(`${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setTotalPages(data.total_pages);
      } else {
        throw new Error('Failed to load payments');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params = new URLSearchParams({
        ...(dateRange !== 'all' && { date_range: dateRange }),
        ...(coachId && { coach_id: coachId }),
        ...(clientId && { client_id: clientId })
      });

      const endpoint = isAdmin ? '/api/admin/payments/summary' : '/api/payments/summary';
      const response = await fetch(`${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error loading payment summary:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadPayments(), loadSummary()]);
    setIsRefreshing(false);
    toast.success('Payments refreshed');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPayments();
  };

  const handleCapturePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/capture-payment/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await loadPayments();
        await loadSummary();
        toast.success('Payment captured successfully');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to capture payment');
      }
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  };

  const handleCancelPayment = async (paymentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/payments/cancel-authorization/${paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await loadPayments();
        await loadSummary();
        toast.success('Payment cancelled successfully');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel payment');
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  };

  const handleRefundPayment = async (paymentId: string, amountCents?: number, reason?: string) => {
    try {
      const response = await fetch('/api/payments/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          payment_id: paymentId,
          amount_cents: amountCents,
          reason: reason || 'admin_initiated',
          description: reason
        })
      });

      if (response.ok) {
        await loadPayments();
        await loadSummary();
        toast.success('Refund initiated successfully');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate refund');
      }
    } catch (error) {
      console.error('Error initiating refund:', error);
      throw error;
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportPayments = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange !== 'all' && { date_range: dateRange }),
        ...(coachId && { coach_id: coachId }),
        ...(clientId && { client_id: clientId }),
        format: 'csv'
      });

      const endpoint = isAdmin ? '/api/admin/payments/export' : '/api/payments/export';
      const response = await fetch(`${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export downloaded');
      } else {
        throw new Error('Failed to export payments');
      }
    } catch (error) {
      console.error('Error exporting payments:', error);
      toast.error('Failed to export payments');
    }
  };

  if (selectedPayment) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedPayment(null)}>
            ← Back to Payments
          </Button>
          <h2 className="text-xl font-semibold">Payment Details</h2>
        </div>
        <PaymentDetails
          payment={payments.find(p => p.id === selectedPayment) as any}
          onCapturePayment={handleCapturePayment}
          onCancelPayment={handleCancelPayment}
          onRefundPayment={handleRefundPayment}
          showActions={isAdmin}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isAdmin ? 'Payment Management' : 'My Payments'}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportPayments}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold">{summary.total_payments}</p>
                  <p className="text-sm text-gray-500">{formatPrice(summary.total_amount_cents)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Authorized</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.authorized_count}</p>
                  <p className="text-sm text-gray-500">{formatPrice(summary.authorized_amount_cents)}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{summary.succeeded_count}</p>
                  <p className="text-sm text-gray-500">{formatPrice(summary.succeeded_amount_cents)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Refunded</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.refunded_count}</p>
                  <p className="text-sm text-gray-500">{formatPrice(summary.refunded_amount_cents)}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button type="submit" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </form>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="authorized">Authorized</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">ID</th>
                      <th className="text-left p-3">Client</th>
                      <th className="text-left p-3">Coach</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Session</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs">
                          {payment.id.slice(-8)}
                        </td>
                        <td className="p-3">{payment.client_name}</td>
                        <td className="p-3">{payment.coach_name}</td>
                        <td className="p-3 font-semibold">
                          {formatPrice(payment.amount_cents)}
                        </td>
                        <td className="p-3">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td className="p-3">{formatDate(payment.created_at)}</td>
                        <td className="p-3">
                          {payment.session_date ? (
                            <span className="text-sm">{formatDate(payment.session_date)}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">No session</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayment(payment.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManagement;