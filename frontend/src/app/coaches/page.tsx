"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CoachPageWrapper from '@/components/CoachPageWrapper'
import DashboardListSkeleton from '@/components/DashboardListSkeleton'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  Users,
  Clock,
  ArrowRight,
  RefreshCw,
  User,
  DollarSign,
  TrendingUp,
  Activity,
  ChevronDown,
  BarChart3
} from 'lucide-react'
import axios from 'axios'
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
} from "recharts"

export default function CoachDashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [appointmentsPage, setAppointmentsPage] = useState(1)
  const [clientsPage, setClientsPage] = useState(1)
  const pageSize = 3

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    appointments: true,
    clients: true,
  })

  const API_URL = getApiUrl()

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleAppointmentClick = (appointmentId: string, status: string) => {
    // Map appointment status to the correct filter
    let filterParam = 'upcoming'
    if (status === 'confirmed') {
      filterParam = 'pending'
    } else if (status === 'cancelled' || status === 'completed') {
      filterParam = 'past'
    } else if (status === 'scheduled') {
      filterParam = 'upcoming'
    }

    router.push(`/coaches/calendar?activeTab=appointments&filter=${filterParam}#appointment-${appointmentId}`)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true)
      }
      const response = await axios.get(`${API_URL}/api/coach/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setDashboardData(response.data.data)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setInitialLoad(false)
    }
  }

  // Remove full screen loading - we now use skeleton loading

  if (error) {
    return (
      <CoachPageWrapper title="Dashboard" description="Overview of your coaching practice">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      </CoachPageWrapper>
    )
  }

  const stats = dashboardData?.stats || {}
  const todayAppointments = dashboardData?.todayAppointments || []
  const recentClients = dashboardData?.recentClients || []

  return (
    <CoachPageWrapper title="Dashboard" description="Overview of your coaching practice">
      <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {/* Today's Appointments Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Today's Appointments
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.todayAppointments || 0}
              </div>
              <div className="text-green-500 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 12%
              </div>
            </div>
          </div>

          {/* Active Clients Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-green-100 dark:group-hover:bg-green-900/30">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Active Clients
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.activeClients || 0}
              </div>
              <div className="text-green-500 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 8%
              </div>
            </div>
          </div>

          {/* Week Sessions Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Week Sessions
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.weekSessions || 0}
              </div>
              <div className="text-green-500 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 15%
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Rating
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.rating || 0}
              </div>
              <div className="text-yellow-500 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ★
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Sections Layout */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          {/* Today's Appointments - Collapsible */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <button
                onClick={() => toggleSection("appointments")}
                className="flex-1 flex items-center text-left touch-manipulation min-h-[44px]"
              >
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span className="flex-1">Today's Appointments</span>
                  <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({todayAppointments.length})
                  </span>
                </h3>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ml-2 flex-shrink-0 ${
                    expandedSections.appointments ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <div className="flex items-center ml-2 sm:ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadDashboardData(true);
                  }}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Refresh appointments"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-gray-500 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {expandedSections.appointments && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4">
                {initialLoad ? (
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
                    {todayAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          No appointments today
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Check your upcoming appointments
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-60 sm:max-h-72 overflow-y-auto">
                        {todayAppointments
                          .slice(0, 5)
                          .map((appointment: any) => (
                          <div
                            key={appointment.id}
                            className="flex items-start sm:items-center space-x-3 py-2.5 px-2 sm:px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer touch-manipulation"
                            onClick={() => handleAppointmentClick(appointment.id, appointment.status)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleAppointmentClick(appointment.id, appointment.status)
                              }
                            }}
                          >
                            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                                appointment.status === 'confirmed'
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : appointment.status === 'scheduled'
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30'
                              }`}>
                                <Calendar className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${
                                  appointment.status === 'confirmed'
                                    ? 'text-green-600 dark:text-green-400'
                                    : appointment.status === 'scheduled'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white leading-tight line-clamp-1">
                                {appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2 mt-0.5">
                                {new Date(appointment.scheduled_at || appointment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">
                                {appointment.status}
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

          {/* Recent Clients - Collapsible */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <button
                onClick={() => toggleSection("clients")}
                className="flex-1 flex items-center text-left touch-manipulation min-h-[44px]"
              >
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span className="flex-1">Recent Clients</span>
                  <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({recentClients.length})
                  </span>
                </h3>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ml-2 flex-shrink-0 ${
                    expandedSections.clients ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <div className="flex items-center ml-2 sm:ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadDashboardData(true);
                  }}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Refresh clients"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-gray-500 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {expandedSections.clients && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4">
                {initialLoad ? (
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
                    {recentClients.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          No recent clients
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Events will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-60 sm:max-h-72 overflow-y-auto">
                        {recentClients
                          .slice(0, 5)
                          .map((session: any) => (
                            <div
                              key={session.id}
                              className="flex items-start sm:items-center space-x-3 py-2.5 px-2 sm:px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer touch-manipulation"
                            >
                              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                                  <User className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-green-600 dark:text-green-400" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white leading-tight line-clamp-1">
                                  {session.clients ? `${session.clients.first_name} ${session.clients.last_name}` : 'Client'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2 mt-0.5">
                                  Last session: {new Date(session.scheduled_at || session.starts_at).toLocaleDateString()}
                                </p>
                                {session.clients?.users?.email && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1 truncate">
                                    {session.clients.users.email}
                                  </p>
                                )}
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
        </div>
      </div>
    </CoachPageWrapper>
  )
}