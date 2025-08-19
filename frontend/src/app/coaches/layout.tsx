'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/NotificationBadge';
import Footer from '@/components/Footer';
import { Bell } from 'lucide-react';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadMessageCount, appointmentNotificationCount, markMessagesAsRead, markAppointmentsAsRead } = useNotifications();

  const navItems = [
    { name: 'Dashboard', href: '/coaches' },
    { 
      name: 'Appointments', 
      href: '/coaches/appointments',
      notificationCount: appointmentNotificationCount 
    },
    { 
      name: 'Messages', 
      href: '/coaches/messages',
      notificationCount: unreadMessageCount 
    },
    { name: 'My Clients', href: '/coaches/clients' },
    { name: 'Profile', href: '/coaches/profile' },
  ];

  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                  alt="ACT Coaching For Life Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-semibold text-gray-900">ACT Coaching For Life - Coach Dashboard</h1>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome back, {user?.firstName || 'Coach'}!
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Mark notifications as read when navigating to respective pages
                    if (item.href === '/coaches/messages') {
                      markMessagesAsRead();
                    } else if (item.href === '/coaches/appointments') {
                      markAppointmentsAsRead();
                    }
                  }}
                  className={`relative py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    pathname === item.href
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="relative inline-block">
                    {item.name}
                    {item.notificationCount !== undefined && (
                      <NotificationBadge 
                        count={item.notificationCount}
                        maxCount={99}
                        size="md"
                        variant={item.href.includes('messages') ? 'blue' : 'red'}
                      />
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}