'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  UserCheck, 
  Calendar,
  DollarSign,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCoaches: number;
    totalSessions: number;
    totalRevenue: number;
    userGrowth: number;
    coachGrowth: number;
    sessionGrowth: number;
    revenueGrowth: number;
  };
  userMetrics: {
    newUsersThisMonth: number;
    activeUsers: number;
    userRetentionRate: number;
    averageSessionsPerUser: number;
  };
  coachMetrics: {
    averageRating: number;
    totalCoachHours: number;
    averageSessionDuration: number;
    coachUtilizationRate: number;
  };
  financialMetrics: {
    monthlyRecurringRevenue: number;
    averageSessionValue: number;
    revenuePerUser: number;
    conversionRate: number;
  };
  sessionMetrics: {
    completionRate: number;
    noShowRate: number;
    cancellationRate: number;
    averageRating: number;
  };
  topCoaches: Array<{
    id: string;
    name: string;
    rating: number;
    sessions: number;
    revenue: number;
  }>;
  topSpecialties: Array<{
    name: string;
    sessions: number;
    percentage: number;
  }>;
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`${API_URL}/api/admin/analytics?timeRange=${timeRange}`)
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: unknown) => {
    const num = Number(value);

    if(isNaN(num)) return "0.0%";

    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 bg-gray-200 rounded w-1/3 animate-pulse mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics & Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">Platform performance metrics and insights</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => exportToCSV(analyticsData, 'analytics-report')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Export to CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => exportToPDF(analyticsData, 'analytics-report')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Export to PDF"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </div>
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analyticsData.overview.totalUsers}</p>
              <div className="flex items-center mt-2">
                {getGrowthIcon(analyticsData.overview.userGrowth)}
                <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.userGrowth)}`}>
                  {formatPercentage(analyticsData.overview.userGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Coaches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analyticsData.overview.totalCoaches}</p>
              <div className="flex items-center mt-2">
                {getGrowthIcon(analyticsData.overview.coachGrowth)}
                <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.coachGrowth)}`}>
                  {formatPercentage(analyticsData.overview.coachGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analyticsData.overview.totalSessions}</p>
              <div className="flex items-center mt-2">
                {getGrowthIcon(analyticsData.overview.sessionGrowth)}
                <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.sessionGrowth)}`}>
                  {formatPercentage(analyticsData.overview.sessionGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
              <div className="flex items-center mt-2">
                {getGrowthIcon(analyticsData.overview.revenueGrowth)}
                <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.revenueGrowth)}`}>
                  {formatPercentage(analyticsData.overview.revenueGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-emerald-100">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {/* User Metrics */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            User Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Users This Month</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.userMetrics.newUsersThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.userMetrics.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">User Retention Rate</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.userMetrics.userRetentionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Sessions Per User</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.userMetrics.averageSessionsPerUser}</span>
            </div>
          </div>
        </div>

        {/* Coach Metrics */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-purple-600" />
            Coach Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Rating</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm font-medium text-gray-900">{analyticsData.coachMetrics.averageRating}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Coach Hours</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.coachMetrics.totalCoachHours.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Session Duration</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.coachMetrics.averageSessionDuration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Coach Utilization Rate</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.coachMetrics.coachUtilizationRate}%</span>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
            Financial Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Recurring Revenue</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(analyticsData.financialMetrics.monthlyRecurringRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Session Value</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(analyticsData.financialMetrics.averageSessionValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Per User</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(analyticsData.financialMetrics.revenuePerUser)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium text-gray-900">{analyticsData.financialMetrics.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Session Metrics */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-orange-600" />
            Session Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="text-sm font-medium text-green-600">{analyticsData.sessionMetrics.completionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">No-Show Rate</span>
              <span className="text-sm font-medium text-yellow-600">{analyticsData.sessionMetrics.noShowRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cancellation Rate</span>
              <span className="text-sm font-medium text-red-600">{analyticsData.sessionMetrics.cancellationRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Session Rating</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm font-medium text-gray-900">{analyticsData.sessionMetrics.averageRating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers and Specialties */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Coaches */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Top Performing Coaches
          </h3>
          <div className="space-y-3">
            {analyticsData.topCoaches.map((coach, index) => (
              <div key={coach.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{coach.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Star className="h-3 w-3 text-yellow-400 mr-1" />
                      {coach.rating} • {coach.sessions} sessions
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(coach.revenue)}</p>
                  <p className="text-xs text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Specialties */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-green-600" />
            Popular Specialties
          </h3>
          <div className="space-y-3">
            {analyticsData.topSpecialties.map((specialty, index) => (
              <div key={specialty.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{
                    backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                  }}></div>
                  <span className="text-sm font-medium text-gray-900">{specialty.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{specialty.sessions}</span>
                  <span className="text-sm text-gray-500">({specialty.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Reports
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Generate and download comprehensive analytics reports in your preferred format.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
                  CSV Export
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Export raw data in CSV format for further analysis in spreadsheet applications.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                exportToCSV(analyticsData, 'analytics-report');
              }}
              className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Download CSV
            </button>
          </div>
          
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-red-600" />
                  PDF Report
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Generate a formatted PDF report with charts and tables for presentations.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                exportToPDF(analyticsData, 'analytics-report');
              }}
              className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Download PDF
            </button>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Reports include data from the selected time range ({timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : timeRange === '90d' ? 'Last 90 days' : 'Last year'}).
            All financial data is calculated based on completed sessions only.
          </p>
        </div>
      </div>
    </div>
  );
}