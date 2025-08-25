'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { MessageCircle, Calendar, Bell, User, Clock, X, Video, PhoneCall } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '@/lib/api';

interface NotificationContextType {
  unreadMessageCount: number;
  appointmentNotificationCount: number;
  markMessagesAsRead: () => void;
  markAppointmentsAsRead: () => void;
  refreshCounts: () => void;
}

interface NotificationData {
  type: 'message' | 'appointment';
  title: string;
  content: string;
  senderId?: string;
  senderName?: string;
  appointmentId?: string;
  appointmentTime?: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Function to play fallback notification sounds using Web Audio API
const playFallbackSound = (type: 'message' | 'appointment') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create different tones for different notification types
    const frequency = type === 'message' ? 800 : 600; // Higher pitch for messages
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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [appointmentNotificationCount, setAppointmentNotificationCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Initialize Socket.IO connection
    const API_URL = getApiUrl();
    const socketConnection = io(API_URL, {
      transports: ['websocket'],
      auth: { token: `Bearer ${localStorage.getItem('token')}` }
    });

    socketConnection.on('connect', () => {
      console.log('Socket.IO connected for notifications');
    });

    // Listen for new messages
    socketConnection.on('message:new', (msg: any) => {
      // Only show notification if message is not from current user
      if (msg.sender_id !== user?.id) {
        const senderName = msg.sender_name || (user.role === 'coach' ? 'Client' : 'Coach');
        
        // Play notification sound
        try {
          const audio = new Audio('/sounds/message.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {
            // Fallback to a proper beep sound if custom sound fails
            playFallbackSound('message');
          });
        } catch (error) {
          console.log('Could not play notification sound');
          playFallbackSound('message');
        }
        
        toast(
          <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 shadow-xl border border-blue-200 dark:border-blue-700/50 overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
            
            <div className="relative flex items-start space-x-3">
              {/* Icon with animation */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-lg animate-bounce">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
      
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      New Message
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {senderName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Just now</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2 font-medium">
                  {msg.body}
                </div>
                
                <button
                  onClick={() => {
                    window.location.href = user.role === 'coach' ? '/coaches/messages' : '/clients/messages';
                  }}
                  className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all transform hover:scale-105 shadow-md"
                >
                  View Message
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
        
        
        setUnreadMessageCount(prev => prev + 1);
      }
    });

    // Listen for new appointments
    socketConnection.on('appointment:new', (data: any) => {
      // Play notification sound
      try {
        const audio = new Audio('/sounds/appointment.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Fallback to a proper beep sound if custom sound fails
          playFallbackSound('appointment');
        });
      } catch (error) {
        console.log('Could not play notification sound');
        playFallbackSound('appointment');
      }
      
      const appointmentWith = user?.role === 'coach' 
        ? (data.client_name || 'Client')
        : (data.coach_name || 'Coach');
      
      toast(
        <div className="relative bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 shadow-xl border border-green-200 dark:border-green-700/50 overflow-hidden">
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
          
          <div className="relative flex items-start space-x-3">
            {/* Icon with animation */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-lg animate-bounce">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    New Appointment
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      with {appointmentWith}
                    </span>
                  </div>
                </div>
              </div>
              
              {data.starts_at && (
                <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <Clock className="w-4 h-4" />
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
              
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    window.location.href = user.role === 'coach' ? '/coaches/appointments' : '/clients/appointments';
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-green-500 hover:bg-green-600 text-white transition-all transform hover:scale-105 shadow-md"
                >
                  View Details
                </button>
                <button
                  onClick={() => toast.dismiss()}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Confirmed
              </span>
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
      
      setAppointmentNotificationCount(prev => prev + 1);
    });

    socketConnection.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    socketConnection.on('connect_error', (error) => {
      console.warn('Socket.IO connection error:', error);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.close();
    };
  }, [isAuthenticated, user]);


  const markMessagesAsRead = () => {
    setUnreadMessageCount(0);
  };

  const markAppointmentsAsRead = () => {
    setAppointmentNotificationCount(0);
  };

  const refreshCounts = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const apiUrl = getApiUrl();
      
      // Fetch current unread counts from the API
      const response = await fetch(`${apiUrl}/api/notifications/counts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadMessageCount(data.unreadMessages || 0);
        setAppointmentNotificationCount(data.appointmentNotifications || 0);
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  // Initial count refresh on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCounts();
    }
  }, [isAuthenticated, user]);

  return (
    <NotificationContext.Provider 
      value={{
        unreadMessageCount,
        appointmentNotificationCount,
        markMessagesAsRead,
        markAppointmentsAsRead,
        refreshCounts
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}