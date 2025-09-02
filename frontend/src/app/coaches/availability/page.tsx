'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Plus, X, Edit3, Trash2, Save, CalendarDays } from 'lucide-react';
import CalendarSkeleton from '@/components/CalendarSkeleton';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
  title: string;
  description: string;
  is_active: boolean;
  // New fields for flexible session lengths
  available_durations: number[];
  is_flexible_duration: boolean;
  min_session_minutes: number;
  max_session_minutes: number;
}

interface BlockedSlot {
  id: string;
  blocked_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function CoachAvailabilityPage() {
  const { user } = useAuth();
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 60,
    buffer_minutes: 5,
    title: '',
    description: '',
    // New fields for flexible session lengths
    available_durations: [60] as number[],
    is_flexible_duration: false,
    min_session_minutes: 30,
    max_session_minutes: 120
  });

  const [newBlocked, setNewBlocked] = useState({
    blocked_date: '',
    start_time: '',
    end_time: '',
    reason: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadAvailability();
    }
  }, [user?.id]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load availability slots
      const availabilityResponse = await fetch(
        `http://localhost:3001/api/calendar/coach/${user?.id}/availability`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        // Ensure available_durations is always an array
        const slots = (availabilityData.availability || []).map((slot: any) => ({
          ...slot,
          available_durations: Array.isArray(slot.available_durations) 
            ? slot.available_durations 
            : slot.available_durations 
              ? [slot.available_durations] 
              : [60], // Default to 60 minutes if not specified
          is_flexible_duration: slot.is_flexible_duration || false,
          min_session_minutes: slot.min_session_minutes || 30,
          max_session_minutes: slot.max_session_minutes || 120
        }));
        setAvailabilitySlots(slots);
      }

      // Load blocked slots
      const blockedResponse = await fetch(
        `http://localhost:3001/api/calendar/coach/${user?.id}/blocked`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json();
        setBlockedSlots(blockedData.blocked || []);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `http://localhost:3001/api/calendar/coach/${user?.id}/availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            dayOfWeek: newSlot.day_of_week,
            startTime: newSlot.start_time,
            endTime: newSlot.end_time,
            slotDurationMinutes: newSlot.slot_duration_minutes,
            bufferMinutes: newSlot.buffer_minutes,
            title: newSlot.title,
            description: newSlot.description,
            availableDurations: newSlot.available_durations,
            isFlexibleDuration: newSlot.is_flexible_duration,
            minSessionMinutes: newSlot.min_session_minutes,
            maxSessionMinutes: newSlot.max_session_minutes
          })
        }
      );

      if (response.ok) {
        setShowAddModal(false);
        setNewSlot({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration_minutes: 60,
          buffer_minutes: 5,
          title: '',
          description: '',
          available_durations: [60],
          is_flexible_duration: false,
          min_session_minutes: 30,
          max_session_minutes: 120
        });
        await loadAvailability();
      }
    } catch (error) {
      console.error('Error adding slot:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `http://localhost:3001/api/calendar/coach/${user?.id}/availability/${editingSlot.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            dayOfWeek: editingSlot.day_of_week,
            startTime: editingSlot.start_time,
            endTime: editingSlot.end_time,
            slotDurationMinutes: editingSlot.slot_duration_minutes,
            bufferMinutes: editingSlot.buffer_minutes,
            title: editingSlot.title,
            description: editingSlot.description,
            isActive: editingSlot.is_active,
            availableDurations: editingSlot.available_durations,
            isFlexibleDuration: editingSlot.is_flexible_duration,
            minSessionMinutes: editingSlot.min_session_minutes,
            maxSessionMinutes: editingSlot.max_session_minutes
          })
        }
      );

      if (response.ok) {
        setEditingSlot(null);
        await loadAvailability();
      }
    } catch (error) {
      console.error('Error updating slot:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `http://localhost:3001/api/calendar/coach/${user?.id}/availability/${slotId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        await loadAvailability();
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const handleAddBlocked = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `http://localhost:3001/api/calendar/coach/${user?.id}/blocked`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            blockedDate: newBlocked.blocked_date,
            startTime: newBlocked.start_time || null,
            endTime: newBlocked.end_time || null,
            reason: newBlocked.reason
          })
        }
      );

      if (response.ok) {
        setShowBlockModal(false);
        setNewBlocked({
          blocked_date: '',
          start_time: '',
          end_time: '',
          reason: ''
        });
        await loadAvailability();
      }
    } catch (error) {
      console.error('Error adding blocked slot:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlocked = async (blockedId: string) => {
    if (!confirm('Are you sure you want to remove this blocked time?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `http://localhost:3001/api/calendar/coach/${user?.id}/blocked/${blockedId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        await loadAvailability();
      }
    } catch (error) {
      console.error('Error deleting blocked slot:', error);
    }
  };

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Availability Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Set your weekly schedule and manage blocked time periods
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Availability Slot
        </button>
        <button
          onClick={() => setShowBlockModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
          Block Time
        </button>
      </div>

      {/* Weekly Availability */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Schedule
          </h2>
        </div>
        <div className="p-6">
          {DAYS_OF_WEEK.map((day, dayIndex) => {
            const daySlots = availabilitySlots.filter(slot => slot.day_of_week === dayIndex);
            
            return (
              <div key={day} className="mb-6 last:mb-0">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">{day}</h3>
                {daySlots.length === 0 ? (
                  <p className="text-gray-500 text-sm ml-4">No availability set</p>
                ) : (
                  <div className="space-y-2 ml-4">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {slot.is_flexible_duration 
                                ? `Flexible (${slot.min_session_minutes}-${slot.max_session_minutes}min)`
                                : Array.isArray(slot.available_durations) && slot.available_durations.length > 1 
                                  ? `${slot.available_durations.join('/')}min options`
                                  : `${slot.slot_duration_minutes}min slots`
                              }, {slot.buffer_minutes}min buffer
                            </span>
                            {slot.is_flexible_duration && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                                Flexible
                              </span>
                            )}
                            {!slot.is_active && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          {slot.title && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{slot.title}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingSlot({
                              ...slot,
                              available_durations: Array.isArray(slot.available_durations) 
                                ? slot.available_durations 
                                : [60]
                            })}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Blocked Time
          </h2>
        </div>
        <div className="p-6">
          {blockedSlots.length === 0 ? (
            <p className="text-gray-500">No blocked time periods</p>
          ) : (
            <div className="space-y-3">
              {blockedSlots.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(blocked.blocked_date).toLocaleDateString()}
                      </span>
                      {blocked.start_time && blocked.end_time ? (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {blocked.start_time} - {blocked.end_time}
                        </span>
                      ) : (
                        <span className="text-sm text-red-600 dark:text-red-400">
                          Full day blocked
                        </span>
                      )}
                    </div>
                    {blocked.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{blocked.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteBlocked(blocked.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800/30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Availability Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Availability Slot
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day of Week
                </label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slot Duration (minutes)
                  </label>
                  <select
                    value={newSlot.slot_duration_minutes}
                    onChange={(e) => setNewSlot({ ...newSlot, slot_duration_minutes: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buffer Time (minutes)
                  </label>
                  <select
                    value={newSlot.buffer_minutes}
                    onChange={(e) => setNewSlot({ ...newSlot, buffer_minutes: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
              </div>

              {/* Session Length Configuration */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Session Length Options</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newSlot.is_flexible_duration}
                        onChange={(e) => setNewSlot({ 
                          ...newSlot, 
                          is_flexible_duration: e.target.checked,
                          available_durations: e.target.checked ? [] : [60]
                        })}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Flexible session length (client chooses duration)
                      </span>
                    </label>
                  </div>

                  {newSlot.is_flexible_duration ? (
                    <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Minimum Duration
                        </label>
                        <select
                          value={newSlot.min_session_minutes}
                          onChange={(e) => setNewSlot({ ...newSlot, min_session_minutes: parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>1 hour</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Maximum Duration
                        </label>
                        <select
                          value={newSlot.max_session_minutes}
                          onChange={(e) => setNewSlot({ ...newSlot, max_session_minutes: parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={60}>1 hour</option>
                          <option value={90}>1.5 hours</option>
                          <option value={120}>2 hours</option>
                          <option value={180}>3 hours</option>
                          <option value={240}>4 hours</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Clients can choose any duration between min and max during booking
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Available Session Durations (select multiple)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[30, 45, 60, 90, 120].map((duration) => (
                          <label key={duration} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newSlot.available_durations.includes(duration)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewSlot({
                                    ...newSlot,
                                    available_durations: [...newSlot.available_durations, duration].sort((a, b) => a - b)
                                  });
                                } else {
                                  setNewSlot({
                                    ...newSlot,
                                    available_durations: newSlot.available_durations.filter(d => d !== duration)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {duration === 60 ? '1 hour' : duration === 90 ? '1.5 hours' : duration === 120 ? '2 hours' : `${duration} min`}
                            </span>
                          </label>
                        ))}
                      </div>
                      {newSlot.available_durations.length === 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Please select at least one duration option
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={newSlot.title}
                  onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })}
                  placeholder="e.g., Morning Sessions"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newSlot.description}
                  onChange={(e) => setNewSlot({ ...newSlot, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlot}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Availability Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Availability Slot
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day of Week
                </label>
                <select
                  value={editingSlot.day_of_week}
                  onChange={(e) => setEditingSlot({ ...editingSlot, day_of_week: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editingSlot.start_time}
                    onChange={(e) => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editingSlot.end_time}
                    onChange={(e) => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingSlot.is_active}
                    onChange={(e) => setEditingSlot({ ...editingSlot, is_active: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
              <button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSlot}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Block Time
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newBlocked.blocked_date}
                  onChange={(e) => setNewBlocked({ ...newBlocked, blocked_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time (optional)
                  </label>
                  <input
                    type="time"
                    value={newBlocked.start_time}
                    onChange={(e) => setNewBlocked({ ...newBlocked, start_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time (optional)
                  </label>
                  <input
                    type="time"
                    value={newBlocked.end_time}
                    onChange={(e) => setNewBlocked({ ...newBlocked, end_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Leave times empty to block the entire day
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={newBlocked.reason}
                  onChange={(e) => setNewBlocked({ ...newBlocked, reason: e.target.value })}
                  placeholder="e.g., Vacation, Personal, Training"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBlocked}
                disabled={saving || !newBlocked.blocked_date}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Blocking...' : 'Block Time'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}