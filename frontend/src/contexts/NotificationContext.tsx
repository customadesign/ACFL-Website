'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { MessageCircle, Calendar, Bell } from 'lucide-react';

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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Initialize WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:${process.env.NODE_ENV === 'production' ? 443 : 4000}/ws`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for notifications');
      // Send authentication
      ws.send(JSON.stringify({
        type: 'auth',
        token: localStorage.getItem('token')
      }));
      
      // Join user-specific room
      ws.send(JSON.stringify({
        type: 'join_room',
        room: `user_${user.id}`
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NotificationData;
        handleNotification(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (isAuthenticated && user) {
          // Recreate connection
        }
      }, 3000);
    };

    ws.onerror = () => {
      console.warn('WebSocket connection error occurred');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [isAuthenticated, user]);

  const handleNotification = (notification: NotificationData) => {
    if (notification.type === 'message') {
      setUnreadMessageCount(prev => prev + 1);
      
      // Show toast notification
      toast.info(
        <div className="flex items-start space-x-3">
          <MessageCircle className="w-5 h-5 text-blue-500 mt-1" />
          <div>
            <div className="font-medium">{notification.senderName || 'New Message'}</div>
            <div className="text-sm text-gray-600">{notification.content}</div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } else if (notification.type === 'appointment') {
      setAppointmentNotificationCount(prev => prev + 1);
      
      // Show toast notification
      toast.info(
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-green-500 mt-1" />
          <div>
            <div className="font-medium">{notification.title}</div>
            <div className="text-sm text-gray-600">{notification.content}</div>
            {notification.appointmentTime && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(notification.appointmentTime).toLocaleString()}
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
        }
      );
    }
  };

  const markMessagesAsRead = () => {
    setUnreadMessageCount(0);
  };

  const markAppointmentsAsRead = () => {
    setAppointmentNotificationCount(0);
  };

  const refreshCounts = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://therapist-matcher-backend.onrender.com'
        : 'http://localhost:3001';
      
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