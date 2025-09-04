'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';
import { getApiUrl } from '@/lib/api';
import NotificationBadge from '@/components/NotificationBadge';
import {
  Users,
  UserCheck,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Home,
  CircleUserRound,
  FileText,
  Moon,
  Sun,
  Bell,
  MoreHorizontal
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showBottomNavMore, setShowBottomNavMore] = useState(false);
  const [themeToggleLoading, setThemeToggleLoading] = useState(false);
  const bottomNavMoreRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    displayNewUsersCount,
    displayNewCoachApplicationsCount, 
    displayNewAppointmentsCount, 
    displayNewMessagesCount,
    markNewUsersAsRead,
    markNewCoachApplicationsAsRead,
    markNewAppointmentsAsRead,
    markNewMessagesAsRead 
  } = useAdminNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Theme context with safety check for SSR
  let theme: 'light' | 'dark' = 'light';
  let toggleTheme: () => void = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    console.warn('ThemeProvider not available, using fallback theme state');
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
      if (bottomNavMoreRef.current && !bottomNavMoreRef.current.contains(event.target as Node)) {
        setShowBottomNavMore(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear notification counts when visiting specific pages
  useEffect(() => {
    if (pathname === '/admin/users') {
      markNewUsersAsRead();
    }
    if (pathname === '/admin/coach-applications') {
      markNewCoachApplicationsAsRead();
    }
    if (pathname === '/admin/appointments') {
      markNewAppointmentsAsRead();
    }
    if (pathname === '/admin/messages') {
      markNewMessagesAsRead();
    }
  }, [pathname, markNewUsersAsRead, markNewCoachApplicationsAsRead, markNewAppointmentsAsRead, markNewMessagesAsRead]);

  const handleThemeToggle = async () => {
    setThemeToggleLoading(true);
    
    // Add haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 150));
    
    toggleTheme();
    setThemeToggleLoading(false);
    
    // Close dropdown after a short delay to allow user to see the change
    setTimeout(() => {
      setShowDropdown(false);
    }, 300);
  };

  // Handle admin authentication using AuthContext
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
        return;
      }

      if (user.role !== 'admin') {
        // Not an admin, redirect to appropriate dashboard
        if (user.role === 'client') {
          router.replace('/clients');
        } else if (user.role === 'coach') {
          router.replace('/coaches');
        } else {
          router.replace('/login');
        }
        return;
      }

      // Admin user is authenticated
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    console.log('🔓 Admin logout initiated...');
    try {
      // Use the logout function from AuthContext
      // This will handle token removal and user state cleanup
      await logout();
      console.log('✅ Admin logout completed');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout fails, redirect to login page
      router.push('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users, notificationCount: displayNewUsersCount },
    { name: 'Coach Applications', href: '/admin/coach-applications', icon: FileText, notificationCount: displayNewCoachApplicationsCount },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar, notificationCount: displayNewAppointmentsCount },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare, notificationCount: displayNewMessagesCount },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
              </button>
              
              <img 
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                alt="ACFL Logo" 
                className="h-8 sm:h-10 w-auto"
              />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">ACT Coaching For Life - Admin</h1>
            </div>
            
            {/* Desktop user menu */}
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user?.first_name || 'Admin'}!
              </span>
              
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  {(displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount) > 0 && (
                    <NotificationBadge 
                      count={displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount}
                      size="sm"
                      variant="red"
                    />
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-600">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Notifications</h3>
                      
                      {(displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount) === 0 ? (
                        <div className="text-center py-8">
                          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">No new notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {displayNewUsersCount > 0 && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">New Users</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{displayNewUsersCount} new registrations</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  router.push('/admin/users');
                                  setShowNotificationDropdown(false);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium"
                              >
                                View
                              </button>
                            </div>
                          )}

                          {displayNewCoachApplicationsCount > 0 && (
                            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Coach Applications</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{displayNewCoachApplicationsCount} new applications</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  router.push('/admin/coach-applications');
                                  setShowNotificationDropdown(false);
                                }}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 text-sm font-medium"
                              >
                                View
                              </button>
                            </div>
                          )}
                          
                          {displayNewAppointmentsCount > 0 && (
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">New Appointments</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{displayNewAppointmentsCount} new bookings</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  router.push('/admin/appointments');
                                  setShowNotificationDropdown(false);
                                }}
                                className="text-green-600 dark:text-green-400 hover:text-green-700 text-sm font-medium"
                              >
                                View
                              </button>
                            </div>
                          )}
                          
                          {displayNewMessagesCount > 0 && (
                            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">System Messages</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{displayNewMessagesCount} new messages</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  router.push('/admin/messages');
                                  setShowNotificationDropdown(false);
                                }}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 text-sm font-medium"
                              >
                                View
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="User menu"
                >
                  <CircleUserRound className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-600">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name || 'Admin'} {user?.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                    </div>
                    <button
                      onClick={handleThemeToggle}
                      disabled={themeToggleLoading}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {themeToggleLoading ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                          <span>Switching...</span>
                        </>
                      ) : theme === 'light' ? (
                        <>
                          <Moon className="w-4 h-4 transition-transform hover:scale-110" />
                          <span>Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4 transition-transform hover:scale-110" />
                          <span>Light Mode</span>
                        </>
                      )}
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={async () => {
                        setShowDropdown(false);
                        await handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile user menu button */}
            <div className="sm:hidden flex items-center space-x-2">
              {/* Mobile Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  {(displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount) > 0 && (
                    <NotificationBadge 
                      count={displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount}
                      size="sm"
                      variant="red"
                    />
                  )}
                </button>
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="User menu"
                >
                  <CircleUserRound className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu - positioned absolutely */}
      {showDropdown && (
        <>
          {/* Enhanced backdrop for mobile dropdown with smooth animation */}
          <div 
            className="sm:hidden fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDropdown(false)}
          />
          <div 
            key={`dropdown-${theme}-${themeToggleLoading}`} 
            className="sm:hidden absolute right-4 top-16 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-200 dark:border-gray-600 animate-in slide-in-from-top-2 fade-in duration-300"
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <CircleUserRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.first_name || 'Admin'} {user?.last_name || ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                </div>
              </div>
            </div>
            
            {/* Theme Toggle Button with enhanced mobile UX */}
            <div className="px-2 py-1">
              <button
                onClick={handleThemeToggle}
                disabled={themeToggleLoading}
                className={`w-full px-4 py-3 text-left text-sm rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                  themeToggleLoading 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-not-allowed opacity-75' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95'
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-600">
                  {themeToggleLoading ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  ) : theme === 'light' ? (
                    <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform" />
                  ) : (
                    <Sun className="w-4 h-4 text-yellow-500 transition-transform" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {themeToggleLoading ? 'Switching Theme...' : theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {themeToggleLoading ? 'Please wait' : theme === 'light' ? 'Better for low light' : 'Easier on the eyes'}
                  </div>
                </div>
                {!themeToggleLoading && (
                  <div className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-gray-400' : 'bg-yellow-400'} animate-pulse`} />
                )}
              </button>
            </div>
            
            <hr className="my-2 border-gray-100 dark:border-gray-700" />
            
            {/* Logout Button */}
            <div className="px-2 py-1">
              <button
                onClick={async () => {
                  setShowDropdown(false);
                  // Add small delay to allow dropdown to close smoothly
                  await new Promise(resolve => setTimeout(resolve, 150));
                  await handleLogout();
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-3 transition-all duration-200 active:scale-95"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs text-red-500 dark:text-red-400">End your session</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Navigation */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  pathname === item.href
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="relative inline-block">
                  {item.name}
                  {(item.notificationCount ?? 0) > 0 && (
                    <NotificationBadge 
                      count={item.notificationCount!}
                      size="sm"
                      variant="red"
                      className="ml-1"
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
            className="sm:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="sm:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img 
                    src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                    alt="ACFL Logo" 
                    className="h-8 w-auto"
                  />
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Admin Panel</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                          pathname === item.href
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1">{item.name}</span>
                        {(item.notificationCount ?? 0) > 0 && (
                          <NotificationBadge 
                            count={item.notificationCount!}
                            size="sm"
                            variant="red"
                          />
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

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="grid grid-cols-4 gap-1">
          {/* First 3 navigation items */}
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 relative transition-colors min-h-[60px] ${
                  pathname === item.href
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {(item.notificationCount ?? 0) > 0 && (
                    <NotificationBadge 
                      count={item.notificationCount!}
                      size="sm"
                      variant="red"
                    />
                  )}
                </div>
                <span className="text-[10px] mt-1 leading-3 text-center">
                  {item.name.length > 8 ? item.name.split(' ')[0] : item.name}
                </span>
              </Link>
            );
          })}
          
          {/* More menu for remaining items */}
          <div className="relative" ref={bottomNavMoreRef}>
            <button
              onClick={() => setShowBottomNavMore(!showBottomNavMore)}
              className={`flex flex-col items-center justify-center py-2 px-1 w-full min-h-[60px] transition-colors ${
                showBottomNavMore || navItems.slice(3).some(item => pathname === item.href)
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <MoreHorizontal className="w-5 h-5" />
                {/* Show notification badge if any of the hidden items have notifications */}
                {navItems.slice(3).some(item => (item.notificationCount ?? 0) > 0) && (
                  <NotificationBadge 
                    count={navItems.slice(3).reduce((total, item) => total + (item.notificationCount ?? 0), 0)}
                    size="sm"
                    variant="red"
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 leading-3 text-center">More</span>
            </button>
            
            {/* More menu dropdown */}
            {showBottomNavMore && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
                  onClick={() => setShowBottomNavMore(false)}
                />
                {/* Dropdown */}
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 py-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">More Options</p>
                  </div>
                  {navItems.slice(3).map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setShowBottomNavMore(false)}
                        className={`flex items-center space-x-3 px-4 py-3 mx-1 rounded-lg transition-all duration-200 hover:scale-[0.98] ${
                          pathname === item.href
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-sm font-medium">{item.name}</span>
                        {(item.notificationCount ?? 0) > 0 && (
                          <NotificationBadge 
                            count={item.notificationCount!}
                            size="sm"
                            variant="red"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-[72px] sm:pb-0">
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}