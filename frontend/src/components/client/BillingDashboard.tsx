'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { getApiUrl } from '@/lib/api';
import {
  TrendingUp,
  Clock,
  Download,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface BillingTransaction {
  id: string;
  transaction_type: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

interface RefundRequest {
  id: string;
  payment_id: string;
  amount_cents: number;
  reason: string;
  description?: string;
  status: string;
  refund_method: string;
  created_at: string;
}

interface BillingReport {
  period_start: Date;
  period_end: Date;
  total_revenue_cents: number;
  total_refunds_cents: number;
  total_fees_cents: number;
  net_revenue_cents: number;
  transaction_count: number;
  refund_count: number;
  average_transaction_cents: number;
  refund_rate_percentage: number;
}

interface BillingDashboardData {
  recent_transactions: BillingTransaction[];
  monthly_summary: BillingReport;
  pending_refunds: RefundRequest[];

}

interface ClientBillingDashboardProps {
  clientId: string;
}

export default function ClientBillingDashboard({ clientId }: ClientBillingDashboardProps) {
  const [dashboardData, setDashboardData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/billing/dashboard/${clientId}/client`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [clientId]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment':
        return 'text-red-600'; // Outgoing payment
      case 'refund':
        return 'text-green-600'; // Incoming refund
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin dark:text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.pending_refunds.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {dashboardData.pending_refunds.length > 0 && (
                <span>
                  {formatCurrency(
                    dashboardData.pending_refunds.reduce((sum, refund) => sum + refund.amount_cents, 0)
                  )} total
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Math.abs(dashboardData.monthly_summary.total_revenue_cents))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.monthly_summary.transaction_count} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Monthly Summary
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(dashboardData.monthly_summary.total_revenue_cents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Refunds Received</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(dashboardData.monthly_summary.total_refunds_cents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Payment</p>
              <p className="text-lg font-semibold">
                {formatCurrency(dashboardData.monthly_summary.average_transaction_cents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Spending</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  dashboardData.monthly_summary.total_revenue_cents -
                  dashboardData.monthly_summary.total_refunds_cents
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Refunds */}
      {dashboardData.pending_refunds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.pending_refunds.map((refund) => (
                <div key={refund.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Refund Request</span>
                      <Badge variant={getStatusBadgeVariant(refund.status)}>
                        {refund.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reason: {refund.reason.replace('_', ' ')}
                    </p>
                    {refund.description && (
                      <p className="text-sm text-muted-foreground">
                        {refund.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(refund.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(refund.amount_cents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Via {refund.refund_method.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Transactions
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recent_transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium capitalize ${getTransactionTypeColor(transaction.transaction_type)}`}>
                      {transaction.transaction_type}
                    </span>
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                    {transaction.transaction_type === 'payment' ? '-' : '+'}
                    {formatCurrency(transaction.amount_cents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center gap-2" variant="outline">
              <Download className="h-5 w-5" />
              <span>Download Statements</span>
            </Button>
            <Button className="h-16 flex flex-col items-center justify-center gap-2" variant="outline">
              <AlertCircle className="h-5 w-5" />
              <span>Request Refund</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}