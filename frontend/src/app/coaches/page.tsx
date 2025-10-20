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
  User
} from 'lucide-react'
import axios from 'axios'

export default function CoachDashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [appointmentsPage, setAppointmentsPage] = useState(1)
  const [clientsPage, setClientsPage] = useState(1)
  const pageSize = 3

  const API_URL = getApiUrl()

  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/coaches/calendar?activeTab=appointments#appointment-${appointmentId}`)
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Today's Apps</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.todayAppointments || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Active Clients</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.activeClients || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Week Sessions</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.weekSessions || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Rating</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.rating || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Two Column Layout with Responsive Height Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Today's Appointments Card */}
          <Card className="h-[400px] sm:h-[450px] lg:h-[500px] flex flex-col">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Today's Appointments</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDashboardData(true)}
                  disabled={isLoading}
                  className="h-8 px-2 sm:px-3 touch-manipulation"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-3 sm:px-6">
              {initialLoad ? (
                <DashboardListSkeleton count={3} type="appointment" />
              ) : (
                <div className="space-y-4">
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No appointments scheduled for today</p>
                      <p className="text-sm">Check your upcoming appointments</p>
                    </div>
                  ) : (
                    todayAppointments
                      .slice((appointmentsPage - 1) * pageSize, appointmentsPage * pageSize)
                      .map((appointment: any) => (
                        <div
                          key={appointment.id}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleAppointmentClick(appointment.id)}
                        >
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              {new Date(appointment.scheduled_at || appointment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                              appointment.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'scheduled'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))
                  )}
                  {/* Pagination Controls */}
                  {todayAppointments.length > pageSize && (
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        Page {appointmentsPage} of {Math.ceil(todayAppointments.length / pageSize)}
                      </span>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={appointmentsPage === 1} 
                          onClick={() => setAppointmentsPage(p => Math.max(1, p - 1))}
                          className="text-xs px-2 sm:px-3 touch-manipulation"
                        >
                          Previous
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={appointmentsPage * pageSize >= todayAppointments.length} 
                          onClick={() => setAppointmentsPage(p => p + 1)}
                          className="text-xs px-2 sm:px-3 touch-manipulation"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Clients Card */}
          <Card className="h-[400px] sm:h-[450px] lg:h-[500px] flex flex-col">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Recent Clients</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDashboardData(true)}
                  disabled={isLoading}
                  className="h-8 px-2 sm:px-3 touch-manipulation"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-3 sm:px-6">
              {initialLoad ? (
                <DashboardListSkeleton count={3} type="client" />
              ) : (
                <div className="space-y-4">
                  {recentClients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent clients</p>
                      <p className="text-sm">Start accepting new appointments</p>
                    </div>
                  ) : (
                    recentClients
                      .slice((clientsPage - 1) * pageSize, clientsPage * pageSize)
                      .map((session: any) => (
                        <div key={session.id} className="flex items-center space-x-3 p-3 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer touch-manipulation">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                              {session.clients ? `${session.clients.first_name} ${session.clients.last_name}` : 'Client'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                              Last session: {new Date(session.scheduled_at || session.starts_at).toLocaleDateString()}
                            </p>
                            {session.clients?.users?.email && (
                              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 truncate">{session.clients.users.email}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        </div>
                      ))
                  )}
                  {/* Pagination Controls */}
                  {recentClients.length > pageSize && (
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        Page {clientsPage} of {Math.ceil(recentClients.length / pageSize)}
                      </span>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={clientsPage === 1} 
                          onClick={() => setClientsPage(p => Math.max(1, p - 1))}
                          className="text-xs px-2 sm:px-3 touch-manipulation"
                        >
                          Previous
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={clientsPage * pageSize >= recentClients.length} 
                          onClick={() => setClientsPage(p => p + 1)}
                          className="text-xs px-2 sm:px-3 touch-manipulation"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </CoachPageWrapper>
  )
}