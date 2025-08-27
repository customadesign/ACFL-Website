'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMeeting } from '@/contexts/MeetingContext';
import NotificationBadge from '@/components/NotificationBadge';
import Footer from '@/components/Footer';
import { Bell, CircleUserRound, LogOut, Sun, Moon, Menu, X, Home, Calendar, MessageSquare, UserSearch, User } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadMessageCount, appointmentNotificationCount, markMessagesAsRead, markAppointmentsAsRead } = useNotifications();
  const { isInMeeting } = useMeeting();
  
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    { name: 'Dashboard', href: '/clients', icon: Home },
    { name: 'Find Coaches', href: '/clients/search-coaches', icon: UserSearch },
    { 
      name: 'Appointments', 
      href: '/clients/appointments',
      notificationCount: appointmentNotificationCount,
      icon: Calendar
    },
    { 
      name: 'Messages', 
      href: '/clients/messages',
      notificationCount: unreadMessageCount,
      icon: MessageSquare
    },
    { name: 'Profile', href: '/clients/profile', icon: User },
  ];

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 rounded-md hover:bg-accent transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                
                <img 
                  src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                  alt="ACT Coaching For Life Logo" 
                  className="h-8 sm:h-10 w-auto"
                />
                <h1 className="text-lg sm:text-xl font-semibold text-card-foreground hidden sm:block">ACT Coaching For Life</h1>
              </div>
              
              {/* Desktop user menu */}
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
              
              {/* Mobile user menu button */}
              <div className="sm:hidden flex items-center">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                  aria-label="User menu"
                >
                  <CircleUserRound className="w-6 h-6 text-muted-foreground" />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-4 top-16 w-48 bg-popover rounded-md shadow-lg py-1 z-50 border border-border">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-popover-foreground">
                        {user?.first_name || 'Client'}
                      </p>
                    </div>
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

        {/* Desktop Navigation */}
        <div className="hidden sm:block bg-card border-b border-border">
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <>
            <div 
              className="sm:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="sm:hidden fixed left-0 top-0 h-full w-64 bg-card shadow-xl z-50">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                      alt="ACT Logo" 
                      className="h-8 w-auto"
                    />
                    <span className="font-semibold text-sm">ACT Coaching</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            if (item.href === '/clients/messages') {
                              markMessagesAsRead();
                            } else if (item.href === '/clients/appointments') {
                              markAppointmentsAsRead();
                            }
                          }}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                            pathname === item.href
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="flex-1">{item.name}</span>
                          {item.notificationCount !== undefined && item.notificationCount > 0 && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.href.includes('messages') 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {item.notificationCount > 99 ? '99+' : item.notificationCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </>
        )}

        {/* Mobile Bottom Navigation - Hidden when in meeting */}
        {!isInMeeting && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
            <div className="grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (item.href === '/clients/messages') {
                      markMessagesAsRead();
                    } else if (item.href === '/clients/appointments') {
                      markAppointmentsAsRead();
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 relative ${
                    pathname === item.href
                      ? 'text-blue-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.notificationCount !== undefined && item.notificationCount > 0 && (
                      <span className={`absolute -top-1 -right-1 w-4 h-4 text-[10px] font-medium rounded-full flex items-center justify-center ${
                        item.href.includes('messages') 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.notificationCount > 9 ? '9+' : item.notificationCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1">{item.name.split(' ')[0]}</span>
                </Link>
              );
            })}
            </div>
          </div>
        )}

        {/* Main Content - Adjust padding based on meeting state */}
        <div className={`flex-1 overflow-auto ${isInMeeting ? 'pb-0' : 'pb-16'} sm:pb-0`}>
          {children}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}