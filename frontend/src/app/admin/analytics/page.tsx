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
  FileSpreadsheet,
  ChevronDown
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
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">Platform performance metrics and insights</p>
            </div>

            {/* Export Buttons - Desktop only */}
            <div className="hidden sm:flex gap-2 flex-shrink-0">
              <button
                onClick={() => exportToCSV(analyticsData, 'analytics-report')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm text-sm whitespace-nowrap"
                title="Export to CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden md:inline">Export CSV</span>
                <span className="md:hidden">CSV</span>
              </button>
              <button
                onClick={() => exportToPDF(analyticsData, 'analytics-report')}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm text-sm whitespace-nowrap"
                title="Export to PDF"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Export PDF</span>
                <span className="md:hidden">PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm sm:shadow-md border border-gray-200 dark:border-gray-700 mt-3 sm:mt-4 overflow-hidden">
          {/* Filter Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">Time Range & Export</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Select time period and export options</p>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {/* Time Range Selector */}
              <div>
                <label htmlFor="time-range" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                    <span>Time Range</span>
                  </div>
                </label>
                <div className="relative">
                  <select
                    id="time-range"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 pr-8 sm:pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-white shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Export Buttons - Mobile */}
              <div className="sm:hidden">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span>Quick Export</span>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => exportToCSV(analyticsData, 'analytics-report')}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm font-medium touch-manipulation"
                  >
                    <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => exportToPDF(analyticsData, 'analytics-report')}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-sm font-medium touch-manipulation"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-start sm:items-center gap-2 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Viewing analytics for {timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : timeRange === '90d' ? 'last 90 days' : 'last year'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  Data updated in real-time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards - Mobile-optimized layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        {/* Total Users Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-105 cursor-pointer group border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Users</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate transition-transform duration-300 group-hover:translate-x-1">{analyticsData.overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 flex-shrink-0 ml-2">
              <Users className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-1">
            {getGrowthIcon(analyticsData.overview.userGrowth)}
            <span className={`text-xs sm:text-sm ml-0.5 font-medium ${getGrowthColor(analyticsData.overview.userGrowth)}`}>
              {formatPercentage(analyticsData.overview.userGrowth)}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>

        {/* Total Coaches Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-105 cursor-pointer group border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Coaches</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate transition-transform duration-300 group-hover:translate-x-1">{analyticsData.overview.totalCoaches.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 flex-shrink-0 ml-2">
              <UserCheck className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-1">
            {getGrowthIcon(analyticsData.overview.coachGrowth)}
            <span className={`text-xs sm:text-sm ml-0.5 font-medium ${getGrowthColor(analyticsData.overview.coachGrowth)}`}>
              {formatPercentage(analyticsData.overview.coachGrowth)}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>

        {/* Completed Sessions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-105 cursor-pointer group border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Completed Sessions</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate transition-transform duration-300 group-hover:translate-x-1">{analyticsData.overview.totalSessions.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 flex-shrink-0 ml-2">
              <Calendar className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-1">
            {getGrowthIcon(analyticsData.overview.sessionGrowth)}
            <span className={`text-xs sm:text-sm ml-0.5 font-medium ${getGrowthColor(analyticsData.overview.sessionGrowth)}`}>
              {formatPercentage(analyticsData.overview.sessionGrowth)}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-105 cursor-pointer group border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Revenue</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate transition-transform duration-300 group-hover:translate-x-1">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 flex-shrink-0 ml-2">
              <DollarSign className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-1">
            {getGrowthIcon(analyticsData.overview.revenueGrowth)}
            <span className={`text-xs sm:text-sm ml-0.5 font-medium ${getGrowthColor(analyticsData.overview.revenueGrowth)}`}>
              {formatPercentage(analyticsData.overview.revenueGrowth)}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics - Mobile-optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        {/* User Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] border border-gray-200 dark:border-gray-700 group">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-2 sm:mr-3 transition-colors duration-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="truncate">User Metrics</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">New Users This Month</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{analyticsData.userMetrics.newUsersThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Active Users</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{analyticsData.userMetrics.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">User Retention Rate</span>
              <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 text-right">{analyticsData.userMetrics.userRetentionRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Avg Sessions Per User</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{analyticsData.userMetrics.averageSessionsPerUser}</span>
            </div>
          </div>
        </div>

        {/* Coach Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] border border-gray-200 dark:border-gray-700 group">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-2 sm:mr-3 transition-colors duration-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 flex-shrink-0">
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="truncate">Coach Metrics</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Average Rating</span>
              <div className="flex items-center text-right">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mr-1 flex-shrink-0 fill-current" />
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{analyticsData.coachMetrics.averageRating}</span>
              </div>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Total Coach Hours</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{analyticsData.coachMetrics.totalCoachHours.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Avg Session Duration</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{analyticsData.coachMetrics.averageSessionDuration} min</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Coach Utilization Rate</span>
              <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 text-right">{analyticsData.coachMetrics.coachUtilizationRate}%</span>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] border border-gray-200 dark:border-gray-700 group">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mr-2 sm:mr-3 transition-colors duration-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="truncate">Financial Metrics</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Monthly Recurring Revenue</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{formatCurrency(analyticsData.financialMetrics.monthlyRecurringRevenue)}</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Average Session Value</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{formatCurrency(analyticsData.financialMetrics.averageSessionValue)}</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Revenue Per User</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">{formatCurrency(analyticsData.financialMetrics.revenuePerUser)}</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Conversion Rate</span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right">{analyticsData.financialMetrics.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Session Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 sm:hover:scale-[1.02] border border-gray-200 dark:border-gray-700 group">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-2 sm:mr-3 transition-colors duration-300 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 flex-shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="truncate">Session Metrics</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Completion Rate</span>
              <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 text-right">{analyticsData.sessionMetrics.completionRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">No-Show Rate</span>
              <span className="text-xs sm:text-sm font-semibold text-yellow-600 dark:text-yellow-400 text-right">{analyticsData.sessionMetrics.noShowRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Cancellation Rate</span>
              <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 text-right">{analyticsData.sessionMetrics.cancellationRate}%</span>
            </div>
            <div className="flex justify-between items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Average Session Rating</span>
              <div className="flex items-center text-right">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mr-1 flex-shrink-0 fill-current" />
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{analyticsData.sessionMetrics.averageRating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers and Specialties - Mobile-optimized */}
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Top Coaches - Mobile with horizontal scroll */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="truncate">Top Performing Coaches</span>
          </h3>
          
          {/* Mobile: Vertical list */}
          <div className="block sm:hidden space-y-2">
            {analyticsData.topCoaches.map((coach, index) => (
              <div key={coach.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-7 h-7 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 sm:mr-3 flex-shrink-0 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{coach.name}</p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Star className="h-3 w-3 text-yellow-400 mr-1 flex-shrink-0 fill-current" />
                      <span className="font-medium">{coach.rating}</span>
                      <span className="mx-1">•</span>
                      <span className="truncate">{coach.sessions} sessions</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(coach.revenue)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">revenue</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop: Vertical list */}
          <div className="hidden sm:block space-y-2">
            {analyticsData.topCoaches.map((coach, index) => (
              <div key={coach.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all duration-200 group">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{coach.name}</p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Star className="h-3 w-3 text-yellow-400 mr-1 flex-shrink-0 fill-current" />
                      <span className="font-medium">{coach.rating}</span>
                      <span className="mx-1">•</span>
                      <span>{coach.sessions} sessions</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(coach.revenue)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Specialties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="truncate">Popular Specialties</span>
          </h3>
          <div className="space-y-2">
            {analyticsData.topSpecialties.map((specialty, index) => (
              <div key={specialty.name} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                <div className="flex items-center min-w-0 flex-1">
                  <div
                    className="w-3 h-3 rounded-full mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
                    style={{
                      backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                    }}
                  ></div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{specialty.name}</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{specialty.sessions}</span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">sessions</span>
                  <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">({specialty.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}