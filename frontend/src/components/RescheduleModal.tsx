'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  id: string;
  client_id: string;
  coach_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
}

interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  duration_minutes: number;
}

interface RescheduleModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function RescheduleModal({ appointment, isOpen, onClose, onSuccess }: RescheduleModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (selectedDate && appointment) {
      loadAvailableSlots();
    }
  }, [selectedDate, appointment]);

  const loadAvailableSlots = async () => {
    if (!selectedDate || !appointment) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/calendar/coach/${appointment.coach_id}/available-slots/${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;

    setRescheduling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/calendar/appointment/${appointment.id}/reschedule`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            newStartTime: selectedSlot.slot_start,
            newEndTime: selectedSlot.slot_end
          })
        }
      );

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reschedule appointment');
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
      alert('Failed to reschedule appointment. Please try again.');
    } finally {
      setRescheduling(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return { days };
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      short: date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      })
    };
  };

  const { days } = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clientName = appointment.clients ? 
    `${appointment.clients.first_name} ${appointment.clients.last_name}` : 
    'Client';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reschedule Appointment
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              with {clientName} • Current: {formatDate(appointment.starts_at).full} at {formatTime(appointment.starts_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="grid lg:grid-cols-5 gap-6 p-6">
            {/* Calendar Section */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select New Date
              </h3>

              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h4>
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isPast = day < today;
                  const dateString = day.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateString;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isPast && isCurrentMonth) {
                          setSelectedDate(dateString);
                          setSelectedSlot(null);
                        }
                      }}
                      disabled={isPast || !isCurrentMonth}
                      className={`aspect-square p-2 text-sm rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md transform scale-105'
                          : isCurrentMonth
                          ? isPast
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Available Times
              </h3>
              
              {selectedDate ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No available times</p>
                    </div>
                  ) : (
                    availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
                          selectedSlot === slot
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
                          {formatTime(slot.slot_start)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {slot.duration_minutes} minutes
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Select a date to view times</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            disabled={rescheduling}
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={!selectedSlot || rescheduling}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {rescheduling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Rescheduling...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm Reschedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}