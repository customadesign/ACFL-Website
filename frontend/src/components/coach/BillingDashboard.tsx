'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface BillingTransaction {
  id: string;
  transaction_type: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string;
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
  current_balance_cents: number;
  pending_payouts_cents?: number;
  recent_transactions: BillingTransaction[];
  monthly_summary: BillingReport;
  pending_refunds: any[];
}

interface CoachBillingDashboardProps {
  coachId: string;
}

export default function CoachBillingDashboard({ coachId }: CoachBillingDashboardProps) {
  const [dashboardData, setDashboardData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/billing/dashboard/${coachId}/coach`, {
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
  }, [coachId]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment':
        return 'text-green-600 dark:text-green-400';
      case 'payout':
        return 'text-blue-600 dark:text-blue-400';
      case 'refund':
        return 'text-red-600 dark:text-red-400';
      case 'fee':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
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
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
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
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.monthly_summary.net_revenue_cents)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.monthly_summary.transaction_count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.current_balance_cents)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
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
              <p className="text-sm text-muted-foreground">Gross Revenue</p>
              <p className="text-lg font-semibold">
                {formatCurrency(dashboardData.monthly_summary.total_revenue_cents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Refunds</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(dashboardData.monthly_summary.total_refunds_cents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform Fees</p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(dashboardData.monthly_summary.total_fees_cents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Earnings</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(dashboardData.monthly_summary.net_revenue_cents)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Transactions
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recent_transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-colors">
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
                  <p className={`font-bold ${
                    transaction.transaction_type === 'payment' ? 'text-green-600 dark:text-green-400' :
                    transaction.transaction_type === 'refund' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {transaction.transaction_type === 'refund' ? '-' : '+'}
                    {formatCurrency(transaction.amount_cents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}