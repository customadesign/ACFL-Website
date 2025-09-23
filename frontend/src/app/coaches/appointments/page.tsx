'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CoachPageWrapper from '@/components/CoachPageWrapper';
// Dynamic imports for client-side only components
const MeetingContainer = dynamic(() => import('@/components/MeetingContainer'), {
  ssr: false,
  loading: () => <div>Loading meeting...</div>
});
const MockMeetingContainer = dynamic(() => import('@/components/MockMeetingContainer'), {
  ssr: false,
  loading: () => <div>Loading meeting...</div>
});
import MeetingBlocker from '@/components/MeetingBlocker';
import MeetingStatusDebug from '@/components/MeetingStatusDebug';
import TestInstructions from '@/components/TestInstructions';
import AppointmentCardSkeleton from '@/components/AppointmentCardSkeleton';
import SessionNotesModal from '@/components/SessionNotesModal';
import ClientSessionHistory from '@/components/ClientSessionHistory';
import SessionProgressTracker from '@/components/progress/SessionProgressTracker';
import ProgressGoalManager from '@/components/progress/ProgressGoalManager';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useMeeting } from '@/contexts/MeetingContext';
import axios from 'axios';
import { apiGet, apiPut, API_URL as API_BASE_URL } from '@/lib/api-client';
import { Video, ArrowUpDown, ArrowUp, ArrowDown, MessageCircle, Calendar, Clock, FileText, History, Users, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import RescheduleModal from '@/components/RescheduleModal';

interface Appointment {
  id: string;
  client_id: string;
  coach_id: string;
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  meeting_id?: string;  // VideoSDK meeting ID
  created_at: string;
  clients?: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    users?: {
      email: string;
    };
  };
}

