'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, User } from 'lucide-react';

interface Coach {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
}

interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  duration_minutes: number;
  available_durations?: number[];
  is_flexible_duration?: boolean;
  min_session_minutes?: number;
  max_session_minutes?: number;
}

interface GHLBookingCalendarProps {
  coach: Coach;
  onBookingComplete?: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GHLBookingCalendar({ coach, onBookingComplete }: GHLBookingCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (coach && selectedDate) {
      loadAvailableSlots();
    }
  }, [coach, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!coach || !selectedDate) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/calendar/coach/${coach.id}/available-slots/${selectedDate}`,
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

  const handleBookAppointment = async () => {
    if (!coach || !selectedSlot || !user) return;

    try {
      setBooking(true);
      const token = localStorage.getItem('token');
      
      // Calculate the actual end time based on selected duration
      const startTime = new Date(selectedSlot.slot_start);
      const actualDuration = selectedDuration || selectedSlot.duration_minutes;
      const endTime = new Date(startTime.getTime() + actualDuration * 60000);
      
      const response = await fetch(
        'http://localhost:3001/api/calendar/book-appointment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            coachId: coach.id,
            clientId: user.id,
            startTime: selectedSlot.slot_start,
            endTime: endTime.toISOString(),
            sessionDurationMinutes: actualDuration,
            notes: notes.trim() || null
          })
        }
      );

      if (response.ok) {
        setBookingComplete(true);
        setShowBookingForm(false);
        if (onBookingComplete) {
          onBookingComplete();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
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
    
    return { days, firstDay, lastDay };
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

  const coachName = coach.name || `${coach.first_name || ''} ${coach.last_name || ''}`.trim();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Booking Confirmed!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your session with {coachName} has been successfully scheduled.
        </p>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Date:</span>
            <span className="font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
              {formatDate(selectedDate!).full}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Time:</span>
            <span className="font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
              {formatTime(selectedSlot!.slot_start)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Duration:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedSlot!.duration_minutes} minutes
            </span>
          </div>
        </div>
        
        <button
          onClick={() => window.location.href = '/clients/appointments'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View My Appointments
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="grid lg:grid-cols-5">
          
          {/* Calendar Section */}
          <div className="lg:col-span-3 p-6 border-r border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select a Date
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Choose your preferred date from the available options
              </p>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h4>
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
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
          <div className="lg:col-span-2 p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Available Times
              </h3>
              {selectedDate ? (
                <p className="text-sm text-gray-600 dark:text-gray-300" suppressHydrationWarning>
                  {formatDate(selectedDate).full}
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a date to view available times
                </p>
              )}
            </div>

            {selectedDate && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No available times for this date
                    </p>
                  </div>
                ) : (
                  availableSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`w-full border rounded-lg transition-all duration-200 ${
                        selectedSlot === slot
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedSlot(slot);
                          // Reset duration selection when selecting new slot
                          setSelectedDuration(null);
                          setCustomDuration(slot.min_session_minutes || 60);
                        }}
                        className="w-full p-4 text-left hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
                            {formatTime(slot.slot_start)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {slot.is_flexible_duration 
                              ? `${slot.min_session_minutes}-${slot.max_session_minutes}min`
                              : slot.available_durations && slot.available_durations.length > 1
                                ? `${slot.available_durations.join('/')}min`
                                : `${slot.duration_minutes}min`
                            }
                          </div>
                        </div>
                        
                        {slot.is_flexible_duration && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            Flexible session length
                          </div>
                        )}
                      </button>
                      
                      {/* Duration Selection - shown when slot is selected */}
                      {selectedSlot === slot && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Session Duration
                            </label>
                            
                            {slot.is_flexible_duration ? (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="range"
                                    min={slot.min_session_minutes || 30}
                                    max={slot.max_session_minutes || 120}
                                    step="15"
                                    value={customDuration}
                                    onChange={(e) => {
                                      const duration = parseInt(e.target.value);
                                      setCustomDuration(duration);
                                      setSelectedDuration(duration);
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white w-16">
                                    {customDuration}min
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Choose any duration between {slot.min_session_minutes} and {slot.max_session_minutes} minutes
                                </p>
                              </div>
                            ) : slot.available_durations && slot.available_durations.length > 1 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {slot.available_durations.map((duration) => (
                                  <button
                                    key={duration}
                                    onClick={() => setSelectedDuration(duration)}
                                    className={`p-2 text-sm rounded-lg border transition-colors ${
                                      selectedDuration === duration
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                                    }`}
                                  >
                                    {duration === 60 ? '1 hour' : duration === 90 ? '1.5 hours' : duration === 120 ? '2 hours' : `${duration} min`}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                                {slot.duration_minutes} minutes (fixed duration)
                              </div>
                            )}
                            
                            <button
                              onClick={() => setShowBookingForm(true)}
                              disabled={slot.is_flexible_duration && !selectedDuration}
                              className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Book This Time
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirm Your Booking
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {coachName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Life Coaching Session
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Date</div>
                    <div className="font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
                      {formatDate(selectedDate!).short}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Time</div>
                    <div className="font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
                      {formatTime(selectedSlot.slot_start)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Duration</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedSlot.duration_minutes} minutes
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Meeting</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Video Call
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What would you like to focus on in this session?"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                disabled={booking}
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={booking}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {booking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Book Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}