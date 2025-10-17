'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProtectedRoute from '@/components/ProtectedRoute';
import MeetingContainer from '@/components/MeetingContainer';
import MeetingBlocker from '@/components/MeetingBlocker';
import AppointmentCardSkeleton from '@/components/AppointmentCardSkeleton';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useMeeting } from '@/contexts/MeetingContext';
import axios from 'axios';
import { apiGet, apiPut, API_URL as API_BASE_URL } from '@/lib/api-client';
import { Video, ArrowUpDown, ArrowUp, ArrowDown, MessageCircle, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Appointment {
  id: string;
  coach_id: string;
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  meeting_id?: string;  // VideoSDK meeting ID
  created_at: string;
  coaches?: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    users?: {
      email: string;
    };
  };
}

function AppointmentsContent() {
  const { user } = useAuth();
  const { isInMeeting, currentMeetingId, setMeetingState, canJoinMeeting } = useMeeting();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'dateAdded' | 'name'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingAppointment, setMeetingAppointment] = useState<Appointment | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Additional filter states for enhanced filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'thisWeek' | 'thisMonth' | 'last3Months'>('all');

  const API_URL = getApiUrl();

  useEffect(() => {
    loadAppointments();
  }, []); // Remove filter dependency since we always get all appointments

  // Apply filters whenever appointments or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [appointments, filter, searchQuery, dateFilter, sortBy, sortOrder]);

  // Tick every second to enable/disable Join and update countdown labels
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket connection for real-time appointment updates
  useEffect(() => {
    if (!user?.id || !localStorage.getItem('token')) {
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Listen for appointment events
    socket.on('appointment:new', (data) => {
      console.log('New appointment:', data);
      // Refresh appointments list
      loadAppointments(true);
    });

    socket.on('appointment:booked', (data) => {
      console.log('Appointment booked:', data);
      // Refresh appointments list
      loadAppointments(true);
    });

    socket.on('appointment:status_updated', (data) => {
      console.log('Appointment status updated:', data);
      // Update specific appointment in the list
      setAppointments(prev => prev.map(apt => 
        apt.id === data.sessionId 
          ? { ...apt, status: data.newStatus }
          : apt
      ));
    });

    socket.on('appointment:rescheduled', (data) => {
      console.log('Appointment rescheduled:', data);
      // Update appointment time
      setAppointments(prev => prev.map(apt => 
        apt.id === data.sessionId 
          ? { ...apt, starts_at: data.newScheduledAt, status: data.status }
          : apt
      ));
    });

    socket.on('appointment:cancelled', (data) => {
      console.log('Appointment cancelled:', data);
      // Update appointment status
      setAppointments(prev => prev.map(apt => 
        apt.id === data.sessionId 
          ? { ...apt, status: 'cancelled' }
          : apt
      ));
    });

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [user?.id, API_URL]);

  // Allow joining anytime - no time restrictions
  const isJoinAvailable = (apt: Appointment) => {
    // Always allow joining - session will end based on scheduled end time
    return true;
  };

  const getCountdownLabel = (apt: Appointment) => {
    const start = new Date(apt.starts_at).getTime();
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (start + 60 * 60 * 1000);
    const toStart = start - nowMs;
    const toEnd = end - nowMs;

    // Session has ended
    if (toEnd <= 0) return 'Session ended';

    // Session is live now
    if (toStart <= 0 && toEnd > 0) return 'Live now';

    // Session hasn't started yet - show countdown
    const h = Math.floor(toStart / 3600000);
    const m = Math.floor((toStart % 3600000) / 60000);
    const s = Math.floor((toStart % 60000) / 1000);
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    return `Scheduled in ${hh}:${mm}:${ss}`;
  };

  const handleJoinMeeting = (appointment: Appointment) => {
    const meetingId = appointment.meeting_id;
    if (!meetingId) return;
    
    // Simple check - if already in a different meeting, don't allow
    if (isInMeeting && currentMeetingId !== meetingId) {
      console.log('❌ Already in meeting:', currentMeetingId, 'cannot join:', meetingId);
      return;
    }
    
    console.log('✅ Opening meeting container for:', meetingId);
    setMeetingAppointment(appointment);
    setShowMeeting(true);
  };

  const handleLeaveMeeting = () => {
    setShowMeeting(false);
    setMeetingAppointment(null);
    // Don't manually set meeting state here - let MeetingContainer handle it
  };

  const loadAppointments = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      // Always get all appointments for proper tab counting
      const response = await apiGet(`${API_URL}/api/client/appointments?filter=all`);

      if (response.data.success) {
        setAppointments(response.data.data);
        if (initialLoad) {
          setInitialLoad(false);
        }
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    // Apply main filter (status based)
    const now = new Date().toISOString();
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(apt => apt.status === 'scheduled');
        break;
      case 'past':
        filtered = filtered.filter(apt => apt.status === 'cancelled' || apt.status === 'completed');
        break;
      case 'pending':
        filtered = filtered.filter(apt => apt.status === 'confirmed');
        break;
      case 'all':
      default:
        // No status filtering
        break;
    }

    // Apply search filter (search in coach name and notes)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => {
        const coachName = apt.coaches ? `${apt.coaches.first_name} ${apt.coaches.last_name}`.toLowerCase() : '';
        const notes = apt.notes?.toLowerCase() || '';
        const status = apt.status.toLowerCase();
        const date = new Date(apt.starts_at).toLocaleDateString();

        return coachName.includes(query) ||
               notes.includes(query) ||
               status.includes(query) ||
               date.includes(query);
      });
    }

    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'thisWeek':
        // This week (7 days from today - past and future)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999);

        filtered = filtered.filter(apt => {
          const appointmentDate = new Date(apt.starts_at);
          return appointmentDate >= sevenDaysAgo && appointmentDate <= sevenDaysFromNow;
        });
        break;
      case 'thisMonth':
        // This month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        filtered = filtered.filter(apt => new Date(apt.starts_at) >= startOfMonth);
        break;
      case 'last3Months':
        // Last 3 months
        const last3Months = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        filtered = filtered.filter(apt => new Date(apt.starts_at) >= last3Months);
        break;
      case 'all':
      default:
        // No date filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'dateAdded') {
        comparison = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      } else if (sortBy === 'name') {
        const nameA = a.coaches ? `${a.coaches.first_name} ${a.coaches.last_name}` : '';
        const nameB = b.coaches ? `${b.coaches.first_name} ${b.coaches.last_name}` : '';
        comparison = nameA.localeCompare(nameB);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredAppointments(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    // Keep the main filter and sorting as they are
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await apiPut(`${API_URL}/api/client/appointments/${appointmentId}`, 
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Reload appointments to get updated data
        await loadAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    }
  };

  // Status display directly reflects the database status
  // Status Mapping:
  // - 'scheduled' → "Scheduled" (blue)
  // - 'confirmed' → "Confirmed" (yellow)
  // - 'cancelled' → "Cancelled" (red)
  // - 'completed' → "Completed" (green)
  // 
  // Tab Filtering (based on your requirements):
  // - Upcoming: Shows appointments as "Scheduled" 
  // - Past: Shows "Cancelled" or "Completed"
  // - Pending: Shows "Confirmed" 
  // - All: Shows actual database status for all appointments
  const getStatusDisplay = (appointment: Appointment) => {
    // Show the actual database status with proper formatting and colors
    switch (appointment.status) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
        };
      
      case 'confirmed':
        return {
          label: 'Confirmed', 
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
        };
      
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        };
      
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
        };
      
      default:
        return {
          label: (appointment.status as string).charAt(0).toUpperCase() + (appointment.status as string).slice(1),
          color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
        };
    }
  };

  // Legacy function for backward compatibility
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortAppointments = (appointments: Appointment[]) => {
    return appointments.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'dateAdded') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'name') {
        const nameA = a.coaches ? `${a.coaches.first_name} ${a.coaches.last_name}`.toLowerCase() : '';
        const nameB = b.coaches ? `${b.coaches.first_name} ${b.coaches.last_name}`.toLowerCase() : '';
        comparison = nameA.localeCompare(nameB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSort = (newSortBy: 'dateAdded' | 'name') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Remove the loading screen - we'll show skeleton in the main render

  return (
    // No MeetingBlocker on appointments page - users should always be able to access their appointments
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Appointments</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your coaching sessions and appointments</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
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
                    const appointmentDate = new Date(apt.starts_at);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    switch (tab.key) {
                      case 'upcoming':
                        return apt.status === 'scheduled';
                      case 'past':
                        return apt.status === 'cancelled' || apt.status === 'completed';
                      case 'pending':
                        return apt.status === 'confirmed';
                      case 'all':
                      default:
                        return true;
                    }
                  }).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Enhanced Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by coach name, notes, status, or date..."
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

      {/* Sort Controls - Show for all tabs */}
      <div className="mb-6">
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
              Coach Name
              {sortBy === 'name' && (
                sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              )}
              {sortBy !== 'name' && <ArrowUpDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {initialLoad ? (
          <AppointmentCardSkeleton count={5} />
        ) : (() => {
          // Use the filtered appointments from our enhanced filtering
          return filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words leading-tight">
                          Coach {appointment.coaches ? `${appointment.coaches.first_name} ${appointment.coaches.last_name}` : 'TBD'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">{appointment.coaches?.email || appointment.coaches?.users?.email}</p>
                      </div>
                      <span className={`self-start flex-shrink-0 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusDisplay(appointment).color}`}>
                        {getStatusDisplay(appointment).label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
                          {new Date(appointment.starts_at).toLocaleDateString()} at {' '}
                          {new Date(appointment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">{Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / (1000 * 60))} minutes</p>
                      </div>
                      <div className="min-w-0">
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

                    {appointment.status === 'confirmed' && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        {appointment.meeting_id && (
                          <div className="flex flex-col gap-1">
                            <Button
                              onClick={() => handleJoinMeeting(appointment)}
                              className={`${isInMeeting && currentMeetingId === appointment.meeting_id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto`}
                              disabled={!isJoinAvailable(appointment) || (isInMeeting && currentMeetingId !== appointment.meeting_id)}
                              size="sm"
                            >
                              <Video className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                              {isInMeeting && currentMeetingId === appointment.meeting_id ? 'Rejoin Session' : 'Join Session'}
                            </Button>
                            {isInMeeting && currentMeetingId !== appointment.meeting_id && (
                              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-600 dark:text-amber-400">🔒</span>
                                  <div className="text-[11px] text-amber-700 dark:text-amber-300">
                                    <div className="font-medium">Cannot join - already in meeting</div>
                                    <div>Active: {currentMeetingId?.substring(0, 12)}...</div>
                                    <div className="text-amber-600 dark:text-amber-400">End current meeting to join this one</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 self-center">{getCountdownLabel(appointment)}</span>
                        <Link href={`/clients/messages?conversation_with=${appointment.coach_id}&partner_name=${encodeURIComponent(appointment.coaches ? `${appointment.coaches.first_name} ${appointment.coaches.last_name}` : 'Coach')}`} className="w-full sm:w-auto">
                          <Button
                            variant="outline"
                            className="text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                            size="sm"
                          >
                            <MessageCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Message
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Message button for appointments without confirmed status */}
                    {appointment.status !== 'confirmed' && (
                      <div className="mt-4">
                        <Link href={`/clients/messages?conversation_with=${appointment.coach_id}&partner_name=${encodeURIComponent(appointment.coaches ? `${appointment.coaches.first_name} ${appointment.coaches.last_name}` : 'Coach')}`} className="block">
                          <Button
                            variant="outline"
                            className="text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                            size="sm"
                          >
                            <MessageCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Message Coach
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          );
        })()}
      </div>
      
      {/* Meeting Container with PreCall and VideoMeeting */}
      {showMeeting && meetingAppointment && (
        <MeetingContainer
          appointmentId={meetingAppointment.id}
          appointmentData={{
            coach_name: `${meetingAppointment.coaches?.first_name} ${meetingAppointment.coaches?.last_name}`,
            starts_at: meetingAppointment.starts_at,
            ends_at: meetingAppointment.ends_at
          }}
          isHost={false}
          onClose={() => {
            handleLeaveMeeting();
            // Refresh appointments to update status
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppointmentsContent />
    </ProtectedRoute>
  );
}