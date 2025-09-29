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
import { getApiUrl } from '@/lib/api';

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

      const API_URL = getApiUrl();
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
      <div className="w-full">
        {/* Header Skeleton - Mobile-optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <div className="h-7 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto sm:mx-0 animate-pulse mb-2 sm:mb-3"></div>
            <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto sm:mx-0 animate-pulse"></div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Overview Cards Skeleton - Mobile-optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Detailed Cards Skeleton - Mobile-optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-2/3 mb-3 sm:mb-4"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Top Performers Skeleton - Mobile-optimized */}
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Analytics & Reports</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Platform performance metrics and insights</p>
          </div>
          
          {/* Mobile-optimized controls */}
          <div className="flex flex-col gap-3">
            {/* Time Range Selector - Full width on mobile */}
            <div className="w-full">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            
            {/* Export Buttons - Stack on mobile, inline on larger screens */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => exportToCSV(analyticsData, 'analytics-report')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-base font-medium touch-manipulation"
                title="Export to CSV"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => exportToPDF(analyticsData, 'analytics-report')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-base font-medium touch-manipulation"
                title="Export to PDF"
              >
                <FileText className="h-5 w-5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards - Mobile-optimized layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{analyticsData.overview.totalUsers.toLocaleString()}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                {getGrowthIcon(analyticsData.overview.userGrowth)}
                <span className={`text-xs sm:text-sm ml-1 font-medium ${getGrowthColor(analyticsData.overview.userGrowth)}`}>
                  {formatPercentage(analyticsData.overview.userGrowth)}
                </span>
              </div>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-blue-100 flex-shrink-0 ml-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Coaches</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{analyticsData.overview.totalCoaches.toLocaleString()}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                {getGrowthIcon(analyticsData.overview.coachGrowth)}
                <span className={`text-xs sm:text-sm ml-1 font-medium ${getGrowthColor(analyticsData.overview.coachGrowth)}`}>
                  {formatPercentage(analyticsData.overview.coachGrowth)}
                </span>
              </div>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-purple-100 flex-shrink-0 ml-2">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Completed Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{analyticsData.overview.totalSessions.toLocaleString()}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                {getGrowthIcon(analyticsData.overview.sessionGrowth)}
                <span className={`text-xs sm:text-sm ml-1 font-medium ${getGrowthColor(analyticsData.overview.sessionGrowth)}`}>
                  {formatPercentage(analyticsData.overview.sessionGrowth)}
                </span>
              </div>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-green-100 flex-shrink-0 ml-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                {getGrowthIcon(analyticsData.overview.revenueGrowth)}
                <span className={`text-xs sm:text-sm ml-1 font-medium ${getGrowthColor(analyticsData.overview.revenueGrowth)}`}>
                  {formatPercentage(analyticsData.overview.revenueGrowth)}
                </span>
              </div>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-emerald-100 flex-shrink-0 ml-2">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics - Mobile-optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {/* User Metrics */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate">User Metrics</span>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">New Users This Month</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.userMetrics.newUsersThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Active Users</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.userMetrics.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">User Retention Rate</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.userMetrics.userRetentionRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Avg Sessions Per User</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.userMetrics.averageSessionsPerUser}</span>
            </div>
          </div>
        </div>

        {/* Coach Metrics */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="truncate">Coach Metrics</span>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Average Rating</span>
              <div className="flex items-center text-right">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mr-1 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{analyticsData.coachMetrics.averageRating}</span>
              </div>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Total Coach Hours</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.coachMetrics.totalCoachHours.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Avg Session Duration</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.coachMetrics.averageSessionDuration} min</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Coach Utilization Rate</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.coachMetrics.coachUtilizationRate}%</span>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="truncate">Financial Metrics</span>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Monthly Recurring Revenue</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(analyticsData.financialMetrics.monthlyRecurringRevenue)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Average Session Value</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(analyticsData.financialMetrics.averageSessionValue)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Revenue Per User</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(analyticsData.financialMetrics.revenuePerUser)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Conversion Rate</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">{analyticsData.financialMetrics.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Session Metrics */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="truncate">Session Metrics</span>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Completion Rate</span>
              <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 text-right">{analyticsData.sessionMetrics.completionRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">No-Show Rate</span>
              <span className="text-xs sm:text-sm font-medium text-yellow-600 dark:text-yellow-400 text-right">{analyticsData.sessionMetrics.noShowRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Cancellation Rate</span>
              <span className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 text-right">{analyticsData.sessionMetrics.cancellationRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Average Session Rating</span>
              <div className="flex items-center text-right">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mr-1 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{analyticsData.sessionMetrics.averageRating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers and Specialties - Mobile-optimized */}
      <div className="space-y-4 sm:space-y-6">
        {/* Top Coaches - Mobile with horizontal scroll */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate">Top Performing Coaches</span>
          </h3>
          
          {/* Mobile: Horizontal scrolling cards */}
          <div className="block sm:hidden">
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              {analyticsData.topCoaches.map((coach, index) => (
                <div key={coach.id} className="flex-shrink-0 w-64 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{coach.name}</p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Star className="h-3 w-3 text-yellow-400 mr-1 flex-shrink-0" />
                    <span>{coach.rating} • {coach.sessions} sessions</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(coach.revenue)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Vertical list */}
          <div className="hidden sm:block space-y-3">
            {analyticsData.topCoaches.map((coach, index) => (
              <div key={coach.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{coach.name}</p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Star className="h-3 w-3 text-yellow-400 mr-1 flex-shrink-0" />
                      <span>{coach.rating} • {coach.sessions} sessions</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(coach.revenue)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Specialties */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="truncate">Popular Specialties</span>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {analyticsData.topSpecialties.map((specialty, index) => (
              <div key={specialty.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center min-w-0 flex-1">
                  <div
                    className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                    style={{
                      backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                    }}
                  ></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{specialty.name}</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{specialty.sessions}</span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">({specialty.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Section - Mobile-optimized */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-4 sm:mt-6">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Export Reports</span>
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">
          Generate and download comprehensive analytics reports in your preferred format.
        </p>
        
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="mb-3">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white flex items-center mb-1 sm:mb-2">
                <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>CSV Export</span>
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Export raw data in CSV format for further analysis in spreadsheet applications.
              </p>
            </div>
            <button
              onClick={() => {
                exportToCSV(analyticsData, 'analytics-report');
              }}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm font-medium touch-manipulation"
            >
              Download CSV
            </button>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="mb-3">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white flex items-center mb-1 sm:mb-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span>PDF Report</span>
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Generate a formatted PDF report with charts and tables for presentations.
              </p>
            </div>
            <button
              onClick={() => {
                exportToPDF(analyticsData, 'analytics-report');
              }}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-sm font-medium touch-manipulation"
            >
              Download PDF
            </button>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            <strong>Note:</strong> Reports include data from the selected time range ({timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : timeRange === '90d' ? 'Last 90 days' : 'Last year'}).
            All financial data is calculated based on completed sessions only.
          </p>
        </div>
      </div>
    </div>
  );
}