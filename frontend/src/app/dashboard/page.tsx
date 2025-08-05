'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  Search, 
  Heart, 
  Calendar, 
  MessageCircle, 
  User,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react'

function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading recent activity
    setTimeout(() => {
      setRecentActivity([
        { type: 'appointment', title: 'Session with Richard Peng', date: '2024-01-15', time: '2:00 PM' },
        { type: 'message', title: 'Message from Alice Zhang', date: '2024-01-14', time: '10:30 AM' },
        { type: 'saved', title: 'Saved Nisha Desai', date: '2024-01-13', time: '3:45 PM' }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleLogout = () => {
    logout()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-600" />
      case 'saved':
        return <Heart className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                alt="ACT Coaching For Life Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900">ACT Coaching For Life</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Welcome, {user?.firstName || 'Client'}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm whitespace-nowrap">
              Dashboard
            </button>
            <Link href="/search-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Search Coaches
              </button>
            </Link>
            <Link href="/saved-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Saved Coaches
              </button>
            </Link>
            <Link href="/appointments">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Appointments
              </button>
            </Link>
            <Link href="/messages">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Messages
              </button>
            </Link>
            <Link href="/profile">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Profile
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'Client'}!
          </h2>
          <p className="text-gray-600">
            Ready to continue your coaching journey? Here's what you can do today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/search-coaches')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Find Coaches</h3>
                  <p className="text-sm text-gray-600">Search for new coaches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/saved-coaches')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Saved Coaches</h3>
                  <p className="text-sm text-gray-600">View your favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/appointments')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Appointments</h3>
                  <p className="text-sm text-gray-600">Manage your sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/messages')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Messages</h3>
                  <p className="text-sm text-gray-600">Chat with coaches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.date} at {activity.time}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
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
                <p className="text-gray-600 mb-4">
                  Haven't found your perfect coach yet? Take our quick assessment to get personalized matches.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  className="bg-blue-600 hover:bg-blue-700"
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

export default function Dashboard() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <DashboardContent />
    </ProtectedRoute>
  )
} 