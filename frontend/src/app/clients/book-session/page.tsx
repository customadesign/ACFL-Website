'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCircle, MapPin, Phone } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  expertise?: string[];
  bio?: string;
}

interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  duration_minutes: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BookSessionPage() {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadCoaches();
  }, []);

  useEffect(() => {
    if (selectedCoach && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedCoach, selectedDate]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = getApiUrl();
      const response = await fetch(`${API_BASE_URL}/api/coaches`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCoaches(data.coaches || []);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedCoach || !selectedDate) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = getApiUrl();
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/coach/${selectedCoach.id}/available-slots/${selectedDate}`,
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
    if (!selectedCoach || !selectedSlot || !user) return;

    try {
      setBooking(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = getApiUrl();
      
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/book-appointment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            coachId: selectedCoach.id,
            clientId: user.id,
            startTime: selectedSlot.slot_start,
            endTime: selectedSlot.slot_end,
            notes: notes.trim() || null
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookingDetails(data.appointment);
        setBookingComplete(true);
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

  const resetBooking = () => {
    setSelectedCoach(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setNotes('');
    setShowBookingForm(false);
    setBookingComplete(false);
    setBookingDetails(null);
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

  const { days, firstDay, lastDay } = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Booking completion screen
  if (bookingComplete && bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Confirmed!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your session has been successfully scheduled.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Coach:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedCoach?.first_name} {selectedCoach?.last_name}
              </span>
            </div>
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
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            You will receive a confirmation email shortly with meeting details.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/clients/appointments'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View My Appointments
            </button>
            <button
              onClick={resetBooking}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Book Another Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Coach selection screen
  if (!selectedCoach) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Book Your Coaching Session
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose your coach to get started
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  onClick={() => setSelectedCoach(coach)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                      {coach.first_name} {coach.last_name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-4">
                      {coach.email}
                    </p>
                    {coach.bio && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                        {coach.bio}
                      </p>
                    )}
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Available for booking
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // GHL-style calendar booking interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedCoach(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedCoach.first_name} {selectedCoach.last_name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Life Coaching Session
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-300">Duration</div>
            <div className="font-semibold text-gray-900 dark:text-white">60 minutes</div>
          </div>
        </div>
      </div>

      {/* Main booking interface */}
      <div className="max-w-6xl mx-auto p-6">
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
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setShowBookingForm(true);
                        }}
                        className={`w-full p-4 text-left border rounded-lg transition-all duration-200 ${
                          selectedSlot === slot
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
                            {formatTime(slot.slot_start)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {slot.duration_minutes}min
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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
                      {selectedCoach.first_name} {selectedCoach.last_name}
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
    </div>
  );
}