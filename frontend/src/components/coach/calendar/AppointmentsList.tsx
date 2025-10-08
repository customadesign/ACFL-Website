'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AppointmentCardSkeleton from '@/components/AppointmentCardSkeleton'
import SessionNotesModal from '@/components/SessionNotesModal'
import ClientSessionHistory from '@/components/ClientSessionHistory'
import SessionProgressTracker from '@/components/progress/SessionProgressTracker'
import RescheduleModal from '@/components/RescheduleModal'
import { apiGet, apiPut } from '@/lib/api-client'
import { getApiUrl } from '@/lib/api'
import {
  Video, ArrowUpDown, ArrowUp, ArrowDown, MessageCircle, Calendar,
  Clock, FileText, History, Users, Search, Filter, Video as VideoIcon
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import dynamic from 'next/dynamic'

// Dynamic imports for meeting components
const MeetingContainer = dynamic(() => import('@/components/MeetingContainer'), {
  ssr: false,
  loading: () => <div>Loading meeting...</div>
})

interface Appointment {
  id: string
  client_id: string
  coach_id: string
  starts_at: string
  ends_at: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  meeting_id?: string
  created_at: string
  clients?: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    users?: {
      email: string
    }
  }
}

interface AppointmentsListProps {
  coachId: string
}

export default function AppointmentsList({ coachId }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending'>('upcoming')
  const [sortBy, setSortBy] = useState<'dateAdded' | 'name'>('dateAdded')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'thisWeek' | 'thisMonth' | 'last3Months'>('all')
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<Appointment | null>(null)
  const [showSessionHistory, setShowSessionHistory] = useState(false)
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<{ id: string; name: string } | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null)
  const [showMeeting, setShowMeeting] = useState(false)
  const [meetingAppointment, setMeetingAppointment] = useState<Appointment | null>(null)
  const [nowMs, setNowMs] = useState<number>(Date.now())
  const socketRef = useRef<Socket | null>(null)

  const API_URL = getApiUrl()

  // Apply filters function
  const applyFilters = () => {
    let filtered = [...appointments]

    // Apply main filter (status based)
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(apt => apt.status === 'scheduled')
        break
      case 'past':
        filtered = filtered.filter(apt => apt.status === 'cancelled' || apt.status === 'completed')
        break
      case 'pending':
        filtered = filtered.filter(apt => apt.status === 'confirmed')
        break
      case 'all':
      default:
        break
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(apt => {
        const clientName = apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}`.toLowerCase() : ''
        const notes = apt.notes?.toLowerCase() || ''
        const status = apt.status.toLowerCase()
        const date = new Date(apt.starts_at).toLocaleDateString()

        return clientName.includes(query) ||
               notes.includes(query) ||
               status.includes(query) ||
               date.includes(query)
      })
    }

    // Apply date filter
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case 'thisWeek':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const sevenDaysFromNow = new Date(today)
        sevenDaysFromNow.setDate(today.getDate() + 7)
        sevenDaysFromNow.setHours(23, 59, 59, 999)

        filtered = filtered.filter(apt => {
          const appointmentDate = new Date(apt.starts_at)
          return appointmentDate >= sevenDaysAgo && appointmentDate <= sevenDaysFromNow
        })
        break
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        filtered = filtered.filter(apt => new Date(apt.starts_at) >= startOfMonth)
        break
      case 'last3Months':
        const last3Months = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
        filtered = filtered.filter(apt => new Date(apt.starts_at) >= last3Months)
        break
      case 'all':
      default:
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === 'dateAdded') {
        comparison = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      } else if (sortBy === 'name') {
        const nameA = a.clients ? `${a.clients.first_name} ${a.clients.last_name}` : ''
        const nameB = b.clients ? `${b.clients.first_name} ${b.clients.last_name}` : ''
        comparison = nameA.localeCompare(nameB)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredAppointments(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [appointments, filter, searchQuery, dateFilter, sortBy, sortOrder])

  // Load appointments
  useEffect(() => {
    loadAppointments()
  }, [])

  // Tick every second for meeting availability
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // WebSocket connection
  useEffect(() => {
    if (!coachId) return

    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('appointment:new', () => loadAppointments(true))
    socket.on('appointment:booked', () => loadAppointments(true))
    socket.on('appointment:status_updated', (data) => {
      setAppointments(prev => prev.map(apt =>
        apt.id === data.sessionId
          ? { ...apt, status: data.newStatus }
          : apt
      ))
    })
    socket.on('appointment:rescheduled', (data) => {
      setAppointments(prev => prev.map(apt =>
        apt.id === data.sessionId
          ? { ...apt, starts_at: data.newScheduledAt, status: data.status }
          : apt
      ))
    })
    socket.on('appointment:cancelled', (data) => {
      setAppointments(prev => prev.map(apt =>
        apt.id === data.sessionId
          ? { ...apt, status: 'cancelled' }
          : apt
      ))
    })

    return () => {
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [coachId, API_URL])

  const loadAppointments = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) setLoading(true)

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

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await apiPut(`${API_URL}/api/coach/appointments/${appointmentId}`,
        { status: newStatus }
      )

      if (response.data.success) {
        await loadAppointments(true)
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      setError('Failed to update appointment status')
    }
  }

  const getStatusDisplay = (appointment: Appointment) => {
    switch (appointment.status) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
        }
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
        }
      default:
        return {
          label: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
          color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
        }
    }
  }

  const toggleSort = (newSortBy: 'dateAdded' | 'name') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDateFilter('all')
  }

  const isJoinAvailable = (apt: Appointment) => {
    const start = new Date(apt.starts_at).getTime()
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (start + 60 * 60 * 1000)
    return nowMs >= start && nowMs <= end
  }

  const isCompleteAvailable = (apt: Appointment) => {
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (new Date(apt.starts_at).getTime() + 60 * 60 * 1000)
    return nowMs >= end
  }

  const handleJoinMeeting = (appointment: Appointment) => {
    setMeetingAppointment(appointment)
    setShowMeeting(true)
  }

  if (loading) {
    return <AppointmentCardSkeleton count={5} />
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
          {[
            { key: 'upcoming', label: 'Upcoming (Scheduled)' },
            { key: 'past', label: 'Past (Canceled/Completed)' },
            { key: 'pending', label: 'Pending (Confirmed)' },
            { key: 'all', label: 'All' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === 'upcoming' ? 'Upcoming' : tab.key === 'past' ? 'Past' : tab.key === 'pending' ? 'Pending' : 'All'}</span>
              <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 sm:py-1 px-1 sm:px-2 rounded-full">
                {appointments.filter(apt => {
                  switch (tab.key) {
                    case 'upcoming':
                      return apt.status === 'scheduled'
                    case 'past':
                      return apt.status === 'cancelled' || apt.status === 'completed'
                    case 'pending':
                      return apt.status === 'confirmed'
                    case 'all':
                    default:
                      return true
                  }
                }).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by client name, notes, status, or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="last3Months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear filters and results count */}
        {(searchQuery || dateFilter !== 'all') && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant={sortBy === 'dateAdded' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleSort('dateAdded')}
            className={`flex items-center gap-1 text-xs sm:text-sm ${sortBy === 'dateAdded' ? '' : 'dark:text-white'}`}
          >
            Date Added
            {sortBy === 'dateAdded' && (
              sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
            )}
            {sortBy !== 'dateAdded' && <ArrowUpDown className="w-3 h-3" />}
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleSort('name')}
            className={`flex items-center gap-1 text-xs sm:text-sm ${sortBy === 'name' ? '' : 'dark:text-white'}`}
          >
            Client Name
            {sortBy === 'name' && (
              sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
            )}
            {sortBy !== 'name' && <ArrowUpDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {(searchQuery || dateFilter !== 'all') ? 'No appointments match your current filters' : `No ${filter} appointments found`}
              </p>
              {(searchQuery || dateFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          {appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {appointment.clients?.email || appointment.clients?.users?.email}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => {
                              setSelectedClientForHistory({
                                id: appointment.client_id,
                                name: `${appointment.clients?.first_name} ${appointment.clients?.last_name}`
                              })
                              setShowSessionHistory(true)
                            }}
                            className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            <History className="w-3 h-3 inline mr-1" />
                            View session history
                          </button>
                          <span className="text-gray-400">|</span>
                          <Link
                            href={`/coaches/client/${appointment.client_id}`}
                            className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            View client profile →
                          </Link>
                        </div>
                      </div>
                      <span className={`self-start px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusDisplay(appointment).color}`}>
                        {getStatusDisplay(appointment).label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {new Date(appointment.starts_at).toLocaleDateString()} at{' '}
                          {new Date(appointment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / (1000 * 60))} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Session Type</p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">Virtual Session</p>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 sm:mt-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Notes</p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 mt-1">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Action buttons based on status */}
                    {appointment.status === 'scheduled' && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          size="sm"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          variant="outline"
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAppointmentForNotes(appointment)
                            setShowNotesModal(true)
                          }}
                          variant="outline"
                          className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
                          size="sm"
                        >
                          <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Notes
                        </Button>
                      </div>
                    )}

                    {appointment.status === 'confirmed' && (
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {appointment.meeting_id && (
                            <Button
                              onClick={() => handleJoinMeeting(appointment)}
                              className="bg-green-600 hover:bg-green-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
                              disabled={!isJoinAvailable(appointment)}
                              size="sm"
                            >
                              <VideoIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Join Session
                            </Button>
                          )}
                          <Button
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                            className="bg-blue-600 hover:bg-blue-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
                            disabled={!isCompleteAvailable(appointment)}
                            size="sm"
                          >
                            Mark Complete
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedAppointmentForReschedule(appointment)
                              setShowRescheduleModal(true)
                            }}
                            variant="outline"
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Reschedule
                          </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            variant="outline"
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedAppointmentForNotes(appointment)
                              setShowNotesModal(true)
                            }}
                            variant="outline"
                            className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Notes
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Message button for all appointments */}
                    {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        {appointment.status === 'completed' && (
                          <Button
                            onClick={() => {
                              setSelectedAppointmentForNotes(appointment)
                              setShowNotesModal(true)
                            }}
                            variant="outline"
                            className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            View/Edit Notes
                          </Button>
                        )}
                        <Link
                          href={`/coaches/messages?conversation_with=${appointment.client_id}&partner_name=${encodeURIComponent(appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client')}`}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            variant="outline"
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <MessageCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Message Client
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {showNotesModal && selectedAppointmentForNotes && (
        <SessionNotesModal
          appointmentId={selectedAppointmentForNotes.id}
          clientName={`${selectedAppointmentForNotes.clients?.first_name} ${selectedAppointmentForNotes.clients?.last_name}`}
          sessionDate={selectedAppointmentForNotes.starts_at}
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false)
            setSelectedAppointmentForNotes(null)
          }}
          readonly={selectedAppointmentForNotes.status !== 'completed'}
        />
      )}

      {showSessionHistory && selectedClientForHistory && (
        <ClientSessionHistory
          clientId={selectedClientForHistory.id}
          clientName={selectedClientForHistory.name}
          isOpen={showSessionHistory}
          onClose={() => {
            setShowSessionHistory(false)
            setSelectedClientForHistory(null)
          }}
        />
      )}

      {showRescheduleModal && selectedAppointmentForReschedule && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          appointment={selectedAppointmentForReschedule}
          onSuccess={() => {
            setShowRescheduleModal(false)
            setSelectedAppointmentForReschedule(null)
            loadAppointments()
          }}
        />
      )}

      {showMeeting && meetingAppointment && (
        <MeetingContainer
          appointmentId={meetingAppointment.id}
          appointmentData={{
            client_name: `${meetingAppointment.clients?.first_name} ${meetingAppointment.clients?.last_name}`,
            starts_at: meetingAppointment.starts_at,
            ends_at: meetingAppointment.ends_at
          }}
          isHost={true}
          onClose={() => {
            setShowMeeting(false)
            setMeetingAppointment(null)
            loadAppointments(true)
          }}
        />
      )}
    </div>
  )
}