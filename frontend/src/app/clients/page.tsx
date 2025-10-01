'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  Calendar,
  MessageSquare,
  Heart,
  ArrowRight,
  RefreshCw,
  User,
  Clock,
  Search
} from 'lucide-react'
import axios from 'axios'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalCoaches: 0,
    savedCoaches: 0,
    completedSessions: 0
  })

  const API_URL = getApiUrl()

  useEffect(() => {
    if (user) {
      loadDashboardData()
      loadStats()
    }
  }, [user])

  const loadDashboardData = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true)
      }
      const response = await axios.get(`${API_URL}/api/client/activity`, {
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
    }
  }

  const loadStats = async () => {
    try {
      // Get appointments
      const appointmentsRes = await axios.get(`${API_URL}/api/client/appointments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      const appointments = appointmentsRes.data?.success ? appointmentsRes.data.data : []

      const upcoming = appointments.filter((apt: any) =>
        new Date(apt.scheduled_at || apt.starts_at) > new Date()
      ).length || 0

      const completed = appointments.filter((apt: any) =>
        apt.status === 'completed'
      ).length || 0

      // Get saved coaches
      const savedRes = await axios.get(`${API_URL}/api/client/saved-coaches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const saved = savedRes.data?.success ? savedRes.data.data?.length || 0 : 0

      setStats({
        upcomingAppointments: upcoming,
        totalCoaches: saved,
        savedCoaches: saved,
        completedSessions: completed
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['client']}>
        <div className="container mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const upcomingActivities = dashboardData?.activities?.filter((activity: any) =>
    new Date(activity.date) > new Date() && activity.type === 'appointment'
  ).slice(0, 5) || []

  const recentActivity = dashboardData?.activities?.slice(0, 5) || []

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, {user?.first_name}!</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Here's your coaching overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Upcoming</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Saved Coaches</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.savedCoaches}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.completedSessions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Messages</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/clients/search-coaches">
                <Button className="w-full" variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Find Coaches
                </Button>
              </Link>
              <Link href="/clients/appointments">
                <Button className="w-full" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Appointments
                </Button>
              </Link>
              <Link href="/clients/messages">
                <Button className="w-full" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Upcoming Appointments */}
          <Card className="h-[400px] sm:h-[450px] flex flex-col">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Upcoming Sessions</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDashboardData(true)}
                  disabled={isLoading}
                  className="h-8 px-2 sm:px-3"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-3 sm:px-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming sessions</p>
                  <p className="text-sm">Book a session with a coach</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(activity.date).toLocaleDateString()} at {activity.time}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="h-[400px] sm:h-[450px] flex flex-col">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Recent Activity</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDashboardData(true)}
                  disabled={isLoading}
                  className="h-8 px-2 sm:px-3"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-3 sm:px-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start exploring coaches</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity: any, index: number) => (
                    <div key={`${activity.id}-${index}`} className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'appointment' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        activity.type === 'message' ? 'bg-green-100 dark:bg-green-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        {activity.type === 'appointment' ? (
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : activity.type === 'message' ? (
                          <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-300 truncate">
                          {activity.subtitle}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}