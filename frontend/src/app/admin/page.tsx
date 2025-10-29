"use client";

import { useEffect, useState } from "react";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
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
  MoreVertical,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Maximize2,
  Minimize2,
  Package,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

interface SystemStatus {
  status: string;
  message: string;
  responseTime?: string;
}

interface SystemHealth {
  systemStatus: {
    api: SystemStatus;
    database: SystemStatus;
    services: SystemStatus;
  };
  platformHealth: {
    uptime: string;
    responseTime: string;
    successRate: string;
    activeIssues: number;
  };
  timestamp: string;
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
    recentActivity: [],
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 3;

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    activity: true,
    actions: true,
  });
  const [timeRange, setTimeRange] = useState<
    "monthly" | "quarterly" | "annually"
  >("monthly");

  // Chart data state
  const [monthlySales, setMonthlySales] = useState([
    { name: "Jan", sales: 0 },
    { name: "Feb", sales: 0 },
    { name: "Mar", sales: 0 },
    { name: "Apr", sales: 0 },
    { name: "May", sales: 0 },
    { name: "Jun", sales: 0 },
    { name: "Jul", sales: 0 },
    { name: "Aug", sales: 0 },
    { name: "Sep", sales: 0 },
    { name: "Oct", sales: 0 },
    { name: "Nov", sales: 0 },
    { name: "Dec", sales: 0 },
  ]);

  const [statistics, setStatistics] = useState([
    { month: "Jan", upper: 0, lower: 0 },
    { month: "Feb", upper: 0, lower: 0 },
    { month: "Mar", upper: 0, lower: 0 },
    { month: "Apr", upper: 0, lower: 0 },
    { month: "May", upper: 0, lower: 0 },
    { month: "Jun", upper: 0, lower: 0 },
    { month: "Jul", upper: 0, lower: 0 },
    { month: "Aug", upper: 0, lower: 0 },
    { month: "Sep", upper: 0, lower: 0 },
    { month: "Oct", upper: 0, lower: 0 },
    { month: "Nov", upper: 0, lower: 0 },
    { month: "Dec", upper: 0, lower: 0 },
  ]);

  useEffect(() => {
    fetchDashboardData();
    fetchSystemHealth();
    fetchChartData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      // Fetch dashboard statistics from backend
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      // Map the activity data to include icons
      const activityWithIcons = data.recentActivity.map((activity: any) => ({
        ...activity,
        icon:
          activity.type === "user_registered"
            ? Users
            : activity.type === "coach_approved"
            ? CheckCircle
            : activity.type === "appointment_booked"
            ? Calendar
            : AlertCircle,
      }));

      setStats({
        ...data,
        recentActivity: activityWithIcons,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/system-health`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "System health fetch failed:",
          response.status,
          errorText
        );
        throw new Error(
          `Failed to fetch system health data: ${response.status}`
        );
      }

      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error("Failed to fetch system health data:", error);
      // Set a fallback error state so UI doesn't break
      setSystemHealth({
        systemStatus: {
          api: { status: "unknown", message: "Unable to fetch status" },
          database: { status: "unknown", message: "Unable to fetch status" },
          services: { status: "unknown", message: "Unable to fetch status" },
        },
        platformHealth: {
          uptime: "N/A",
          responseTime: "N/A",
          successRate: "N/A",
          activeIssues: 0,
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsHealthLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("No token found, skipping chart data fetch");
        return;
      }

      const API_URL = getApiUrl();
      console.log("Fetching chart data from:", `${API_URL}/api/admin/chart-data`);

      const response = await fetch(`${API_URL}/api/admin/chart-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Chart data fetch failed:", response.status);
        return;
      }

      const data = await response.json();
      console.log("Chart data received:", data);
      console.log("Monthly sales data:", data.monthlySales);
      console.log("Statistics data:", data.statistics);

      setMonthlySales(data.monthlySales);
      setStatistics(data.statistics);

      console.log("Chart data updated successfully");
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 sm:w-1/3 animate-pulse mb-3"></div>
          <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 sm:w-1/2 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[140px] sm:min-h-[160px]"
            >
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
                  <div
                    key={i}
                    className="flex items-center space-x-4 animate-pulse"
                  >
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
                  <div
                    key={i}
                    className="p-4 sm:p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl animate-pulse"
                  >
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
                <div
                  key={i}
                  className="p-3 sm:p-4 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse"
                >
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
                <div
                  key={i}
                  className="text-center p-4 sm:p-5 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse"
                >
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
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Column 1 & 2: Stats and Chart */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Total Users Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total Users
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-green-500 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 12%
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Monthly Revenue
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                ${(stats.monthlyRevenue / 1000).toFixed(1)}K
              </div>
              <div className="text-green-500 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 18%
              </div>
            </div>
          </div>

          {/* Monthly Sales Chart - Spanning 2 columns below the cards */}
          <div className="sm:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Monthly Sales
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform duration-300 hover:rotate-90 p-2 -mr-2 touch-manipulation" aria-label="More options">
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={180} className="sm:hidden">
              <BarChart data={monthlySales}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                />
                <Bar
                  dataKey="sales"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={220} className="hidden sm:block">
              <BarChart data={monthlySales}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                />
                <Bar
                  dataKey="sales"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Monthly Target Card */}
        <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/10 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <div>
                <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Monthly Target
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Target you've set for each month
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform duration-300 hover:rotate-90 p-2 -mr-2 touch-manipulation" aria-label="More options">
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Circular Progress - Responsive sizing */}
            <div className="flex justify-center items-center mb-4 sm:mb-5 md:mb-6">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                    strokeWidth="14"
                    fill="none"
                  />
                  {/* Progress circle with gradient */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#progressGradient)"
                    strokeWidth="14"
                    fill="none"
                    strokeDasharray={553}
                    strokeDashoffset={553 - 553 * (stats.monthlyRevenue / 20000)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out drop-shadow-lg"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))",
                    }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                    {((stats.monthlyRevenue / 20000) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">of target</div>
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">18%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Section */}
            <div className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Great Progress!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  You've earned <span className="font-semibold text-indigo-600 dark:text-indigo-400">${stats.monthlyRevenue.toLocaleString()}</span> this month.
                  That's higher than last month. Keep up your excellent work!
                </p>
              </div>
            </div>

            {/* Stats Grid - Responsive with icons */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-2 sm:p-3 text-center border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                <div className="flex justify-center mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Target
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  $20K
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-2 sm:p-3 text-center border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                <div className="flex justify-center mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Revenue
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  ${(stats.monthlyRevenue / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-2 sm:p-3 text-center border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className="flex justify-center mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Coaches
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {stats.totalCoaches}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4">
          <div>
            <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Statistics
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Revenue targets and achievements
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setTimeRange("monthly")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                timeRange === "monthly"
                  ? "text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange("quarterly")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                timeRange === "quarterly"
                  ? "text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setTimeRange("annually")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                timeRange === "annually"
                  ? "text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Annually
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180} className="sm:hidden">
          <AreaChart data={statistics}>
            <defs>
              <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#e0e7ff" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
              className="dark:stroke-gray-700"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              cursor={{ stroke: "#818cf8", strokeWidth: 2, strokeDasharray: "5 5" }}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stackId="1"
              stroke="#818cf8"
              fill="url(#colorUpper)"
              strokeWidth={2}
              animationDuration={1200}
              animationBegin={0}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stackId="1"
              stroke="#a5b4fc"
              fill="url(#colorLower)"
              strokeWidth={2}
              animationDuration={1200}
              animationBegin={200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={220} className="hidden sm:block">
          <AreaChart data={statistics}>
            <defs>
              <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#e0e7ff" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
              className="dark:stroke-gray-700"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              cursor={{ stroke: "#818cf8", strokeWidth: 2, strokeDasharray: "5 5" }}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stackId="1"
              stroke="#818cf8"
              fill="url(#colorUpper)"
              strokeWidth={2}
              animationDuration={1200}
              animationBegin={0}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stackId="1"
              stroke="#a5b4fc"
              fill="url(#colorLower)"
              strokeWidth={2}
              animationDuration={1200}
              animationBegin={200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Main Dashboard Sections Layout with Consistent Spacing */}
      <div className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
        {/* Recent Activity - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <button
              onClick={() => toggleSection("activity")}
              className="flex-1 flex items-center text-left touch-manipulation min-h-[44px]"
            >
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span className="flex-1">Recent Activity</span>
                <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({stats.recentActivity.length})
                </span>
              </h3>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform ml-2 flex-shrink-0 ${
                  expandedSections.activity ? "transform rotate-180" : ""
                }`}
              />
            </button>
            <div className="flex items-center ml-2 sm:ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchDashboardData();
                }}
                disabled={isLoading}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Refresh activity"
              >
                <Activity
                  className={`h-4 w-4 text-gray-500 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {expandedSections.activity && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-3 animate-pulse"
                    >
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
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        No recent activity
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Events will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 sm:max-h-72 overflow-y-auto">
                      {stats.recentActivity
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div
                            key={activity.id || index}
                            className="flex items-start sm:items-center space-x-3 py-2.5 px-2 sm:px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer touch-manipulation"
                          >
                            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                              <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                                  activity.type === "user_registered"
                                    ? "bg-blue-100 dark:bg-blue-900/30"
                                    : activity.type === "coach_approved"
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : activity.type === "appointment_booked"
                                    ? "bg-purple-100 dark:bg-purple-900/30"
                                    : "bg-yellow-100 dark:bg-yellow-900/30"
                                }`}
                              >
                                <activity.icon
                                  className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${
                                    activity.type === "user_registered"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : activity.type === "coach_approved"
                                      ? "text-green-600 dark:text-green-400"
                                      : activity.type === "appointment_booked"
                                      ? "text-purple-600 dark:text-purple-400"
                                      : "text-yellow-600 dark:text-yellow-400"
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white leading-tight line-clamp-1">
                                {activity.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2 mt-0.5">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection("actions")}
            className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-manipulation min-h-[60px]"
          >
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              Quick Actions
            </h3>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${
                expandedSections.actions ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.actions && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <PermissionGate permission={PERMISSIONS.USERS_VIEW}>
                  <button
                    onClick={() =>
                      (window.location.href = "/admin/coach-applications")
                    }
                    className="flex items-center p-3 sm:p-3.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group touch-manipulation min-h-[60px]"
                  >
                    <div className="flex-shrink-0 p-2 sm:p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 transition-colors mr-3">
                      <UserCheck className="h-5 w-5 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm sm:text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        Coach Applications
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                        {stats.pendingApprovals} pending
                      </p>
                    </div>
                  </button>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.USERS_VIEW}>
                  <button
                    onClick={() => (window.location.href = "/admin/users")}
                    className="flex items-center p-3 sm:p-3.5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group touch-manipulation min-h-[60px]"
                  >
                    <div className="flex-shrink-0 p-2 sm:p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 transition-colors mr-3">
                      <Users className="h-5 w-5 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm sm:text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        Manage Users
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                        View all users
                      </p>
                    </div>
                  </button>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.APPOINTMENTS_VIEW}>
                  <button
                    onClick={() =>
                      (window.location.href = "/admin/appointments")
                    }
                    className="flex items-center p-3 sm:p-3.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group touch-manipulation min-h-[60px]"
                  >
                    <div className="flex-shrink-0 p-2 sm:p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 transition-colors mr-3">
                      <Calendar className="h-5 w-5 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm sm:text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        Appointments
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                        View schedule
                      </p>
                    </div>
                  </button>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ANALYTICS_VIEW}>
                  <button
                    onClick={() => (window.location.href = "/admin/analytics")}
                    className="flex items-center p-3 sm:p-3.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group touch-manipulation min-h-[60px]"
                  >
                    <div className="flex-shrink-0 p-2 sm:p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 group-hover:bg-orange-200 transition-colors mr-3">
                      <BarChart3 className="h-5 w-5 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm sm:text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        Analytics
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                        View metrics
                      </p>
                    </div>
                  </button>
                </PermissionGate>
              </div>
            </div>
          )}
        </div>

        {/* System Status & Health - Compact Horizontal Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              System Status
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            {isHealthLoading ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center flex-1 p-3 sm:p-3.5 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"
                  >
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 mr-2 sm:mr-3"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-1"></div>
                      <div className="h-2.5 sm:h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : systemHealth ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {Object.entries(systemHealth.systemStatus).map(
                  ([key, service]) => {
                    const isOperational = service.status === "operational";
                    const isDegraded = service.status === "degraded";
                    const bgColor = isOperational
                      ? "bg-green-50 dark:bg-green-900/10"
                      : isDegraded
                      ? "bg-yellow-50 dark:bg-yellow-900/10"
                      : "bg-red-50 dark:bg-red-900/10";
                    const dotColor = isOperational
                      ? "bg-green-500"
                      : isDegraded
                      ? "bg-yellow-500"
                      : "bg-red-500";
                    const textColor = isOperational
                      ? "text-green-600 dark:text-green-400"
                      : isDegraded
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400";

                    return (
                      <div
                        key={key}
                        className={`flex items-center flex-1 p-3 sm:p-3.5 rounded-lg ${bgColor}`}
                      >
                        <div
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${dotColor} rounded-full flex-shrink-0 ${
                            isOperational ? "animate-pulse" : ""
                          } mr-2 sm:mr-3`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 block capitalize">
                            {key}
                          </span>
                          <span
                            className={`text-xs font-semibold ${textColor} capitalize`}
                          >
                            {service.status}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm">Failed to load system status</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Health - Responsive Grid Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              Platform Health
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            {isHealthLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="text-center p-2.5 sm:p-3 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"
                  >
                    <div className="h-5 sm:h-6 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto mb-1.5 sm:mb-2"></div>
                    <div className="h-2.5 sm:h-3 bg-gray-300 dark:bg-gray-600 rounded w-12 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : systemHealth ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="text-center p-2.5 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-green-600 dark:text-green-400 mb-0.5 sm:mb-1">
                    {systemHealth.platformHealth.uptime}
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Uptime
                  </div>
                </div>
                <div className="text-center p-2.5 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 mb-0.5 sm:mb-1">
                    {systemHealth.platformHealth.responseTime}
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Response
                  </div>
                </div>
                <div className="text-center p-2.5 sm:p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400 mb-0.5 sm:mb-1">
                    {systemHealth.platformHealth.successRate}
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Success
                  </div>
                </div>
                <div
                  className={`text-center p-2.5 sm:p-3 rounded-lg ${
                    systemHealth.platformHealth.activeIssues === 0
                      ? "bg-green-50 dark:bg-green-900/10"
                      : "bg-orange-50 dark:bg-orange-900/10"
                  }`}
                >
                  <div
                    className={`text-base sm:text-lg md:text-xl font-bold mb-0.5 sm:mb-1 ${
                      systemHealth.platformHealth.activeIssues === 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {systemHealth.platformHealth.activeIssues}
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Issues
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm">Failed to load platform health</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
