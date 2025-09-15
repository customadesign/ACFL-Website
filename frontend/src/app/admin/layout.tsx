'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { getApiUrl } from '@/lib/api';
import NotificationBadge from '@/components/NotificationBadge';
import ThemeConsentModal from '@/components/ThemeConsentModal';
import {
  Users,
  UserCheck,
  User,
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
  MoreHorizontal,
  DollarSign,
  Type
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
  const bottomNavMoreRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading, logout } = useAuth();
  const { hasPermission, isAdmin, isStaff } = usePermissions();
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
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Admin theme management with localStorage integration
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hasStorageConsent, setHasStorageConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Check if user has already given consent
    const storageConsent = localStorage.getItem('theme-storage-consent');
    
    if (storageConsent === 'granted') {
      setHasStorageConsent(true);
      // Get saved theme
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      const initialTheme = (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) ? savedTheme : 'light';
      setTheme(initialTheme);
      // Apply theme to DOM
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(initialTheme);
      console.log('Admin theme initialized to:', initialTheme, '(consent granted)');
    } else if (storageConsent === 'denied') {
      setHasStorageConsent(false);
      // Use light theme without saving
      setTheme('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      console.log('Admin theme initialized to: light (consent denied)');
    } else {
      // No consent recorded yet - use system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(initialTheme);
      console.log('Admin theme initialized to:', initialTheme, '(no consent yet)');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Apply theme to DOM immediately
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
    
    // Check if we have storage consent
    const storageConsent = localStorage.getItem('theme-storage-consent');
    
    if (storageConsent === 'granted') {
      // Save to localStorage if consent granted
      localStorage.setItem('theme', newTheme);
      console.log('Admin theme changed to:', newTheme, '- saved to localStorage');
    } else if (storageConsent === null) {
      // No consent yet - show modal
      setShowConsentModal(true);
      console.log('Admin theme changed to:', newTheme, '- showing consent modal');
    } else {
      // Consent denied - theme will reset on refresh
      console.log('Admin theme changed to:', newTheme, '- not saved (consent denied)');
    }
    
    // Update state after DOM changes
    setTheme(newTheme);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      const isInsideMobileDropdown = mobileDropdownRef.current && mobileDropdownRef.current.contains(target);
      
      if (!isInsideDropdown && !isInsideMobileDropdown) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
      if (bottomNavMoreRef.current && !bottomNavMoreRef.current.contains(event.target as Node)) {
        setShowBottomNavMore(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

  const handleConsentAccept = () => {
    localStorage.setItem('theme-storage-consent', 'granted');
    localStorage.setItem('theme', theme);
    setHasStorageConsent(true);
    setShowConsentModal(false);
    console.log('Storage consent granted - theme saved');
  };

  const handleConsentDecline = () => {
    localStorage.setItem('theme-storage-consent', 'denied');
    setHasStorageConsent(false);
    setShowConsentModal(false);
    console.log('Storage consent denied - theme not saved');
  };

  const handleThemeToggle = (e: React.MouseEvent) => {
    console.log('Theme toggle clicked!');
    e.preventDefault();
    e.stopPropagation();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Changing theme from', theme, 'to', newTheme);
    toggleTheme();
    setShowDropdown(false);
    
    // Show user-friendly notification with a small delay to ensure theme has been applied
    setTimeout(() => {
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
    }, 100);
  };

  // Handle admin authentication using AuthContext
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
        return;
      }

      if (user.role !== 'admin' && user.role !== 'staff') {
        // Not an admin or staff, redirect to appropriate dashboard
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
    console.log('Admin logout clicked');
    setShowDropdown(false);
    try {
      await logout();
      console.log('Admin logout completed');
    } catch (error) {
      console.error('Admin logout error:', error);
    }
  };

  const allNavItems = [
    { name: 'Dashboard', href: '/admin', icon: Home, permission: null }, // Always visible
    { name: 'Users', href: '/admin/users', icon: Users, notificationCount: displayNewUsersCount, permission: PERMISSIONS.USERS_VIEW },
    { name: 'Coach Applications', href: '/admin/coach-applications', icon: FileText, notificationCount: displayNewCoachApplicationsCount, permission: PERMISSIONS.USERS_VIEW },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar, notificationCount: displayNewAppointmentsCount, permission: PERMISSIONS.APPOINTMENTS_VIEW },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare, notificationCount: displayNewMessagesCount, permission: PERMISSIONS.MESSAGES_VIEW },
    { name: 'Content', href: '/admin/content', icon: Type, permission: PERMISSIONS.CONTENT_VIEW },
    { name: 'Financials', href: '/admin/financials', icon: DollarSign, permission: PERMISSIONS.FINANCIAL_VIEW },
    { name: 'Staff Capabilities', href: '/admin/staff-capabilities', icon: Shield, permission: null, adminOnly: true },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
    { name: 'Profile', href: '/admin/profile', icon: User, permission: null, staffOnly: true }, // Staff profile - moved to last
    { name: 'Settings', href: '/admin/settings', icon: Settings, permission: null, adminOnly: true },
  ];

  // Filter navigation items based on permissions
  const navItems = allNavItems.filter(item => {
    // Admin-only items
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    // Staff-only items
    if (item.staffOnly && !isStaff) {
      return false;
    }
    // Items with permission requirements
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    // Always show items with no permission requirement (like Dashboard)
    return true;
  });

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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
                ACT Coaching For Life - {user?.role === 'staff' ? 'Staff Portal' : 'Admin'}
              </h1>
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
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[55] border border-gray-200 dark:border-gray-600">
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
                  <div className="hidden sm:block absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-600">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name || 'Admin'} {user?.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.role === 'staff' ? 'Staff Member' : 'Administrator'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleThemeToggle(e)}
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
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
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={handleLogout}
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
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                
                {/* Mobile Notification Dropdown */}
                {showNotificationDropdown && (
                  <>
                    {/* Mobile backdrop */}
                    <div
                      className="sm:hidden fixed inset-0 bg-black/20 z-[55]"
                      onClick={() => setShowNotificationDropdown(false)}
                    />
                    <div className="sm:hidden fixed right-4 top-16 left-4 bg-white dark:bg-gray-800 rounded-md shadow-xl z-[65] border border-gray-200 dark:border-gray-600 max-h-[70vh] overflow-y-auto">
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
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded"
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
                                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 text-sm font-medium px-3 py-1 rounded"
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
                                  className="text-green-600 dark:text-green-400 hover:text-green-700 text-sm font-medium px-3 py-1 rounded"
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
                                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 text-sm font-medium px-3 py-1 rounded"
                                >
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="User menu"
                >
                  <CircleUserRound className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop for mobile dropdown */}
          <div
            className="sm:hidden fixed inset-0 bg-black/20 z-[60]"
            onClick={() => setShowDropdown(false)}
          />
          <div className="sm:hidden fixed right-4 top-16 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl py-1 z-[70] border border-gray-200 dark:border-gray-600">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.first_name || 'Admin'} {user?.last_name || ''}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role === 'staff' ? 'Staff Member' : 'Administrator'}
              </p>
            </div>
            <button
              onClick={(e) => handleThemeToggle(e)}
              type="button"
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
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
            <hr className="my-1 border-gray-200 dark:border-gray-600" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
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
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {user?.role === 'staff' ? 'Staff Portal' : 'Admin Panel'}
                  </span>
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

      {/* Theme Storage Consent Modal */}
      <ThemeConsentModal
        isOpen={showConsentModal}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </div>
  );
}