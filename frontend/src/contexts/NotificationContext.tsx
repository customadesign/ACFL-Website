'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { MessageCircle, Calendar, Bell } from 'lucide-react';
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
        
        toast(
          <div className="flex items-start space-x-3 p-2">
            {/* Icon */}
            <div className="flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-1" />
            </div>
    
            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                {senderName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {msg.body}
              </div>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: "custom-toast",
          }
        );
        
        
        setUnreadMessageCount(prev => prev + 1);
      }
    });

    // Listen for new appointments
    socketConnection.on('appointment:new', (data: any) => {
      toast.success(
        <div className="flex items-start space-x-3 p-2">
          <div className="flex-shrink-0">
            <Calendar className="w-5 h-5 text-green-500 dark:text-green-400 mt-1" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {user?.role === 'coach' 
                ? (data.client_name ? `Appointment with ${data.client_name}` : 'New appointment received')
                : (data.coach_name ? `Appointment with ${data.coach_name}` : 'New appointment confirmed')
              }
            </div>
            {data.starts_at && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                <Bell className="w-3 h-3 mr-1" />
                {new Date(data.starts_at).toLocaleDateString()} at {new Date(data.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: "custom-toast",
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