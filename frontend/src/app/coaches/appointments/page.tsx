'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CoachPageWrapper from '@/components/CoachPageWrapper';
import { getApiUrl } from '@/lib/api';
import axios from 'axios';

interface Appointment {
  id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  zoom_link: string;  // Required for online-only sessions
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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const API_URL = getApiUrl();

  useEffect(() => {
    loadAppointments();
  }, []); // Remove filter dependency since we always get all appointments

  // Tick every second to enable/disable Join and update countdown labels
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isJoinAvailable = (apt: Appointment) => {
    const start = new Date(apt.starts_at).getTime();
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (start + 60 * 60 * 1000);
    return nowMs >= start && nowMs <= end;
  };

  const getCountdownLabel = (apt: Appointment) => {
    const start = new Date(apt.starts_at).getTime();
    const end = apt.ends_at ? new Date(apt.ends_at).getTime() : (start + 60 * 60 * 1000);
    const toStart = start - nowMs;
    const toEnd = end - nowMs;
    if (toStart > 0) {
      const h = Math.floor(toStart / 3600000);
      const m = Math.floor((toStart % 3600000) / 60000);
      const s = Math.floor((toStart % 60000) / 1000);
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      const ss = s.toString().padStart(2, '0');
      return `Starts in ${hh}:${mm}:${ss}`;
    }
    if (toEnd > 0) return 'Live now';
    return 'Session ended';
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      // Always get all appointments for proper tab counting
      const response = await axios.get(`${API_URL}/api/coach/appointments`, {
        params: { filter: 'all' },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await axios.put(`${API_URL}/api/coach/appointments/${appointmentId}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <CoachPageWrapper title="Appointments" description="Manage your coaching sessions and appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        </div>
      </CoachPageWrapper>
    );
  }

  return (
    <CoachPageWrapper title="Appointments" description="Manage your coaching sessions and appointments">      

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past' },
              { key: 'pending', label: 'Pending' },
              { key: 'all', label: 'All' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 py-1 px-2 rounded-full">
                  {appointments.filter(apt => {
                    const appointmentDate = new Date(apt.starts_at);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    switch (tab.key) {
                      case 'upcoming':
                        return appointmentDate >= today && apt.status !== 'cancelled';
                      case 'past':
                        return appointmentDate < today || apt.status === 'completed';
                      case 'pending':
                        return apt.status === 'scheduled';
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

      {/* Appointments List */}
      <div className="space-y-4">
        {(() => {
          // Filter appointments based on selected tab
          const filteredAppointments = appointments.filter(apt => {
            const appointmentDate = new Date(apt.starts_at);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (filter) {
              case 'upcoming':
                return appointmentDate >= today && apt.status !== 'cancelled';
              case 'past':
                return appointmentDate < today || apt.status === 'completed';
              case 'pending':
                return apt.status === 'scheduled';
              case 'all':
              default:
                return true;
            }
          });

          return filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No {filter} appointments found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Client'}
                        </h3>
                        <p className="text-sm text-gray-500">{appointment.clients?.email || appointment.clients?.users?.email}</p>
                        <p className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer mt-1">
                          <a href="/coaches/clients" className="hover:underline">
                            View in My Clients →
                          </a>
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date & Time</p>
                        <p className="text-sm text-gray-900">
                          {new Date(appointment.starts_at).toLocaleDateString()} at {' '}
                          {new Date(appointment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Duration</p>
                        <p className="text-sm text-gray-900">{Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / (1000 * 60))} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Session Type</p>
                        <p className="text-sm text-gray-900">Virtual Session</p>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500">Notes</p>
                        <p className="text-sm text-gray-900 mt-1">{appointment.notes}</p>
                      </div>
                    )}

                    {appointment.status === 'scheduled' && (
                      <div className="mt-4 flex space-x-2">
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {appointment.status === 'confirmed' && (
                      <div className="mt-4 flex space-x-2">
                        {appointment.zoom_link && (
                          <Button
                            onClick={() => window.open(appointment.zoom_link, '_blank')}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!isJoinAvailable(appointment)}
                            size="sm"
                          >
                            📹 Join Session
                          </Button>
                        )}
                        <span className="text-xs text-gray-600 self-center">{getCountdownLabel(appointment)}</span>
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          Mark Complete
                        </Button>
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          Cancel
                        </Button>
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
    </CoachPageWrapper>
  );
}