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
  Activity
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
          <div className="h-9 bg-gray-200 rounded w-1/3 animate-pulse mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        
        {/* Activity Section Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4  sm:px-6 lg:px-8 pt-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your ACFL platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                <p className={`text-sm mt-2 ${
                  card.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {card.change} from last month
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.color} bg-opacity-10`}>
                <card.icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border flex flex-col h-auto mb-6">
          <div className="p-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </h3>
              <button
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Activity className={`h-4 w-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">System events will appear here</p>
                  </div>
                ) : (
                  stats.recentActivity
                    .slice((activityPage - 1) * activityPageSize, activityPage * activityPageSize)
                    .map((activity, index) => (
                    <div key={activity.id || index} className="flex items-center space-x-3 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'user_registered' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          activity.type === 'coach_approved' ? 'bg-green-100 dark:bg-green-900/30' :
                          activity.type === 'appointment_booked' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          <activity.icon className={`h-4 w-4 ${
                            activity.type === 'user_registered' ? 'text-blue-600 dark:text-blue-400' :
                            activity.type === 'coach_approved' ? 'text-green-600 dark:text-green-400' :
                            activity.type === 'appointment_booked' ? 'text-purple-600 dark:text-purple-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Pagination Controls */}
                {stats.recentActivity.length > activityPageSize && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Page {activityPage} of {Math.ceil(stats.recentActivity.length / activityPageSize)}
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        disabled={activityPage === 1} 
                        onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button 
                        disabled={activityPage * activityPageSize >= stats.recentActivity.length} 
                        onClick={() => setActivityPage(p => p + 1)}
                        className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border flex flex-col h-auto mb-6">
          <div className="p-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quick Actions
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/admin/coaches'}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Review Coach Applications</p>
                  <p className="text-sm text-gray-500">{stats.pendingApprovals} pending approvals</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => window.location.href = '/admin/users'}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Users</p>
                  <p className="text-sm text-gray-500">View and manage all platform users</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => window.location.href = '/admin/appointments'}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">View Appointments</p>
                  <p className="text-sm text-gray-500">Monitor all platform appointments</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => window.location.href = '/admin/analytics'}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-500">Platform performance metrics</p>
                </div>
              </div>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">API Services</span>
            <span className="text-sm font-medium text-green-600">Operational</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Database</span>
            <span className="text-sm font-medium text-green-600">Operational</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Video Services</span>
            <span className="text-sm font-medium text-green-600">Operational</span>
          </div>
        </div>
      </div>

      {/* Platform Health Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">1.2s</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">99.2%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-600">Active Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
}