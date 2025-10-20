'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/api-client'
import { getApiUrl } from '@/lib/api'
import { ChevronLeft, ChevronRight, Clock, User, Video, Calendar as CalendarIcon, ArrowRight } from 'lucide-react'

interface Appointment {
  id: string
  client_id: string
  starts_at: string
  ends_at: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  meeting_id?: string
  clients?: {
    first_name: string
    last_name: string
    email?: string
  }
}

interface CalendarViewProps {
  coachId: string
}

export default function CalendarView({ coachId }: CalendarViewProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])

  const API_URL = getApiUrl()

  useEffect(() => {
    loadAppointments()
  }, [currentDate])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const response = await apiGet(`${API_URL}/api/coach/appointments?filter=all`)

      if (response.data.success) {
        setAppointments(response.data.data)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMonthData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = date.toDateString()
    return appointments.filter(apt => new Date(apt.starts_at).toDateString() === dateStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setTodayAppointments(getAppointmentsForDate(date))
  }

  const monthData = getMonthData()
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
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
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <CalendarIcon className="h-5 w-5" />
                  <span className="truncate">{monthName}</span>
                </CardTitle>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="p-2 min-w-[36px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Today</span>
                    <span className="sm:hidden text-xs">•</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="p-2 min-w-[36px]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {monthData.map((date, index) => {
                  const dayAppointments = getAppointmentsForDate(date)
                  const isCurrentMonthDate = isCurrentMonth(date)
                  const isTodayDate = isToday(date)
                  const isSelected = selectedDate?.toDateString() === date.toDateString()

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                        min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded border sm:rounded-lg transition-all hover:shadow-md text-left relative
                        ${isTodayDate ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' : ''}
                        ${isSelected ? 'ring-1 sm:ring-2 ring-blue-500' : ''}
                        ${isCurrentMonthDate ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400'}
                        ${dayAppointments.length > 0 ? 'hover:bg-gray-50 dark:hover:bg-gray-750' : ''}
                      `}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {date.getDate()}
                      </div>

                      <div className="space-y-0.5 sm:space-y-1">
                        {dayAppointments.slice(0, 2).map(appointment => (
                          <div
                            key={appointment.id}
                            className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded border ${getStatusColor(appointment.status)}`}
                          >
                            <div className="font-medium truncate">
                              {appointment.clients ? (
                                <span className="hidden sm:inline">
                                  {`${appointment.clients.first_name} ${appointment.clients.last_name}`}
                                </span>
                              ) : (
                                <span className="hidden sm:inline">Client</span>
                              )}
                              <span className="sm:hidden">•</span>
                            </div>
                            <div className="truncate">
                              <span className="hidden sm:inline">
                                {new Date(appointment.starts_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="sm:hidden text-[8px]">
                                {new Date(appointment.starts_at).toLocaleTimeString([], {
                                  hour: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">
                            <span className="hidden sm:inline">+{dayAppointments.length - 2} more</span>
                            <span className="sm:hidden">+{dayAppointments.length - 2}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Details Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-lg truncate">
                  {selectedDate ? selectedDate.toLocaleDateString() : 'Select a Date'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                todayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {todayAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => router.push('/coaches/calendar?activeTab=appointments')}
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm truncate">
                              {appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${getStatusColor(appointment.status)} text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 flex-shrink-0`}>
                              {appointment.status}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>

                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {new Date(appointment.starts_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(appointment.ends_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {appointment.meeting_id && (
                            <div className="flex items-center gap-2">
                              <Video className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">Virtual Session</span>
                            </div>
                          )}

                          {appointment.notes && (
                            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="line-clamp-3">{appointment.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No appointments scheduled for this date.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Click on a date to view appointments.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                  <span className="text-sm">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
                  <span className="text-sm">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                  <span className="text-sm">Cancelled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}