'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import useNotification from '@/hooks/useNotification';
import NotificationModal from '@/components/NotificationModal';

interface AppointmentData {
  id: string;
  clientName: string;
  clientEmail: string;
  coachName: string;
  coachEmail: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'confirmed';
  type: 'video' | 'in-person';
  notes?: string;
  created_at: string;
  adminNotes?: string;
  cancellationReason?: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  coachId: string;
  reportType: 'summary' | 'detailed' | 'analytics';
}

interface ReportStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  avgDuration: number;
  topCoaches: Array<{ name: string; count: number; completionRate: number }>;
  appointmentsByDay: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; completed: number; cancelled: number; noShow: number }>;
}

export default function AppointmentReports() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [coaches, setCoaches] = useState<Array<{ id: string; name: string }>>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { notification, hideNotification, showError, showSuccess } = useNotification();

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all',
    coachId: 'all',
    reportType: 'summary'
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  useEffect(() => {
    filterAppointments();
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        showError('Authentication Error', 'No authentication token found. Please login again.');
        return;
      }

      const API_URL = getApiUrl();

      // Build query parameters for the reports endpoint
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.coachId !== 'all') queryParams.set('coachId', filters.coachId);
      queryParams.set('groupBy', 'day');

      const response = await fetch(`${API_URL}/api/admin/appointments/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch appointment reports`);
      }

      const data = await response.json();

      // Use the structured data from the reports endpoint
      if (data.rawData) {
        setAppointments(data.rawData);
      }

      // Update the stats with the calculated data from backend
      if (data.summary) {
        setReportStats({
          totalAppointments: data.summary.totalAppointments,
          completedAppointments: data.summary.completedAppointments,
          cancelledAppointments: data.summary.cancelledAppointments,
          noShowAppointments: data.summary.noShowAppointments,
          avgDuration: data.summary.avgDuration,
          topCoaches: data.coachMetrics?.slice(0, 5).map((coach: any) => ({
            name: coach.coachName,
            count: coach.totalSessions,
            completionRate: coach.completionRate
          })) || [],
          appointmentsByDay: data.timeSeriesData || [],
          statusDistribution: data.statusDistribution?.map((item: any) => ({
            ...item,
            percentage: data.summary.totalAppointments > 0
              ? (item.count / data.summary.totalAppointments) * 100
              : 0
          })) || [],
          monthlyTrend: [] // Will be calculated from timeSeriesData if needed
        });
      }
    } catch (error) {
      console.error('Failed to fetch appointment reports:', error);
      showError('Load Error', `Failed to load appointment reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();

      const response = await fetch(`${API_URL}/api/admin/users?role=coach`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const coachList = data.users?.filter((user: any) => user.role === 'coach').map((coach: any) => ({
          id: coach.id,
          name: coach.name || `${coach.first_name || ''} ${coach.last_name || ''}`.trim()
        })) || [];
        setCoaches(coachList);
      }
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
    }
  };

  const filterAppointments = () => {
    // This function is now simplified since filtering is handled by the backend
    setFilteredAppointments(appointments);
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);

      // Prepare CSV data
      const csvData = appointments.map(apt => ({
        'Appointment ID': apt.id,
        'Client Name': apt.clientName,
        'Client Email': apt.clientEmail,
        'Coach Name': apt.coachName,
        'Coach Email': apt.coachEmail,
        'Date': apt.date,
        'Time': apt.time,
        'Duration (minutes)': apt.duration,
        'Status': apt.status,
        'Type': apt.type,
        'Notes': apt.notes || '',
        'Admin Notes': apt.adminNotes || '',
        'Cancellation Reason': apt.cancellationReason || '',
        'Created At': new Date(apt.created_at).toLocaleString()
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row] || '';
            // Escape commas and quotes
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `appointment-report-${filters.startDate}-to-${filters.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Export Successful', `Exported ${appointments.length} appointments to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Export Error', 'Failed to export appointments');
    } finally {
      setIsExporting(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Appointment Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate comprehensive reports and analytics for appointment data</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <Filter className="h-4 w-4 mr-1" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDown className={`h-4 w-4 ml-1 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coach</label>
              <select
                value={filters.coachId}
                onChange={(e) => setFilters({ ...filters, coachId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Coaches</option>
                {coaches.map(coach => (
                  <option key={coach.id} value={coach.id}>{coach.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAppointments}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {appointments.length} appointments
            </span>
            <button
              onClick={exportToCSV}
              disabled={isExporting || appointments.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {reportStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Appointments"
              value={reportStats.totalAppointments}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Completed"
              value={reportStats.completedAppointments}
              change={`${((reportStats.completedAppointments / reportStats.totalAppointments) * 100).toFixed(1)}% completion rate`}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Cancelled"
              value={reportStats.cancelledAppointments}
              change={`${((reportStats.cancelledAppointments / reportStats.totalAppointments) * 100).toFixed(1)}% cancellation rate`}
              icon={XCircle}
              color="red"
            />
            <StatCard
              title="No Shows"
              value={reportStats.noShowAppointments}
              change={`${((reportStats.noShowAppointments / reportStats.totalAppointments) * 100).toFixed(1)}% no-show rate`}
              icon={AlertCircle}
              color="yellow"
            />
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Status Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
              <div className="space-y-3">
                {reportStats.statusDistribution.map(item => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {item.status.replace('-', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Coaches */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Coaches</h3>
              <div className="space-y-4">
                {reportStats.topCoaches.map((coach, index) => (
                  <div key={coach.name} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{coach.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {coach.count} appointments • {coach.completionRate.toFixed(1)}% completion rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">6-Month Trend</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {reportStats.monthlyTrend.map((month) => (
                <div key={month.month} className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{month.month}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      {month.completed}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3 inline mr-1" />
                      {month.cancelled}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {month.noShow}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!reportStats && appointments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No appointments found for the selected filters. Try adjusting your date range or filters.
          </p>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}