'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Grid3x3,
  List,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalCoaches: number;
  totalClients: number;
  totalAppointments: number;
  pendingApprovals: number;
  activeMatches: number;
  monthlyRevenue: number;
  recentActivity: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCoaches: 0,
    totalClients: 0,
    totalAppointments: 0,
    pendingApprovals: 0,
    activeMatches: 0,
    monthlyRevenue: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 3;
  
  // Mobile layout state
  const [viewMode, setViewMode] = useState<'cards' | 'compact' | 'list'>('cards');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    activity: true,
    actions: true
  });
  const [showAllStats, setShowAllStats] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Fetch dashboard statistics from backend
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      // Map the activity data to include icons
      const activityWithIcons = data.recentActivity.map((activity: any) => ({
        ...activity,
        icon: activity.type === 'user_registered' ? Users :
              activity.type === 'coach_approved' ? CheckCircle :
              activity.type === 'appointment_booked' ? Calendar :
              AlertCircle
      }));

      setStats({
        ...data,
        recentActivity: activityWithIcons
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function to get priority stats for compact view
  const getPriorityStats = () => {
    const priority = [
      {
        title: 'Users',
        value: stats.totalUsers,
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        change: '+12%',
        changeType: 'positive' as const
      },
      {
        title: 'Coaches',
        value: stats.totalCoaches,
        icon: UserCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        change: '+8%',
        changeType: 'positive' as const
      },
      {
        title: 'Revenue',
        value: `$${(stats.monthlyRevenue / 1000).toFixed(0)}k`,
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        change: '+18%',
        changeType: 'positive' as const
      }
    ];
    return showAllStats ? statCards : priority;
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Coaches',
      value: stats.totalCoaches,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'bg-orange-500',
      change: '+22%',
      changeType: 'positive'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'negative'
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+18%',
      changeType: 'positive'
    }
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 sm:w-1/3 animate-pulse mb-3"></div>
          <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 sm:w-1/2 animate-pulse"></div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[140px] sm:min-h-[160px]">
              <div className="animate-pulse">
                <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Activity & Quick Actions Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Activity Section Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="h-6 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-4 sm:space-y-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick Actions Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="h-6 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 sm:p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* System Status & Health Skeleton */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="h-6 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse mb-5 sm:mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 sm:p-4 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-1"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="h-6 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse mb-5 sm:mb-6"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center p-4 sm:p-5 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                  <div className="h-8 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-16">
      {/* Enhanced Header with View Mode Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Overview of your ACFL platform</p>
          </div>
          
          {/* Mobile View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Grid3x3 className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline"></span>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline"></span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Stats Display Based on View Mode */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {statCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 min-h-[120px] sm:min-h-[140px]"
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 mr-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 leading-tight">
                    {card.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-none">
                    {card.value}
                  </p>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    card.changeType === 'positive' 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${
                      card.changeType === 'negative' ? 'rotate-180' : ''
                    }`} />
                    {card.change}
                  </div>
                </div>
                <div className={`flex-shrink-0 p-2.5 sm:p-3 rounded-lg ${card.color} bg-opacity-10`}>
                  <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact View */}
      {viewMode === 'compact' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Overview
              </h3>
              <button
                onClick={() => setShowAllStats(!showAllStats)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAllStats ? <Minimize2 className="h-4 w-4 mr-1" /> : <Maximize2 className="h-4 w-4 mr-1" />}
                {showAllStats ? 'Show Less' : 'Show All'}
              </button>
            </div>
          </div>
          <div className="p-4">
            {/* Priority Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {getPriorityStats().slice(0, 3).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex p-2 rounded-lg ${'bgColor' in stat ? `${(stat as any).bgColor} dark:${(stat as any).bgColor.replace('-50', '-900/20')}` : 'bg-gray-100 dark:bg-gray-700'} mb-2`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {stat.title}
                  </div>
                  <div className={`text-xs mt-1 ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Expandable Additional Stats */}
            {showAllStats && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {statCards.slice(3).map((card, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`p-1.5 rounded ${card.color} bg-opacity-10 mr-3`}>
                        <card.icon className={`h-4 w-4 ${card.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {card.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <List className="h-5 w-5 mr-2" />
              Statistics
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {statCards.map((card, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${card.color} bg-opacity-10 mr-3`}>
                      <card.icon className={`h-4 w-4 ${card.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {card.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Updated just now
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-3">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {card.value}
                      </div>
                      <div className={`text-xs font-medium ${
                        card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Sections Layout with Consistent Spacing */}
      <div className="space-y-6">
        {/* Recent Activity - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <button
              onClick={() => toggleSection('activity')}
              className="flex-1 flex items-center text-left"
            >
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Recent Activity
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({stats.recentActivity.length})
                </span>
              </h3>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ml-2 ${
                expandedSections.activity ? 'transform rotate-180' : ''
              }`} />
            </button>
            <div className="flex items-center ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchDashboardData();
                }}
                disabled={isLoading}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                aria-label="Refresh activity"
              >
                <Activity className={`h-4 w-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {expandedSections.activity && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No recent activity</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Events will appear here</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {stats.recentActivity
                        .slice(0, 5)
                        .map((activity, index) => (
                        <div 
                          key={activity.id || index} 
                          className="flex items-center space-x-3 py-2.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex-shrink-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              activity.type === 'user_registered' ? 'bg-blue-100 dark:bg-blue-900/30' :
                              activity.type === 'coach_approved' ? 'bg-green-100 dark:bg-green-900/30' :
                              activity.type === 'appointment_booked' ? 'bg-purple-100 dark:bg-purple-900/30' :
                              'bg-yellow-100 dark:bg-yellow-900/30'
                            }`}>
                              <activity.icon className={`h-3.5 w-3.5 ${
                                activity.type === 'user_registered' ? 'text-blue-600 dark:text-blue-400' :
                                activity.type === 'coach_approved' ? 'text-green-600 dark:text-green-400' :
                                activity.type === 'appointment_booked' ? 'text-purple-600 dark:text-purple-400' :
                                'text-yellow-600 dark:text-yellow-400'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('actions')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Quick Actions
            </h3>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
              expandedSections.actions ? 'transform rotate-180' : ''
            }`} />
          </button>
          
          {expandedSections.actions && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => window.location.href = '/admin/coach-applications'}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 transition-colors mr-3">
                    <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      Coach Applications
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {stats.pendingApprovals} pending
                    </p>
                  </div>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/admin/users'}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group"
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 transition-colors mr-3">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      Manage Users
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      View all users
                    </p>
                  </div>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/admin/appointments'}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 transition-colors mr-3">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      Appointments
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      View schedule
                    </p>
                  </div>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/admin/analytics'}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group"
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 group-hover:bg-orange-200 transition-colors mr-3">
                    <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      Analytics
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      View metrics
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* System Status & Health - Compact Horizontal Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">System Status</h3>
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center flex-1 p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 animate-pulse mr-3"></div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">API</span>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">Operational</span>
                </div>
              </div>
              <div className="flex items-center flex-1 p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 animate-pulse mr-3"></div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Database</span>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">Operational</span>
                </div>
              </div>
              <div className="flex items-center flex-1 p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 animate-pulse mr-3"></div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Services</span>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Health - Horizontal Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Platform Health</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                  98.5%
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Uptime
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  1.2s
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Response
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  99.2%
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Success
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <div className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  0
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Issues
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}