'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CoachPageWrapper from '@/components/CoachPageWrapper';
import axios from 'axios';

interface Appointment {
  id: string;
  client_id: string;
  scheduled_at: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  session_type?: string;
  notes?: string;
  clients?: {
    first_name: string;
    last_name: string;
    phone?: string;
    users: {
      email: string;
    };
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadAppointments();
  }, []); // Remove filter dependency since we always get all appointments

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
                    const appointmentDate = new Date(apt.scheduled_at);
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
            const appointmentDate = new Date(apt.scheduled_at);
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
                        <p className="text-sm text-gray-500">{appointment.clients?.users?.email}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date & Time</p>
                        <p className="text-sm text-gray-900">
                          {new Date(appointment.scheduled_at).toLocaleDateString()} at {' '}
                          {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Duration</p>
                        <p className="text-sm text-gray-900">{appointment.duration || 60} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Session Type</p>
                        <p className="text-sm text-gray-900">{appointment.session_type || 'Coaching Session'}</p>
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

                    {appointment.status === 'confirmed' && new Date(appointment.scheduled_at) >= new Date() && (
                      <div className="mt-4 flex space-x-2">
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