function AppointmentsPageContent() {
  const { user } = useAuth();
  const { isInMeeting, currentMeetingId, setMeetingState, canJoinMeeting } = useMeeting();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending'>('upcoming');
  const [sortBy, setSortBy] = useState<'dateAdded' | 'name'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [showMeeting, setShowMeeting] = useState(false);
  const [showMockMeeting, setShowMockMeeting] = useState(false);
  const [meetingAppointment, setMeetingAppointment] = useState<Appointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<Appointment | null>(null);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<{ id: string; name: string } | null>(null);
  const [uniqueClients, setUniqueClients] = useState<Array<{ id: string; name: string; sessionCount: number }>>([]);
  const socketRef = useRef<Socket | null>(null);

  // Additional filter states for enhanced filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'thisWeek' | 'thisMonth' | 'last3Months'>('all');

  const API_URL = getApiUrl();

  // Define applyFilters function before useEffects
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

    // Apply search filter (search in client name and notes)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => {
        const clientName = apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}`.toLowerCase() : '';
        const notes = apt.notes?.toLowerCase() || '';
        const status = apt.status.toLowerCase();
        const date = new Date(apt.starts_at).toLocaleDateString();

        return clientName.includes(query) ||
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
        const nameA = a.clients ? `${a.clients.first_name} ${a.clients.last_name}` : '';
        const nameB = b.clients ? `${b.clients.first_name} ${b.clients.last_name}` : '';
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadAppointments();
    }
  }, [isClient]); // Only load appointments after client-side hydration

  // Calculate unique clients when appointments change
  useEffect(() => {
    const clientMap = new Map();
    appointments.forEach(apt => {
      if (apt.client_id && apt.clients) {
        if (!clientMap.has(apt.client_id)) {
          clientMap.set(apt.client_id, {
            id: apt.client_id,
            name: `${apt.clients.first_name} ${apt.clients.last_name}`,
            sessionCount: 0
          });
        }
        clientMap.get(apt.client_id).sessionCount++;
      }
    });
    setUniqueClients(Array.from(clientMap.values()));
  }, [appointments]);

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
    if (!isClient || !user?.id || !localStorage.getItem('token')) {
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
  }, [isClient, user?.id, API_URL]);

  if (!isClient) {
    return (
      <CoachPageWrapper title="Appointments" description="Manage your coaching sessions and appointments">
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
      </CoachPageWrapper>
    );
  }

  const isJoinAvailable = (apt: Appointment) => {
    const start = new Date(apt.starts_at).getTime();
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (start + 60 * 60 * 1000);
    return nowMs >= start && nowMs <= end;
  };

  const isCompleteAvailable = (apt: Appointment) => {
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (new Date(apt.starts_at).getTime() + 60 * 60 * 1000);
    return nowMs >= end;
  };

  const getCountdownLabel = (apt: Appointment) => {
    const start = new Date(apt.starts_at).getTime();
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (start + 60 * 60 * 1000);
    const toStart = start - nowMs;
    const toEnd = end - nowMs;
    
    // For future appointments
    if (toStart > 0) {
      const days = Math.floor(toStart / 86400000);
      if (days > 0) {
        return `In ${days} day${days > 1 ? 's' : ''}`;
      }
      const h = Math.floor(toStart / 3600000);
      const m = Math.floor((toStart % 3600000) / 60000);
      const s = Math.floor((toStart % 60000) / 1000);
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      const ss = s.toString().padStart(2, '0');
      return `Starts in ${hh}:${mm}:${ss}`;
    }
    
    // For ongoing appointments
    if (toEnd > 0) return 'Live now';
    
    // For past appointments
    return 'Completed';
  };

  const handleJoinMeeting = (appointment: Appointment) => {
    console.log('🔍 DEBUG: handleJoinMeeting called with appointment:', {
      id: appointment.id,
      meeting_id: appointment.meeting_id,
      coach_id: appointment.coach_id,
      client_id: appointment.client_id,
      status: appointment.status,
      starts_at: appointment.starts_at,
      ends_at: appointment.ends_at
    });

    const meetingId = appointment.meeting_id;
    if (!meetingId) return;
    
    // Simple check - if already in a different meeting, don't allow
    if (isInMeeting && currentMeetingId !== meetingId) {
      console.log('❌ Already in meeting:', currentMeetingId, 'cannot join:', meetingId);
      return;
    }
    
    console.log('✅ Opening meeting container for:', meetingId);
    console.log('🔍 DEBUG: Setting meetingAppointment to:', appointment.id);
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
      const response = await apiGet(`${API_URL}/api/coach/appointments?filter=all`);

      if (response.data.success) {
        console.log('🔍 DEBUG: Loaded appointments:', response.data.data.map((apt: Appointment) => ({
          id: apt.id,
          meeting_id: apt.meeting_id,
          status: apt.status,
          starts_at: apt.starts_at,
          coach_id: apt.coach_id,
          client_id: apt.client_id
        })));
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointmentForReschedule(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSuccess = () => {
    setShowRescheduleModal(false);
    setSelectedAppointmentForReschedule(null);
    loadAppointments(); // Refresh appointments list
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await apiPut(`${API_URL}/api/coach/appointments/${appointmentId}`, 
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Reload appointments to get updated data
        await loadAppointments(true);
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
        const nameA = a.clients ? `${a.clients.first_name} ${a.clients.last_name}`.toLowerCase() : '';
        const nameB = b.clients ? `${b.clients.first_name} ${b.clients.last_name}`.toLowerCase() : '';
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
    <CoachPageWrapper title="Appointments" description="Manage your coaching sessions and appointments">
      {/* No MeetingBlocker on appointments page - users should always be able to access their appointments */}

      {/* Test Button - Remove in production */}
      <div className="mb-6 flex justify-end">
        <Button
          onClick={async () => {
            try {
              // Generate proper UUIDs for test data
              const generateUUID = () => {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0;
                  const v = c == 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
              };

              // Create a test appointment that starts now
              const now = new Date();
              const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
              
              const testAppointment: Appointment = {
                id: generateUUID(),
                client_id: generateUUID(),
                coach_id: user?.id || generateUUID(),
                starts_at: now.toISOString(),
                ends_at: endTime.toISOString(),
                status: 'confirmed',
                notes: 'Test appointment for meeting restrictions',
                meeting_id: `meeting_${Date.now()}_test`,
                created_at: now.toISOString(),
                clients: {
                  first_name: 'Test',
                  last_name: 'Client',
                  email: 'test@client.com',
                  users: {
                    email: 'test@client.com'
                  }
                }
              };
              
              // Add to appointments list (frontend only - no backend call)
              setAppointments(prev => [testAppointment, ...prev]);
              
              console.log('✅ Test appointment created (frontend only):', testAppointment.id);
              
              // Optionally, immediately open the mock meeting
              if (confirm('Open test meeting now? (Note: This will test frontend restrictions only)')) {
                setMeetingAppointment(testAppointment);
                setShowMockMeeting(true);
              }
            } catch (error) {
              console.error('Error creating test appointment:', error);
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Video className="mr-2 h-4 w-4" />
          Book Test Meeting (Dev Only)
        </Button>
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
                Client Name
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
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{appointment.clients?.email || appointment.clients?.users?.email}</p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => {
                              setSelectedClientForHistory({
                                id: appointment.client_id,
                                name: `${appointment.clients?.first_name} ${appointment.clients?.last_name}`
                              });
                              setShowSessionHistory(true);
                            }}
                            className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            <History className="w-3 h-3 inline mr-1" />
                            View session history
                          </button>
                          <span className="text-gray-400">|</span>
                          <Link href={`/coaches/client/${appointment.client_id}`} className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
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
                          {new Date(appointment.starts_at).toLocaleDateString()} at {' '}
                          {new Date(appointment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">{Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / (1000 * 60))} minutes</p>
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
                            setSelectedAppointmentForNotes(appointment);
                            setShowNotesModal(true);
                          }}
                          variant="outline"
                          className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
                          size="sm"
                        >
                          <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Notes
                        </Button>
                        <div className="w-full sm:w-auto">
                          <SessionProgressTracker
                            sessionId={appointment.id}
                            clientId={appointment.client_id}
                            clientName={appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                            userRole="coach"
                          />
                        </div>
                        <Link href={`/coaches/messages?conversation_with=${appointment.client_id}&partner_name=${encodeURIComponent(appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client')}`} className="w-full sm:w-auto">
                          <Button
                            variant="outline"
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <MessageCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Message
                          </Button>
                        </Link>
                      </div>
                    )}

                    {appointment.status === 'confirmed' && (
                      <div className="mt-4">
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                          {appointment.meeting_id && (
                            <div className="flex flex-col gap-1">
                              <Button
                                onClick={() => handleJoinMeeting(appointment)}
                                className={`${isInMeeting && currentMeetingId === appointment.meeting_id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} dark:text-white disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto`}
                                disabled={!isJoinAvailable(appointment) || (isInMeeting && currentMeetingId !== appointment.meeting_id)}
                                size="sm"
                              >
                                <Video className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                                {isInMeeting && currentMeetingId === appointment.meeting_id ? 'Rejoin Session' : 'Join Session'}
                              </Button>
                              {isInMeeting && currentMeetingId !== appointment.meeting_id && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                                  📞 Already in meeting: {currentMeetingId?.substring(0, 8)}...
                                </span>
                              )}
                            </div>
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
                              setSelectedAppointmentForNotes(appointment);
                              setShowNotesModal(true);
                            }}
                            variant="outline"
                            className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Notes
                          </Button>
                          <div className="w-full sm:w-auto">
                            <SessionProgressTracker
                              sessionId={appointment.id}
                              clientId={appointment.client_id}
                              clientName={appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                              userRole="coach"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => handleReschedule(appointment)}
                            variant="outline"
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Reschedule
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            variant="outline"
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Link href={`/coaches/messages?conversation_with=${appointment.client_id}&partner_name=${encodeURIComponent(appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client')}`} className="w-full sm:w-auto">
                            <Button
                              variant="outline"
                              className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
                              size="sm"
                            >
                              <MessageCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Message
                            </Button>
                          </Link>
                        </div>
                        <div className="mt-2">
                          <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">{getCountdownLabel(appointment)}</span>
                          {!isCompleteAvailable(appointment) && (
                            <div className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Can mark complete after session ends
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Message and Notes buttons for completed/cancelled appointments */}
                    {appointment.status !== 'scheduled' && appointment.status !== 'confirmed' && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        {appointment.status === 'completed' && (
                          <Button
                            onClick={() => {
                              setSelectedAppointmentForNotes(appointment);
                              setShowNotesModal(true);
                            }}
                            variant="outline"
                            className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
                            size="sm"
                          >
                            <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                            {appointment.status === 'completed' ? 'View/Edit Notes' : 'View Notes'}
                          </Button>
                        )}
                        <Link href={`/coaches/messages?conversation_with=${appointment.client_id}&partner_name=${encodeURIComponent(appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client')}`} className="w-full sm:w-auto">
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
          );
        })()}
      </div>

      {/* Client List Summary */}
      {uniqueClients.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Your Clients ({uniqueClients.length})
              </CardTitle>
              <CardDescription>
                Quick access to client information and session history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {uniqueClients.map(client => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{client.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{client.sessionCount} sessions</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => {
                          setSelectedClientForHistory(client);
                          setShowSessionHistory(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Link href={`/coaches/client/${client.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Meeting Container with PreCall and VideoMeeting */}
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
            handleLeaveMeeting();
            // Refresh appointments to update status
            loadAppointments(true);
          }}
        />
      )}

      {/* Mock Meeting Container for Testing */}
      {showMockMeeting && meetingAppointment && (
        <MockMeetingContainer
          appointmentId={meetingAppointment.id}
          appointmentData={{
            client_name: `${meetingAppointment.clients?.first_name} ${meetingAppointment.clients?.last_name}`,
            starts_at: meetingAppointment.starts_at,
            ends_at: meetingAppointment.ends_at
          }}
          isHost={true}
          onClose={() => {
            setShowMockMeeting(false);
            setMeetingAppointment(null);
          }}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointmentForReschedule && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          appointment={selectedAppointmentForReschedule}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Session Notes Modal */}
      {showNotesModal && selectedAppointmentForNotes && (
        <SessionNotesModal
          appointmentId={selectedAppointmentForNotes.id}
          clientName={`${selectedAppointmentForNotes.clients?.first_name} ${selectedAppointmentForNotes.clients?.last_name}`}
          sessionDate={selectedAppointmentForNotes.starts_at}
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedAppointmentForNotes(null);
          }}
          readonly={selectedAppointmentForNotes.status !== 'completed'}
        />
      )}

      {/* Client Session History Modal */}
      {showSessionHistory && selectedClientForHistory && (
        <ClientSessionHistory
          clientId={selectedClientForHistory.id}
          clientName={selectedClientForHistory.name}
          isOpen={showSessionHistory}
          onClose={() => {
            setShowSessionHistory(false);
            setSelectedClientForHistory(null);
          }}
        />
      )}
      
      {/* Debug Components - Remove in production */}
      <MeetingStatusDebug />
      <TestInstructions />
    </CoachPageWrapper>
  );
}

// Export dynamic component to prevent SSR issues
const AppointmentsPage = dynamic(() => Promise.resolve(AppointmentsPageContent), {
  ssr: false,
  loading: () => (
    <CoachPageWrapper title="Appointments" description="Manage your coaching sessions and appointments">
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
    </CoachPageWrapper>
  )
});

export default AppointmentsPage;