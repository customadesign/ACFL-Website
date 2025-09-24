"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import CoachPageWrapper from '@/components/CoachPageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CalendarIntegration from '@/components/coach/CalendarIntegration'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Calendar, Settings, List, Clock } from 'lucide-react'

// Dynamic imports to avoid SSR issues
const AppointmentsList = dynamic(() => import('@/components/coach/calendar/AppointmentsList'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
})

const TodaysAgenda = dynamic(() => import('@/components/coach/calendar/TodaysAgenda'), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  )
})

const CalendarView = dynamic(() => import('@/components/coach/calendar/CalendarView'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default function UnifiedCalendarPage() {
  const [coachId, setCoachId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get coach ID from localStorage or token
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCoachId(payload.userId)
      } catch (error) {
        console.error('Error parsing token:', error)
        router.push('/auth/login')
      }
    } else {
      router.push('/auth/login')
    }
  }, [router])

  useEffect(() => {
    // Handle URL parameters for setting active tab
    const activeTabParam = searchParams.get('activeTab')
    if (activeTabParam && ['overview', 'appointments', 'integration', 'calendar'].includes(activeTabParam)) {
      setActiveTab(activeTabParam)
    }

    // Handle OAuth callback success/error messages
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider')

    if (success === 'connected' && provider) {
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar connected successfully!`)
      // Clean up URL parameters and switch to integration tab
      router.replace('/coaches/calendar')
      setActiveTab('integration')
    } else if (error) {
      let errorMessage = 'Calendar connection failed'
      switch (error) {
        case 'oauth_error':
          errorMessage = 'Authorization was denied or failed'
          break
        case 'missing_parameters':
          errorMessage = 'Invalid callback parameters'
          break
        case 'invalid_state':
          errorMessage = 'Security validation failed'
          break
        case 'invalid_provider':
          errorMessage = 'Unsupported calendar provider'
          break
        case 'save_failed':
          errorMessage = 'Failed to save calendar connection'
          break
        case 'calendar_access_failed':
          errorMessage = 'Unable to access your calendar'
          break
        case 'callback_failed':
          errorMessage = 'Calendar connection callback failed'
          break
      }
      toast.error(errorMessage)
      router.replace('/coaches/calendar')
      setActiveTab('integration')
    }
  }, [searchParams, router])

  if (!coachId) {
    return (
      <CoachPageWrapper>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading calendar...</p>
          </div>
        </div>
      </CoachPageWrapper>
    )
  }

  return (
    <CoachPageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar & Appointments</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your appointments and calendar integrations in one place.
            </p>
          </div>
        </div>

        {/* Unified Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Today</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">All Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Integration</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar View</span>
            </TabsTrigger>
          </TabsList>

          {/* Today's Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>
                    Your appointments for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TodaysAgenda coachId={coachId} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-green-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common calendar tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setActiveTab('appointments')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <List className="h-4 w-4 mr-2" />
                    View All Appointments
                  </Button>
                  <Button
                    onClick={() => setActiveTab('integration')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Calendar Settings
                  </Button>
                  <Button
                    onClick={() => setActiveTab('calendar')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar View
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Integration Status
                  </CardTitle>
                  <CardDescription>
                    External calendar connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarIntegration coachId={coachId} compact={true} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* All Appointments Tab */}
          <TabsContent value="appointments" className="mt-6">
            <AppointmentsList coachId={coachId} />
          </TabsContent>

          {/* Calendar Integration Tab */}
          <TabsContent value="integration" className="mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">External Calendar Integration</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Connect your Google Calendar to automatically sync your coaching appointments.
                </p>
              </div>

              <CalendarIntegration coachId={coachId} />
            </div>
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar" className="mt-6">
            <CalendarView coachId={coachId} />
          </TabsContent>
        </Tabs>
      </div>
    </CoachPageWrapper>
  )
}