'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download,
  RefreshCw,
  Filter,
  CreditCard,
  AlertTriangle,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-toastify';

interface PlatformFinancials {
  total_revenue_cents: number;
  total_fees_collected_cents: number;
  active_coaches: number;
  total_sessions: number;
  average_session_value_cents: number;
  refund_rate_percentage: number;
}

interface FinancialSummary {
  month: string;
  total_transactions: number;
  total_revenue_cents: number;
  total_platform_fees_cents: number;
  total_coach_earnings_cents: number;
  avg_transaction_cents: number;
}

interface CoachEarningsReport {
  coach_id: string;
  coach_name: string;
  total_sessions: number;
  total_earnings_cents: number;
  average_session_rate_cents: number;
}

const FinancialDashboard: React.FC = () => {
  const [platformData, setPlatformData] = useState<PlatformFinancials | null>(null);
  const [monthlyData, setMonthlyData] = useState<FinancialSummary[]>([]);
  const [topCoaches, setTopCoaches] = useState<CoachEarningsReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all financial data in parallel
      const [platformResponse, monthlyResponse, coachesResponse] = await Promise.all([
        fetch(`/api/payments/reports/platform-financials?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/payments/reports/monthly-summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/payments/reports/top-coaches?limit=5&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ]);

      if (platformResponse.ok) {
        const data = await platformResponse.json();
        setPlatformData(data);
      }

      if (monthlyResponse.ok) {
        const data = await monthlyResponse.json();
        setMonthlyData(data);
      }

      if (coachesResponse.ok) {
        const data = await coachesResponse.json();
        setTopCoaches(data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to fetch financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const exportData = () => {
    // Simple CSV export functionality
    const csvData = monthlyData.map(row => ({
      Month: row.month,
      Revenue: formatCurrency(row.total_revenue_cents),
      Transactions: row.total_transactions,
      'Avg Transaction': formatCurrency(row.avg_transaction_cents),
      'Platform Fees': formatCurrency(row.total_platform_fees_cents),
      'Coach Earnings': formatCurrency(row.total_coach_earnings_cents),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading && !platformData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-gray-600">Platform revenue and coach earnings overview</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2">
          <Button 
            onClick={fetchFinancialData} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={exportData}
            disabled={!monthlyData.length}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <Button 
              onClick={fetchFinancialData}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {platformData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(platformData.total_revenue_cents)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Platform Fees</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(platformData.total_fees_collected_cents)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">
                    {platformData.total_sessions.toLocaleString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Coaches</p>
                  <p className="text-2xl font-bold">
                    {platformData.active_coaches}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Metrics */}
      {platformData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Session Value</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(platformData.average_session_value_cents)}
                  </p>
                </div>
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Refund Rate</p>
                  <p className="text-xl font-semibold">
                    {formatPercentage(platformData.refund_rate_percentage)}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue Growth</p>
                  <p className="text-xl font-semibold text-green-600">
                    +12.5%
                  </p>
                  <p className="text-xs text-gray-500">vs last month</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available</p>
            ) : (
              <div className="space-y-4">
                {monthlyData.slice(0, 6).map((month, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(month.month).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {month.total_transactions} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(month.total_revenue_cents)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Avg: {formatCurrency(month.avg_transaction_cents)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Coaches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Performing Coaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCoaches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available</p>
            ) : (
              <div className="space-y-4">
                {topCoaches.map((coach, index) => (
                  <div key={coach.coach_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{coach.coach_name}</p>
                        <p className="text-sm text-gray-600">
                          {coach.total_sessions} sessions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(coach.total_earnings_cents)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Avg: {formatCurrency(coach.average_session_rate_cents)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDashboard;