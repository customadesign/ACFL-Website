'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Plus, X, Edit3, Trash2, Save, CalendarDays, Settings, Grid, List, AlertTriangle } from 'lucide-react';
import CalendarSkeleton from '@/components/CalendarSkeleton';
import { getApiUrl } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CoachPageWrapper from '@/components/CoachPageWrapper';

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
  const [activeTab, setActiveTab] = useState('calendar');

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    type: 'info'
  });

  // Success/Error toast states
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

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

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast.isOpen) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, isOpen: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.isOpen]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isOpen: true, message, type });
  };

  const showConfirmModal = (
    title: string,
    message: string,
    confirmText: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'info'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm,
      type
    });
  };

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = getApiUrl();
      
      // Load availability slots
      const availabilityResponse = await fetch(
        `${API_BASE_URL}/api/calendar/coach/${user?.id}/availability`,
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
        `${API_BASE_URL}/api/calendar/coach/${user?.id}/blocked`,
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
      const API_BASE_URL = getApiUrl();

      // Check if day already has a slot (prevent multiple slots per day)
      const existingSlot = availabilitySlots.find(slot =>
        slot.day_of_week === newSlot.day_of_week && slot.is_active
      );

      if (existingSlot) {
        showToast('This day already has an availability slot. Please edit the existing slot or delete it first.', 'error');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/calendar/coach/${user?.id}/availability`,
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
            availableDurations: [newSlot.slot_duration_minutes], // Simplified to single duration
            isFlexibleDuration: false,
            minSessionMinutes: newSlot.slot_duration_minutes,
            maxSessionMinutes: newSlot.slot_duration_minutes
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
      const API_BASE_URL = getApiUrl();
      
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/coach/${user?.id}/availability/${editingSlot.id}`,
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
    showConfirmModal(
      'Delete Availability Slot',
      'Are you sure you want to delete this availability slot? This action cannot be undone.',
      'Delete Slot',
      async () => {
        try {
          const token = localStorage.getItem('token');
          const API_BASE_URL = getApiUrl();

          const response = await fetch(
            `${API_BASE_URL}/api/calendar/coach/${user?.id}/availability/${slotId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.ok) {
            await loadAvailability();
            showToast('Availability slot deleted successfully', 'success');
          } else {
            showToast('Failed to delete availability slot', 'error');
          }
        } catch (error) {
          console.error('Error deleting slot:', error);
          showToast('Failed to delete availability slot', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
  };

  const handleAddBlocked = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = getApiUrl();
      
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/coach/${user?.id}/blocked`,
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
    showConfirmModal(
      'Remove Blocked Time',
      'Are you sure you want to remove this blocked time? This will make the time available for booking again.',
      'Remove Block',
      async () => {
        try {
          const token = localStorage.getItem('token');
          const API_BASE_URL = getApiUrl();

          const response = await fetch(
            `${API_BASE_URL}/api/calendar/coach/${user?.id}/blocked/${blockedId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.ok) {
            await loadAvailability();
            showToast('Blocked time removed successfully', 'success');
          } else {
            showToast('Failed to remove blocked time', 'error');
          }
        } catch (error) {
          console.error('Error deleting blocked slot:', error);
          showToast('Failed to remove blocked time', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'warning'
    );
  };

  const handleQuickSetup = async (templateName: string) => {
    if (!user?.id) return;

    const templates = {
      'business-hours': [
        { day: 1, start: '09:00', end: '17:00', duration: 60, buffer: 15, title: 'Business Hours' },
        { day: 2, start: '09:00', end: '17:00', duration: 60, buffer: 15, title: 'Business Hours' },
        { day: 3, start: '09:00', end: '17:00', duration: 60, buffer: 15, title: 'Business Hours' },
        { day: 4, start: '09:00', end: '17:00', duration: 60, buffer: 15, title: 'Business Hours' },
        { day: 5, start: '09:00', end: '17:00', duration: 60, buffer: 15, title: 'Business Hours' }
      ],
      'part-time': [
        { day: 1, start: '18:00', end: '21:00', duration: 45, buffer: 10, title: 'Evening Sessions' },
        { day: 3, start: '18:00', end: '21:00', duration: 45, buffer: 10, title: 'Evening Sessions' },
        { day: 5, start: '18:00', end: '21:00', duration: 45, buffer: 10, title: 'Evening Sessions' }
      ],
      'weekend': [
        { day: 0, start: '10:00', end: '16:00', duration: 90, buffer: 30, title: 'Weekend Sessions' },
        { day: 6, start: '10:00', end: '16:00', duration: 90, buffer: 30, title: 'Weekend Sessions' }
      ]
    };

    const template = templates[templateName as keyof typeof templates];
    if (!template) return;

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = getApiUrl();

      const templateDisplayNames = {
        'business-hours': 'Business Hours',
        'part-time': 'Part-Time Schedule',
        'weekend': 'Weekend Coach'
      };

      const applyTemplate = async () => {
        try {
          setSaving(true);
          console.log('Starting template application for:', templateName);

          // Delete existing slots if any
          if (availabilitySlots.length > 0) {
            console.log('Deleting existing slots:', availabilitySlots.length);
            for (const slot of availabilitySlots) {
              const deleteResponse = await fetch(`${API_BASE_URL}/api/calendar/coach/${user.id}/availability/${slot.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });

              if (!deleteResponse.ok) {
                throw new Error(`Failed to delete slot ${slot.id}: ${deleteResponse.status}`);
              }
            }
            console.log('Existing slots deleted successfully');
          }

          // Create new slots from template
          console.log('Creating new slots from template:', template);
          const createPromises = template.map(async (slot) => {
            const response = await fetch(`${API_BASE_URL}/api/calendar/coach/${user.id}/availability`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                dayOfWeek: slot.day,
                startTime: slot.start,
                endTime: slot.end,
                slotDurationMinutes: slot.duration,
                bufferMinutes: slot.buffer,
                title: slot.title,
                description: `Created from ${templateName} template`,
                availableDurations: [slot.duration],
                isFlexibleDuration: false,
                minSessionMinutes: slot.duration,
                maxSessionMinutes: slot.duration
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('API Error:', response.status, errorText);
              throw new Error(`Failed to create slot for day ${slot.day}: ${response.status} - ${errorText}`);
            }

            return response;
          });

          await Promise.all(createPromises);
          console.log('New slots created successfully');

          await loadAvailability();
          console.log('Availability reloaded successfully');

          showToast(`${templateDisplayNames[templateName as keyof typeof templateDisplayNames]} schedule has been applied successfully!`, 'success');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error applying template:', error);
          showToast(`Failed to apply template: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } finally {
          setSaving(false);
          console.log('Template application completed');
        }
      };

      // Show confirmation if there are existing slots
      if (availabilitySlots.length > 0) {
        showConfirmModal(
          `Apply ${templateDisplayNames[templateName as keyof typeof templateDisplayNames]} Template`,
          `This will replace your current availability schedule. You have ${availabilitySlots.length} existing slots that will be removed. Continue?`,
          'Apply Template',
          applyTemplate,
          'warning'
        );
      } else {
        await applyTemplate();
      }

    } catch (error) {
      console.error('Error applying template:', error);
      showToast('Failed to apply template. Please try again.', 'error');
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!user?.id || availabilitySlots.length === 0) {
      showToast('No availability slots to clear.', 'error');
      return;
    }

    showConfirmModal(
      'Clear All Availability',
      `This will permanently delete all ${availabilitySlots.length} availability slots. This action cannot be undone. Continue?`,
      'Clear All',
      async () => {
        try {
          setSaving(true);
          const token = localStorage.getItem('token');
          const API_BASE_URL = getApiUrl();

          // Delete all existing slots
          const deletePromises = availabilitySlots.map(slot =>
            fetch(`${API_BASE_URL}/api/calendar/coach/${user.id}/availability/${slot.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            })
          );

          await Promise.all(deletePromises);
          await loadAvailability();

          showToast('All availability slots have been cleared successfully.', 'success');

        } catch (error) {
          console.error('Error clearing availability:', error);
          showToast('Failed to clear availability. Please try again.', 'error');
        } finally {
          setSaving(false);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
  };

  if (loading) {
    return (
      <CoachPageWrapper>
        <CalendarSkeleton />
      </CoachPageWrapper>
    );
  }

  return (
    <CoachPageWrapper>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Availability Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Set your weekly schedule and manage blocked time periods
          </p>
        </div>
      </div>

      {/* Unified Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Blocked Time</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Setup</span>
          </TabsTrigger>
        </TabsList>

        {/* Weekly Schedule Tab */}
        <TabsContent value="calendar" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Schedule</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Set one availability window per day. Click on any day to add or edit your availability.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('settings')} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Quick Setup
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const daySlot = availabilitySlots.find(slot => slot.day_of_week === dayIndex && slot.is_active);
              const hasSlot = !!daySlot;

              return (
                <Card key={day} className="transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => {
                  if (hasSlot) {
                    setEditingSlot({
                      ...daySlot,
                      available_durations: Array.isArray(daySlot.available_durations)
                        ? daySlot.available_durations
                        : [60]
                    });
                  } else {
                    setNewSlot(prev => ({ ...prev, day_of_week: dayIndex }));
                    setShowAddModal(true);
                  }
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-12 rounded-full ${
                          hasSlot ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{day}</h3>
                          {hasSlot ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {daySlot.start_time} - {daySlot.end_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                  {daySlot.slot_duration_minutes}min sessions
                                </span>
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                                  {daySlot.buffer_minutes}min buffer
                                </span>
                              </div>
                              {daySlot.title && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{daySlot.title}</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Not available</span>
                              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                Click to add availability
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {hasSlot && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSlot({
                                ...daySlot,
                                available_durations: Array.isArray(daySlot.available_durations)
                                  ? daySlot.available_durations
                                  : [60]
                              });
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlot(daySlot.id);
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Weekly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Weekly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {availabilitySlots.reduce((total, slot) => {
                      if (!slot.is_active) return total;
                      const startHour = parseInt(slot.start_time.split(':')[0]);
                      const endHour = parseInt(slot.end_time.split(':')[0]);
                      return total + (endHour - startHour);
                    }, 0)}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-medium">Available Hours/Week</div>
                </div>

                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {DAYS_OF_WEEK.filter((_, dayIndex) =>
                      availabilitySlots.some(slot => slot.day_of_week === dayIndex && slot.is_active)
                    ).length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Active Days</div>
                </div>

                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {blockedSlots.length}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium">Blocked Periods</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Blocked Time Tab */}
        <TabsContent value="blocked" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Blocked Time</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Manage specific dates and times when you're unavailable
              </p>
            </div>
            <Button
              onClick={() => setShowBlockModal(true)}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Block Time
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              {blockedSlots.length === 0 ? (
                <div className="flex items-center justify-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="text-center">
                    <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No blocked time periods</h3>
                    <p className="text-gray-500 text-sm mb-4">Block specific dates or times when you're unavailable</p>
                    <Button onClick={() => setShowBlockModal(true)} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Add Blocked Time
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Blocked Periods ({blockedSlots.length})
                  </h3>
                  <div className="grid gap-3">
                    {blockedSlots.map((blocked) => (
                      <div
                        key={blocked.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-red-600" />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {new Date(blocked.blocked_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            {blocked.start_time && blocked.end_time ? (
                              <span className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 px-2 py-1 rounded-md">
                                {blocked.start_time} - {blocked.end_time}
                              </span>
                            ) : (
                              <span className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-1 rounded-md font-medium">
                                Full day blocked
                              </span>
                            )}
                          </div>
                          {blocked.reason && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Reason:</span>
                              <span className="text-sm text-gray-900 dark:text-white font-medium">{blocked.reason}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBlocked(blocked.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Setup Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Setup</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Fast ways to set up your weekly availability with common schedules
            </p>
          </div>

          <div className="grid gap-6">
            {/* Preset Schedules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Common Schedules
                </CardTitle>
                <CardDescription>
                  Apply popular coaching schedule templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left flex-col items-start"
                    onClick={() => handleQuickSetup('business-hours')}
                    disabled={saving}
                  >
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      Business Hours
                      {saving && <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Monday-Friday, 9:00 AM - 5:00 PM
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      1-hour sessions with 15min buffer
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left flex-col items-start"
                    onClick={() => handleQuickSetup('part-time')}
                    disabled={saving}
                  >
                    <div className="font-semibold mb-1">Part-Time Schedule</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Mon/Wed/Fri, 6:00 PM - 9:00 PM
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      45-minute sessions with 10min buffer
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left flex-col items-start"
                    onClick={() => handleQuickSetup('weekend')}
                    disabled={saving}
                  >
                    <div className="font-semibold mb-1">Weekend Coach</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Saturday-Sunday, 10:00 AM - 4:00 PM
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      90-minute sessions with 30min buffer
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left flex-col items-start"
                    onClick={handleClearAll}
                    disabled={saving}
                  >
                    <div className="font-semibold mb-1">Clear All</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Remove all current availability
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Start fresh with a clean schedule
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Add Individual Day
                  </CardTitle>
                  <CardDescription>
                    Set availability for a specific day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Availability
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-600" />
                    Block Time Period
                  </CardTitle>
                  <CardDescription>
                    Block specific dates when unavailable
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowBlockModal(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Block Time
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Current Schedule Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {DAYS_OF_WEEK.filter((_, dayIndex) =>
                        availabilitySlots.some(slot => slot.day_of_week === dayIndex && slot.is_active)
                      ).length}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Active Days</div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {availabilitySlots.reduce((total, slot) => {
                        if (!slot.is_active) return total;
                        const startHour = parseInt(slot.start_time.split(':')[0]);
                        const endHour = parseInt(slot.end_time.split(':')[0]);
                        return total + (endHour - startHour);
                      }, 0)}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Hours/Week</div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {blockedSlots.length}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">Blocked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Availability Modal - Simplified */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Add Availability
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Set your availability for {DAYS_OF_WEEK[newSlot.day_of_week]}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day of Week
                </label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Time Range */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Available Hours
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Session Settings */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Session Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Length
                    </label>
                    <select
                      value={newSlot.slot_duration_minutes}
                      onChange={(e) => setNewSlot({ ...newSlot, slot_duration_minutes: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buffer Time
                    </label>
                    <select
                      value={newSlot.buffer_minutes}
                      onChange={(e) => setNewSlot({ ...newSlot, buffer_minutes: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value={0}>No buffer</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={newSlot.title}
                  onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })}
                  placeholder="e.g., Morning Sessions, Evening Coaching"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {DAYS_OF_WEEK[newSlot.day_of_week]} availability: {newSlot.start_time} - {newSlot.end_time}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {newSlot.slot_duration_minutes}min sessions with {newSlot.buffer_minutes}min buffer
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSlot}
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Availability
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Availability Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingSlot(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Edit Availability Slot
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Modify the details of your recurring time slot
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSlot(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  Basic Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Day of Week
                    </label>
                    <select
                      value={editingSlot.day_of_week}
                      onChange={(e) => setEditingSlot({ ...editingSlot, day_of_week: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={day} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editingSlot.start_time}
                      onChange={(e) => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editingSlot.end_time}
                      onChange={(e) => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Session Configuration */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  Session Configuration
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Slot Duration
                    </label>
                    <select
                      value={editingSlot.slot_duration_minutes}
                      onChange={(e) => setEditingSlot({ ...editingSlot, slot_duration_minutes: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buffer Time
                    </label>
                    <select
                      value={editingSlot.buffer_minutes}
                      onChange={(e) => setEditingSlot({ ...editingSlot, buffer_minutes: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value={0}>No buffer</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingSlot.title || ''}
                      onChange={(e) => setEditingSlot({ ...editingSlot, title: e.target.value })}
                      placeholder="e.g., Morning Sessions, Evening Coaching"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={editingSlot.is_active}
                        onChange={(e) => setEditingSlot({ ...editingSlot, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Active Slot
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Available for client bookings
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingSlot.description || ''}
                    onChange={(e) => setEditingSlot({ ...editingSlot, description: e.target.value })}
                    placeholder="Additional information about this time slot..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditingSlot(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSlot}
                  disabled={saving}
                  className="min-w-[140px]"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBlockModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Block Time
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Mark specific dates or times when you're unavailable
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBlockModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Selection */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  Date & Time
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date to Block
                  </label>
                  <input
                    type="date"
                    value={newBlocked.blocked_date}
                    onChange={(e) => setNewBlocked({ ...newBlocked, blocked_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Time Range (Optional)
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Leave empty to block the entire day, or specify a time range to block only part of the day
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newBlocked.start_time}
                        onChange={(e) => setNewBlocked({ ...newBlocked, start_time: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newBlocked.end_time}
                        onChange={(e) => setNewBlocked({ ...newBlocked, end_time: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>

                  {newBlocked.start_time && newBlocked.end_time && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-800 dark:text-blue-200">
                          Blocking {newBlocked.start_time} - {newBlocked.end_time} on {newBlocked.blocked_date ? new Date(newBlocked.blocked_date + 'T00:00').toLocaleDateString() : 'selected date'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  Reason (Optional)
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Why are you blocking this time?
                  </label>
                  <input
                    type="text"
                    value={newBlocked.reason}
                    onChange={(e) => setNewBlocked({ ...newBlocked, reason: e.target.value })}
                    placeholder="e.g., Vacation, Personal appointment, Training, Holiday"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Important Notice
                      </h5>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Blocking time will prevent clients from booking appointments during the specified period. Existing appointments will not be affected.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBlockModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBlocked}
                  disabled={saving || !newBlocked.blocked_date}
                  variant="destructive"
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Blocking...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Block Time
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmModal.type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' :
                  confirmModal.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {confirmModal.type === 'danger' ? (
                    <X className={`w-6 h-6 text-red-600 dark:text-red-400`} />
                  ) : confirmModal.type === 'warning' ? (
                    <AlertTriangle className={`w-6 h-6 text-yellow-600 dark:text-yellow-400`} />
                  ) : (
                    <Calendar className={`w-6 h-6 text-blue-600 dark:text-blue-400`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {confirmModal.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmModal.onConfirm}
                  disabled={saving}
                  variant={confirmModal.type === 'danger' ? 'destructive' : confirmModal.type === 'warning' ? 'destructive' : 'default'}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    confirmModal.confirmText
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.isOpen && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`max-w-sm rounded-lg shadow-lg border p-4 ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                toast.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  toast.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {toast.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setToast(prev => ({ ...prev, isOpen: false }))}
                className={`p-1 hover:bg-transparent ${
                  toast.type === 'success'
                    ? 'text-green-600 dark:text-green-400 hover:text-green-700'
                    : 'text-red-600 dark:text-red-400 hover:text-red-700'
                }`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </CoachPageWrapper>
  );
}