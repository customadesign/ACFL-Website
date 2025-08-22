'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getClientActivity } from '@/lib/api'
import { 
  Search, 
  Heart, 
  Calendar, 
  MessageCircle, 
  User,
  ArrowRight,
  Clock,
  Star,
  RefreshCw
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'appointment' | 'message' | 'saved' | 'search'
  title: string
  subtitle: string
  date: string
  time: string
  timestamp: number
  data: any
}

function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 3
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const activityData = await getClientActivity()
      setRecentActivity(activityData)
    } catch (error) {
      console.error('Error loading activity:', error)
      setError('Failed to load recent activity')
      // Fallback to empty array
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  const handleLogout = () => {
    logout()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'saved':
        return <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'search':
        return <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return 'Today'
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const handleActivityClick = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'appointment':
        router.push('/clients/appointments')
        break
      case 'message':
        router.push('/clients/messages')
        break
      case 'saved':
        router.push('/clients/search-coaches')
        break
      case 'search':
        router.push('/clients/search-coaches')
        break
      default:
        break
    }
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.first_name || 'Client'}!
          </h2>
          <p className="text-muted-foreground">
            Ready to continue your coaching journey? Here's what you can do today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/clients/search-coaches')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Find Coaches</h3>
                  <p className="text-sm text-muted-foreground">Search for new coaches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/clients/saved-coaches')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Saved Coaches</h3>
                  <p className="text-sm text-muted-foreground">View your favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/clients/appointments')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Appointments</h3>
                  <p className="text-sm text-muted-foreground">Manage your sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/clients/messages')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Messages</h3>
                  <p className="text-sm text-muted-foreground">Chat with coaches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="h-[50vh] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activity</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadActivity}
                  disabled={loading}
                  className="h-8 px-3"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center text-red-600">
                  {error}
                  <Button variant="outline" onClick={loadActivity} className="mt-4">
                    <RefreshCw className="mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No recent activity yet</p>
                        <p className="text-sm">Start by searching for coaches or scheduling sessions</p>
                      </div>
                    ) : (
                      recentActivity
                        .slice((page - 1) * pageSize, page * pageSize)
                        .map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer" onClick={() => handleActivityClick(activity)}>
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{activity.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{activity.subtitle}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(activity.date)} at {activity.time}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        ))
                    )}
                    {/* Pagination Controls */}
                    {recentActivity.length > pageSize && (
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Page {page} of {Math.ceil(recentActivity.length / pageSize)}</span>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                          <Button variant="outline" size="sm" disabled={page * pageSize >= recentActivity.length} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                      </div>
                    )}
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Get Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Haven't found your perfect coach yet? Take our quick assessment to get personalized matches.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  className="bg-blue-600 hover:bg-blue-700 dark:text-white"
                >
                  Start Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <DashboardContent />
    </ProtectedRoute>
  )
}