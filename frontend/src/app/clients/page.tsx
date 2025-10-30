'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {/* Upcoming Appointments Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Upcoming Sessions
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.upcomingAppointments}
              </div>
            </div>
          </div>

          {/* Saved Coaches Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-green-50 dark:group-hover:bg-green-900/20">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-green-500 dark:group-hover:text-green-400 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Saved Coaches
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.savedCoaches}
              </div>
            </div>
          </div>

          {/* Completed Sessions Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Completed Sessions
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                {stats.completedSessions}
              </div>
            </div>
          </div>

          {/* Messages Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/20">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 opacity-70 transition-all duration-300 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Messages
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:translate-x-1">
                0
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/clients/search-coaches">
              <Button className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Find Coaches
              </Button>
            </Link>
            <Link href="/clients/appointments">
              <Button className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                View Appointments
              </Button>
            </Link>
            <Link href="/clients/messages">
              <Button className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[400px] sm:h-[450px] flex flex-col">
            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Upcoming Sessions
              </h3>
              <button
                onClick={() => loadDashboardData(true)}
                disabled={isLoading}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming sessions</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Book a session with a coach</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                      onClick={() => router.push('/clients/appointments')}
                    >
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.date).toLocaleDateString()} at {activity.time}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[400px] sm:h-[450px] flex flex-col">
            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                Recent Activity
              </h3>
              <button
                onClick={() => loadDashboardData(true)}
                disabled={isLoading}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start exploring coaches</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity: any, index: number) => (
                    <div key={`${activity.id}-${index}`} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'appointment' ? 'bg-blue-50 dark:bg-blue-900/20' :
                        activity.type === 'message' ? 'bg-green-50 dark:bg-green-900/20' :
                        'bg-purple-50 dark:bg-purple-900/20'
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
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {activity.subtitle}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}