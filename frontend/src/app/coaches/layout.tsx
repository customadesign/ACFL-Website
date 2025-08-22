'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/NotificationBadge';
import Footer from '@/components/Footer';
import { Bell, CircleUserRound, LogOut, Sun, Moon } from 'lucide-react';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadMessageCount, appointmentNotificationCount, markMessagesAsRead, markAppointmentsAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                  alt="ACT Coaching For Life Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-semibold text-card-foreground">ACT Coaching For Life</h1>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome back, {user?.first_name || 'Coach'}!
                </span>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 rounded-full hover:bg-accent transition-colors"
                    aria-label="User menu"
                  >
                    <CircleUserRound className="w-6 h-6 text-muted-foreground" />
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover rounded-md shadow-lg py-1 z-50 border border-border">
                      <button
                        onClick={toggleTheme}
                        className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent flex items-center space-x-2"
                      >
                        {theme === 'light' ? (
                          <>
                            <Moon className="w-4 h-4" />
                            <span>Dark Mode</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-4 h-4" />
                            <span>Light Mode</span>
                          </>
                        )}
                      </button>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
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
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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