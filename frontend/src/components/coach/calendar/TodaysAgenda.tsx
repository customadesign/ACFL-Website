'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/api-client'
import { getApiUrl } from '@/lib/api'
import { Clock, User, Video, Calendar } from 'lucide-react'

interface TodaysAppointment {
  id: string
  client_id: string
  starts_at: string
  ends_at: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  meeting_id?: string
  clients?: {
    first_name: string
    last_name: string
    email?: string
  }
}

interface TodaysAgendaProps {
  coachId: string
}

export default function TodaysAgenda({ coachId }: TodaysAgendaProps) {
  const [todaysAppointments, setTodaysAppointments] = useState<TodaysAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const API_URL = getApiUrl()

  useEffect(() => {
    loadTodaysAppointments()

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [coachId])

  const loadTodaysAppointments = async () => {
    try {
      setLoading(true)

      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      const response = await apiGet(`${API_URL}/api/coach/appointments?filter=all`)

      if (response.data.success) {
        // Filter for today's appointments only
        const todaysAppts = response.data.data.filter((apt: TodaysAppointment) => {
          const aptDate = new Date(apt.starts_at).toISOString().split('T')[0]
          return aptDate === todayStr && apt.status !== 'cancelled'
        })

        // Sort by start time
        todaysAppts.sort((a: TodaysAppointment, b: TodaysAppointment) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        )

        setTodaysAppointments(todaysAppts)
      }
    } catch (error) {
      console.error('Error loading today\'s appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const isAppointmentActive = (appointment: TodaysAppointment) => {
    const now = currentTime.getTime()
    const start = new Date(appointment.starts_at).getTime()
    const end = new Date(appointment.ends_at).getTime()

    return now >= start && now <= end
  }

  const isAppointmentUpcoming = (appointment: TodaysAppointment) => {
    const now = currentTime.getTime()
    const start = new Date(appointment.starts_at).getTime()
    const thirtyMinutesFromNow = now + (30 * 60 * 1000)

    return start > now && start <= thirtyMinutesFromNow
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTimeUntilAppointment = (appointment: TodaysAppointment) => {
    const now = currentTime.getTime()
    const start = new Date(appointment.starts_at).getTime()
    const diffMinutes = Math.round((start - now) / (1000 * 60))

    if (diffMinutes <= 0) {
      if (isAppointmentActive(appointment)) {
        return 'Live now'
      }
      return 'Started'
    }

    if (diffMinutes < 60) {
      return `In ${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`
    }

    const diffHours = Math.floor(diffMinutes / 60)
    const remainingMinutes = diffMinutes % 60

    if (remainingMinutes === 0) {
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    }

    return `In ${diffHours}h ${remainingMinutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
        </div>
      </div>
    )
  }

  if (todaysAppointments.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-300">No appointments today</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enjoy your free day!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todaysAppointments.map((appointment) => (
        <div
          key={appointment.id}
          className={`p-3 rounded-lg border transition-all ${
            isAppointmentActive(appointment)
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : isAppointmentUpcoming(appointment)
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3 w-3 text-gray-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mb-2">
                <Clock className="h-3 w-3" />
                <span>
                  {formatTime(appointment.starts_at)} - {formatTime(appointment.ends_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${getStatusColor(appointment.status)}`}
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Badge>

                {appointment.meeting_id && appointment.status === 'confirmed' && (
                  <Badge variant="outline" className="text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    Virtual
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right ml-2">
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {getTimeUntilAppointment(appointment)}
              </div>
              {isAppointmentActive(appointment) && (
                <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Active
                </div>
              )}
              {isAppointmentUpcoming(appointment) && (
                <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                  Soon
                </div>
              )}
            </div>
          </div>

          {(isAppointmentActive(appointment) || isAppointmentUpcoming(appointment)) && appointment.meeting_id && appointment.status === 'confirmed' && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  // This would typically open the meeting - for now just a placeholder
                  console.log('Join meeting:', appointment.meeting_id)
                }}
              >
                <Video className="h-3 w-3 mr-1" />
                {isAppointmentActive(appointment) ? 'Join Session' : 'Join Early'}
              </Button>
            </div>
          )}
        </div>
      ))}

      {todaysAppointments.length > 3 && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" className="text-xs">
            View All Appointments
          </Button>
        </div>
      )}
    </div>
  )
}