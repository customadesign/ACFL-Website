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
      <div className="w-full  space-y-4 sm:space-y-5 md:space-y-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {/* Today's Appointments Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Today's Appointments
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.todayAppointments || 0}
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 12%
              </div>
            </div>
          </div>

          {/* Active Clients Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-green-50 dark:group-hover:bg-green-900/20">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-green-500 dark:group-hover:text-green-400 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Active Clients
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.activeClients || 0}
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 8%
              </div>
            </div>
          </div>

          {/* Week Sessions Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Week Sessions
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.weekSessions || 0}
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ↑ 15%
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24">
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
              <div className="bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded text-yellow-600 dark:text-yellow-500 text-xs sm:text-sm font-medium flex items-center transition-transform duration-300 group-hover:scale-110">
                ★
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Sections Layout */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          {/* Today's Appointments - Table Style */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Today's Appointments
              </h3>
              <button
                onClick={() => router.push('/coaches/calendar')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                See all
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {initialLoad ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No appointments today</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAppointments.slice(0, 5).map((appointment: any, index: number) => (
                        <tr
                          key={appointment.id}
                          className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                            index === todayAppointments.slice(0, 5).length - 1 ? 'border-b-0' : ''
                          }`}
                        >
                          <td className="py-4 px-2 text-left">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(appointment.scheduled_at || appointment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              appointment.status === 'confirmed'
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : appointment.status === 'scheduled'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <button
                              onClick={() => handleAppointmentClick(appointment.id, appointment.status)}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Clients - Table Style */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Recent Clients
              </h3>
              <button
                onClick={() => router.push('/coaches/clients')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                See all
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {initialLoad ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent clients</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Session
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentClients.slice(0, 5).map((session: any, index: number) => (
                        <tr
                          key={session.id}
                          className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                            index === recentClients.slice(0, 5).length - 1 ? 'border-b-0' : ''
                          }`}
                        >
                          <td className="py-4 px-2 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.clients ? `${session.clients.first_name} ${session.clients.last_name}` : 'Client'}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {session.clients?.email || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(session.scheduled_at || session.starts_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              session.status === 'completed'
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : session.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : session.status === 'cancelled'
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <button
                              onClick={() => router.push(`/coaches/clients`)}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CoachPageWrapper>
  )
}
