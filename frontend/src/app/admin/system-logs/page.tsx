'use client';

import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
  Info,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  X
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { getApiUrl } from '@/lib/api';

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  action: string;
  user_type: 'admin' | 'staff' | 'coach' | 'client';
  user_id: string;
  user_name: string;
  user_email: string;
  details: string;
  metadata: Record<string, any>;
  ip_address: string;
  user_agent: string;
  source: string;
}

interface LogsResponse {
  success: boolean;
  logs: SystemLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    levels: {
      INFO: number;
      WARN: number;
      ERROR: number;
    };
    sources: Record<string, number>;
    user_types: Record<string, number>;
  };
  filters: {
    level?: string;
    action?: string;
    user_type?: string;
  };
}

export default function SystemLogs() {
  const { isAdmin } = usePermissions();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    levels: { INFO: 0, WARN: 0, ERROR: 0 },
    sources: {},
    user_types: {}
  });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/admin';
      return;
    }
  }, [isAdmin]);

  const fetchSystemLogs = async (page = 1, filters = {}, limit = itemsPerPage) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/api/admin/system-logs?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system logs');
      }

      const data: LogsResponse = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        throw new Error('Failed to fetch system logs');
      }
    } catch (error) {
      console.error('System logs fetch error:', error);
      // Show error state
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemLogs();
  }, []);

  const handleSearch = () => {
    const filters: Record<string, string> = {};

    if (searchTerm.trim()) {
      filters.action = searchTerm.trim();
    }
    if (levelFilter !== 'all') {
      filters.level = levelFilter;
    }
    if (userTypeFilter !== 'all') {
      filters.user_type = userTypeFilter;
    }

    setCurrentPage(1);
    fetchSystemLogs(1, filters, itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const filters: Record<string, string> = {};

    if (searchTerm.trim()) {
      filters.action = searchTerm.trim();
    }
    if (levelFilter !== 'all') {
      filters.level = levelFilter;
    }
    if (userTypeFilter !== 'all') {
      filters.user_type = userTypeFilter;
    }

    fetchSystemLogs(page, filters, itemsPerPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);

    const filters: Record<string, string> = {};
    if (searchTerm.trim()) {
      filters.action = searchTerm.trim();
    }
    if (levelFilter !== 'all') {
      filters.level = levelFilter;
    }
    if (userTypeFilter !== 'all') {
      filters.user_type = userTypeFilter;
    }

    fetchSystemLogs(1, filters, newItemsPerPage);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (level) {
      case 'ERROR':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      case 'WARN':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'INFO':
      default:
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const viewLogDetails = (log: SystemLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const exportLogs = async () => {
    try {
      const filters: Record<string, string> = {};

      if (searchTerm.trim()) {
        filters.action = searchTerm.trim();
      }
      if (levelFilter !== 'all') {
        filters.level = levelFilter;
      }
      if (userTypeFilter !== 'all') {
        filters.user_type = userTypeFilter;
      }

      const params = new URLSearchParams({
        ...filters,
        export: 'csv'
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/api/admin/system-logs?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor system activity and audit trails
          </p>
        </div>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Logs Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Logs
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
              {isLoading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.total.toLocaleString()
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Info
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:translate-x-1">
              {isLoading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.levels.INFO
              )}
            </div>
          </div>
        </div>

        {/* Warnings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Warnings
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400 transition-transform duration-300 group-hover:translate-x-1">
              {isLoading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.levels.WARN
              )}
            </div>
          </div>
        </div>

        {/* Errors Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group border border-gray-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Errors
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 transition-transform duration-300 group-hover:translate-x-1">
              {isLoading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                stats.levels.ERROR
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Search & Filters
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Filter system logs by action, level, or user type
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Search Input - Full Width */}
          <div className="relative group">
            <label htmlFor="search-logs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                <span>Search Actions</span>
              </div>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                id="search-logs"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by action, user, or details..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01]"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          </div>

          {/* Filter Selects - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Level Filter */}
            <div className="relative group">
              <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span>Level</span>
                </div>
              </label>
              <div className="relative">
                <select
                  id="level-filter"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="INFO">Info</option>
                  <option value="WARN">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* User Type Filter */}
            <div className="relative group">
              <label htmlFor="user-type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span>User Type</span>
                </div>
              </label>
              <div className="relative">
                <select
                  id="user-type-filter"
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="coach">Coach</option>
                  <option value="client">Client</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Items Per Page Filter */}
            <div className="relative group">
              <label htmlFor="items-per-page" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span>Items Per Page</span>
                </div>
              </label>
              <div className="relative">
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 transform hover:scale-[1.01] focus:scale-[1.01] appearance-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Apply Button - Full Width on Mobile */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <button
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
              >
                <Filter className="w-4 h-4" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs - Desktop & Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading system logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-400">No system logs found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden 2xl:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <span className={getLevelBadge(log.level)}>
                            {log.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.user_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {log.user_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {log.details || 'No details'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewLogDetails(log)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                          aria-label="View log details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="2xl:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <div key={`mobile-${log.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="space-y-3">
                    {/* Header with Level and Timestamp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        <span className={getLevelBadge(log.level)}>
                          {log.level}
                        </span>
                      </div>
                      <button
                        onClick={() => viewLogDetails(log)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                        aria-label="View log details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action and Timestamp */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.action}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="flex items-center gap-2 py-2 border-t border-gray-100 dark:border-gray-700">
                      <User className="w-4 h-4 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {log.user_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {log.user_type}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    {log.details && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Details
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {log.details}
                        </div>
                      </div>
                    )}

                    {/* Source */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className="font-medium">Source:</span>
                      <span>{log.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  showItemsRange={true}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Log Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timestamp
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatTimestamp(selectedLog.timestamp)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Level
                    </label>
                    <div className="mt-1">
                      <span className={getLevelBadge(selectedLog.level)}>
                        {selectedLog.level}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Action
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Source
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.source}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      User
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.user_name} ({selectedLog.user_type})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedLog.user_email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      IP Address
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.ip_address || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Details
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedLog.details || 'No details available'}
                  </p>
                </div>

                {selectedLog.user_agent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      User Agent
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}

                {Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Metadata
                    </label>
                    <pre className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}