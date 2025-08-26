'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationBadge from '@/components/NotificationBadge';
import Footer from '@/components/Footer';
import { Bell, CircleUserRound, LogOut, Sun, Moon } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadMessageCount, appointmentNotificationCount, markMessagesAsRead, markAppointmentsAsRead } = useNotifications();
  
  // Add safety check for ThemeProvider during SSR
  let theme: 'light' | 'dark' = 'light';
  let toggleTheme: () => void = () => {};
  let hasStorageConsent = false;
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
    hasStorageConsent = themeContext.hasStorageConsent;
  } catch (error) {
    // ThemeProvider not available during SSR or initial render, use fallbacks
    console.warn('ThemeProvider not available, using fallback theme state');
  }
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    setShowDropdown(false);
    
    // Show user-friendly notification
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg shadow-lg z-[10000] max-w-sm';
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${newTheme === 'dark' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>'
          }
        </svg>
        <div>
          <div class="font-semibold">Theme changed to ${newTheme} mode!</div>
          ${hasStorageConsent 
            ? `<div class="text-sm">Your preference has been saved.</div>`
            : `<div class="text-sm">This will reset when you visit again.</div>`
          }
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  };

  const navItems = [
    { name: 'Dashboard', href: '/clients' },
    { name: 'Find Coaches', href: '/clients/search-coaches' },
    { 
      name: 'Appointments', 
      href: '/clients/appointments',
      notificationCount: appointmentNotificationCount 
    },
    { 
      name: 'Messages', 
      href: '/clients/messages',
      notificationCount: unreadMessageCount 
    },
    { name: 'Profile', href: '/clients/profile' },
  ];

  return (
    <ProtectedRoute allowedRoles={['client']}>
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
                  Welcome back, {user?.first_name || 'Client'}!
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
                        onClick={handleThemeToggle}
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
                    if (item.href === '/clients/messages') {
                      markMessagesAsRead();
                    } else if (item.href === '/clients/appointments') {
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