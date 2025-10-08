'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { MessageCircle, Calendar, Bell, User, Clock, UserPlus, Users, Shield } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '@/lib/api';

interface AdminNotificationContextType {
  newUsersCount: number;
  newCoachApplicationsCount: number;
  newAppointmentsCount: number;
  newMessagesCount: number;
  displayNewUsersCount: number;
  displayNewCoachApplicationsCount: number;
  displayNewAppointmentsCount: number;
  displayNewMessagesCount: number;
  markNewUsersAsRead: () => void;
  markNewCoachApplicationsAsRead: () => void;
  markNewAppointmentsAsRead: () => void;
  markNewMessagesAsRead: () => void;
  refreshCounts: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

// Function to play fallback notification sounds using Web Audio API
const playFallbackSound = (type: 'user' | 'appointment' | 'message') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create different tones for different notification types
    const frequency = type === 'message' ? 800 : type === 'appointment' ? 600 : 700;
    const duration = 0.3;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Create a pleasant notification sound with fade in/out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('Could not play fallback notification sound');
  }
};

export function AdminNotificationProvider({ children }: { children: ReactNode }) {
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newCoachApplicationsCount, setNewCoachApplicationsCount] = useState(0);
  const [newAppointmentsCount, setNewAppointmentsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  
  // Display counts (after accounting for read status)
  const [displayNewUsersCount, setDisplayNewUsersCount] = useState(0);
  const [displayNewCoachApplicationsCount, setDisplayNewCoachApplicationsCount] = useState(0);
  const [displayNewAppointmentsCount, setDisplayNewAppointmentsCount] = useState(0);
  const [displayNewMessagesCount, setDisplayNewMessagesCount] = useState(0);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }

    // Initialize Socket.IO connection
    const API_URL = getApiUrl();
    const socketConnection = io(API_URL, {
      transports: ['websocket'],
      auth: { token: `Bearer ${localStorage.getItem('token')}` }
    });

    socketConnection.on('connect', () => {
      console.log('Socket.IO connected for admin notifications');
    });

    // Listen for new user registrations (clients)
    socketConnection.on('admin:new_client', (data: any) => {
      // Play notification sound
      try {
        const audio = new Audio('/sounds/user.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          playFallbackSound('user');
        });
      } catch (error) {
        playFallbackSound('user');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 shadow-xl border border-blue-200 dark:border-blue-700/50 overflow-hidden">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-lg animate-bounce">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    New Client Registration
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.name || 'New Client'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Just now</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                A new client has registered and needs approval.
              </div>
              
              <button
                onClick={() => {
                  window.location.href = '/admin/users';
                }}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all transform hover:scale-105 shadow-md"
              >
                <Users className="w-3 h-3 mr-1" />
                Manage Users
              </button>
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 7000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          className: "!p-0 !bg-transparent !shadow-none",
        }
      );
      
      setNewUsersCount(prev => prev + 1);
    });

    // Listen for new coach applications
    socketConnection.on('admin:new_coach', (data: any) => {
      // Play notification sound
      try {
        const audio = new Audio('/sounds/user.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          playFallbackSound('user');
        });
      } catch (error) {
        playFallbackSound('user');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 shadow-xl border border-purple-200 dark:border-purple-700/50 overflow-hidden">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center shadow-lg animate-bounce">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    New Coach Application
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.name || 'New Coach'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Just now</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                A new coach application requires review and approval.
              </div>
              
              <button
                onClick={() => {
                  window.location.href = '/admin/coach-applications';
                }}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-purple-500 hover:bg-purple-600 text-white transition-all transform hover:scale-105 shadow-md"
              >
                <Shield className="w-3 h-3 mr-1" />
                Review Application
              </button>
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 7000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          className: "!p-0 !bg-transparent !shadow-none",
        }
      );
      
      setNewUsersCount(prev => prev + 1);
    });

    // Listen for new appointments that need admin attention
    socketConnection.on('admin:new_appointment', (data: any) => {
      // Play notification sound
      try {
        const audio = new Audio('/sounds/appointment.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          playFallbackSound('appointment');
        });
      } catch (error) {
        playFallbackSound('appointment');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 shadow-xl border border-green-200 dark:border-green-700/50 overflow-hidden">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-lg animate-bounce">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    New Appointment Scheduled
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.client_name} with {data.coach_name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Just now</span>
                </div>
              </div>
              
              {data.starts_at && (
                <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {new Date(data.starts_at).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      at {new Date(data.starts_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  window.location.href = '/admin/appointments';
                }}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-green-500 hover:bg-green-600 text-white transition-all transform hover:scale-105 shadow-md"
              >
                <Calendar className="w-3 h-3 mr-1" />
                View Appointments
              </button>
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          className: "!p-0 !bg-transparent !shadow-none",
        }
      );
      
      setNewAppointmentsCount(prev => prev + 1);
    });

    // Listen for appointment status changes
    socketConnection.on('admin:appointment_confirmed', (data: any) => {
      try {
        const audio = new Audio('/sounds/appointment.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => playFallbackSound('appointment'));
      } catch (error) {
        playFallbackSound('appointment');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 shadow-xl border border-blue-200 dark:border-blue-700/50">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Appointment Confirmed</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {data.client_name} with {data.coach_name}
              </div>
            </div>
          </div>
        </div>,
        { position: "top-right", autoClose: 5000 }
      );
    });

    socketConnection.on('admin:appointment_completed', (data: any) => {
      try {
        const audio = new Audio('/sounds/appointment.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => playFallbackSound('appointment'));
      } catch (error) {
        playFallbackSound('appointment');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 shadow-xl border border-green-200 dark:border-green-700/50">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Session Completed</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {data.client_name} with {data.coach_name}
              </div>
            </div>
          </div>
        </div>,
        { position: "top-right", autoClose: 5000 }
      );
    });

    socketConnection.on('admin:appointment_rescheduled', (data: any) => {
      try {
        const audio = new Audio('/sounds/appointment.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => playFallbackSound('appointment'));
      } catch (error) {
        playFallbackSound('appointment');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg p-4 shadow-xl border border-yellow-200 dark:border-yellow-700/50">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Appointment Rescheduled</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {data.client_name} with {data.coach_name}
              </div>
              {data.reason && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Reason: {data.reason}
                </div>
              )}
            </div>
          </div>
        </div>,
        { position: "top-right", autoClose: 6000 }
      );
    });

    socketConnection.on('admin:appointment_cancelled', (data: any) => {
      try {
        const audio = new Audio('/sounds/appointment.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => playFallbackSound('appointment'));
      } catch (error) {
        playFallbackSound('appointment');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-4 shadow-xl border border-red-200 dark:border-red-700/50">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Appointment Cancelled</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {data.client_name} with {data.coach_name}
              </div>
              {data.reason && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Reason: {data.reason}
                </div>
              )}
            </div>
          </div>
        </div>,
        { position: "top-right", autoClose: 6000 }
      );
    });

    // Listen for system messages that need admin attention
    socketConnection.on('admin:system_message', (data: any) => {
      // Play notification sound
      try {
        const audio = new Audio('/sounds/message.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          playFallbackSound('message');
        });
      } catch (error) {
        playFallbackSound('message');
      }
      
      toast(
        <div className="relative w-full bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-4 shadow-xl border border-orange-200 dark:border-orange-700/50 overflow-hidden">
          <div className="relative flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-orange-500 dark:bg-orange-600 flex items-center justify-center shadow-lg animate-bounce">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    System Alert
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Bell className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.type || 'System'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Just now</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                {data.message || 'System requires attention'}
              </div>
              
              <button
                onClick={() => {
                  window.location.href = '/admin/settings';
                }}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all transform hover:scale-105 shadow-md"
              >
                <Bell className="w-3 h-3 mr-1" />
                View Details
              </button>
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          className: "!p-0 !bg-transparent !shadow-none",
        }
      );
      
      setNewMessagesCount(prev => prev + 1);
    });

    socketConnection.on('disconnect', () => {
      console.log('Admin Socket.IO disconnected');
    });

    socketConnection.on('connect_error', (error) => {
      console.warn('Admin Socket.IO connection error:', error);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.close();
    };
  }, [isAuthenticated, user]);

  const markNewUsersAsRead = () => {
    setLastReadTimestamp('users');
    setDisplayNewUsersCount(0);
  };

  const markNewCoachApplicationsAsRead = () => {
    setLastReadTimestamp('coach_applications');
    setDisplayNewCoachApplicationsCount(0);
  };

  const markNewAppointmentsAsRead = () => {
    setLastReadTimestamp('appointments');
    setDisplayNewAppointmentsCount(0);
  };

  const markNewMessagesAsRead = () => {
    setLastReadTimestamp('messages');
    setDisplayNewMessagesCount(0);
  };

  // Helper functions to manage read status in localStorage
  const getLastReadTimestamp = (key: string): string | null => {
    return localStorage.getItem(`admin_last_read_${key}`);
  };

  const setLastReadTimestamp = (key: string) => {
    localStorage.setItem(`admin_last_read_${key}`, new Date().toISOString());
  };

  const updateDisplayCounts = (users: number, coaches: number, appointments: number, messages: number, timestamp: string) => {
    const lastReadUsers = getLastReadTimestamp('users');
    const lastReadCoachApplications = getLastReadTimestamp('coach_applications');
    const lastReadAppointments = getLastReadTimestamp('appointments');
    const lastReadMessages = getLastReadTimestamp('messages');

    // Only show counts for items newer than last read time
    setDisplayNewUsersCount(lastReadUsers && lastReadUsers >= timestamp ? 0 : users);
    setDisplayNewCoachApplicationsCount(lastReadCoachApplications && lastReadCoachApplications >= timestamp ? 0 : coaches);
    setDisplayNewAppointmentsCount(lastReadAppointments && lastReadAppointments >= timestamp ? 0 : appointments);
    setDisplayNewMessagesCount(lastReadMessages && lastReadMessages >= timestamp ? 0 : messages);
  };

  const refreshCounts = async () => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;

    try {
      const apiUrl = getApiUrl();
      
      // Fetch current unread counts from the API
      const response = await fetch(`${apiUrl}/api/admin/notification-counts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.newClients || 0;  // Only client registrations
        const coaches = data.newCoaches || 0;  // Only coach applications
        const appointments = data.newAppointments || 0;
        const messages = data.systemMessages || 0;
        const timestamp = data.timestamp || new Date().toISOString();
        
        setNewUsersCount(users);
        setNewCoachApplicationsCount(coaches);
        setNewAppointmentsCount(appointments);
        setNewMessagesCount(messages);
        
        // Update display counts based on read status
        updateDisplayCounts(users, coaches, appointments, messages, timestamp);
      }
    } catch (error) {
      console.error('Error fetching admin notification counts:', error);
    }
  };

  // Initial count refresh on mount
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'admin') {
      refreshCounts();
    }
  }, [isAuthenticated, user]);

  return (
    <AdminNotificationContext.Provider 
      value={{
        newUsersCount,
        newCoachApplicationsCount,
        newAppointmentsCount,
        newMessagesCount,
        displayNewUsersCount,
        displayNewCoachApplicationsCount,
        displayNewAppointmentsCount,
        displayNewMessagesCount,
        markNewUsersAsRead,
        markNewCoachApplicationsAsRead,
        markNewAppointmentsAsRead,
        markNewMessagesAsRead,
        refreshCounts
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
}