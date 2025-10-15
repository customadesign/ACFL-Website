'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useMeeting } from '@/contexts/MeetingContext';
import NotificationBadge from '@/components/NotificationBadge';
import Footer from '@/components/Footer';
import AdminImpersonationFloat from '@/components/AdminImpersonationFloat';
import DeactivatedAccountBanner from '@/components/DeactivatedAccountBanner';
import BankAccountSetupBanner from '@/components/coach/BankAccountSetupBanner';
import ThemeConsentModal from '@/components/ThemeConsentModal';
import {
  Bell, CircleUserRound, LogOut, Sun, Moon, Menu, X, Home, Calendar,
  MessageSquare, Users, User, MoreHorizontal, TrendingUp, CreditCard,
  CalendarDays, ChevronDown, ChevronRight, Search, PanelLeft, Settings,
  BarChart3, Clock, UserCog
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  notificationCount?: number;
}

interface NavigationGroup {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  items: NavigationItem[];
}

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadMessageCount, appointmentNotificationCount, markMessagesAsRead, markAppointmentsAsRead } = useNotifications();
  const { isInMeeting } = useMeeting();

  // Coach theme management with localStorage integration
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hasStorageConsent, setHasStorageConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<'light' | 'dark'>('light'); // Track the theme waiting for consent
  const [mounted, setMounted] = useState(false);

  // Layout states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showBottomNavOverflow, setShowBottomNavOverflow] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['dashboard', 'coaching']));
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null);

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);
  const bottomNavOverflowRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize theme from DOM and localStorage on mount
  useEffect(() => {
    setMounted(true);

    // Check if user has already given consent
    const storageConsent = localStorage.getItem('theme-storage-consent');

    // Get the current theme from DOM (set by ThemeScript)
    const currentDOMTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    if (storageConsent === 'granted') {
      setHasStorageConsent(true);
      // Use the theme that's already applied to the DOM by ThemeScript
      setTheme(currentDOMTheme);
      setPendingTheme(currentDOMTheme);
      console.log('Coach theme initialized to:', currentDOMTheme, '(consent granted, from DOM)');
    } else if (storageConsent === 'denied') {
      setHasStorageConsent(false);
      // Use the theme from DOM but don't save
      setTheme(currentDOMTheme);
      setPendingTheme(currentDOMTheme);
      console.log('Coach theme initialized to:', currentDOMTheme, '(consent denied, from DOM)');
    } else {
      // No consent recorded yet - use current DOM theme
      setTheme(currentDOMTheme);
      setPendingTheme(currentDOMTheme);
      console.log('Coach theme initialized to:', currentDOMTheme, '(no consent yet, from DOM)');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      const isInsideMobileDropdown = mobileDropdownRef.current && mobileDropdownRef.current.contains(target);

      if (!isInsideDropdown && !isInsideMobileDropdown) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node) &&
          mobileNotificationRef.current && !mobileNotificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
      if (bottomNavOverflowRef.current && !bottomNavOverflowRef.current.contains(event.target as Node)) {
        setShowBottomNavOverflow(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Clear notification counts when visiting specific pages
  useEffect(() => {
    if (pathname === '/coaches/messages') {
      markMessagesAsRead();
    }
    if (pathname === '/coaches/calendar') {
      markAppointmentsAsRead();
    }
  }, [pathname, markMessagesAsRead, markAppointmentsAsRead]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Update state and track pending theme
    setTheme(newTheme);
    setPendingTheme(newTheme);

    // Apply theme to DOM immediately
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);

    // Check if we have storage consent
    const storageConsent = localStorage.getItem('theme-storage-consent');

    if (storageConsent === 'granted') {
      // Save to localStorage if consent granted
      localStorage.setItem('theme', newTheme);
      console.log('Coach theme changed to:', newTheme, '- saved to localStorage');
    } else {
      // No consent yet OR consent denied - always show modal
      setShowConsentModal(true);
      console.log('Coach theme changed to:', newTheme, '- showing consent modal');
    }
  };

  const handleConsentAccept = () => {
    localStorage.setItem('theme-storage-consent', 'granted');
    localStorage.setItem('theme', pendingTheme);
    setHasStorageConsent(true);
    setShowConsentModal(false);
    console.log('Storage consent granted - theme saved:', pendingTheme);
  };

  const handleConsentDecline = () => {
    localStorage.setItem('theme-storage-consent', 'denied');
    setHasStorageConsent(false);
    setShowConsentModal(false);
    console.log('Storage consent denied - theme not saved');
  };

  const handleThemeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
    setShowDropdown(false);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationGroups: NavigationGroup[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      items: [
        { name: 'Overview', href: '/coaches', icon: Home },
      ]
    },
    {
      id: 'coaching',
      name: 'Coaching',
      icon: UserCog,
      items: [
        { name: 'Availability', href: '/coaches/availability', icon: Clock },
        { name: 'Calendar & Appointments', href: '/coaches/calendar', icon: CalendarDays, notificationCount: appointmentNotificationCount },
        { name: 'Messages', href: '/coaches/messages', icon: MessageSquare, notificationCount: unreadMessageCount },
        { name: 'Clients', href: '/coaches/clients', icon: Users },
      ]
    },
    {
      id: 'business',
      name: 'Business',
      icon: BarChart3,
      items: [
        { name: 'Billing & Earnings', href: '/coaches/billing', icon: CreditCard },
        { name: 'Revenue & Performance', href: '/coaches/revenue', icon: TrendingUp },
      ]
    },
    {
      id: 'account',
      name: 'Account',
      icon: User,
      items: [
        { name: 'Profile', href: '/coaches/profile', icon: User },
        { name: 'Settings', href: '/coaches/settings', icon: Settings },
      ]
    },
  ];

  // Helper functions for sidebar
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Filter items based on search query
  const filterItemsBySearch = (items: any[]) => {
    if (!searchQuery.trim()) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get total notification count for a group
  const getGroupNotificationCount = (groupItems: any[]) => {
    return groupItems.reduce((total, item) => total + (item.notificationCount ?? 0), 0);
  };

  // Handle hover for collapsed sidebar groups
  const handleGroupHover = (groupId: string, event: React.MouseEvent) => {
    if (!sidebarCollapsed) return;

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right + 4, // 4px gap from sidebar
      y: rect.top
    });
    setHoveredGroup(groupId);
  };

  const handleGroupLeave = () => {
    // Add a delay before hiding to allow user to move to the flyout
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredGroup(null);
      setHoverPosition(null);
    }, 100); // 100ms delay
  };

  const handleFlyoutEnter = () => {
    // Cancel the hide timeout when entering the flyout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleFlyoutLeave = () => {
    // Immediately hide when leaving the flyout
    setHoveredGroup(null);
    setHoverPosition(null);
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-x-hidden">
        {/* Admin Impersonation Float */}
        <AdminImpersonationFloat />

        {/* Collapsible Sidebar - Desktop */}
        {!isInMeeting && (
          <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-[10001] ${
            sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
          } transition-all duration-300 ease-in-out`}>
          <div className="flex grow flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Logo and collapse button */}
            <div className="flex h-16 shrink-0 items-center px-4 border-b border-gray-200 dark:border-gray-700">
              {!sidebarCollapsed && (
                <img
                  src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
                  alt="ACFL Logo"
                  className="h-8 w-auto mr-3"
                />
              )}
              {!sidebarCollapsed && (
                <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Coach Portal
                </h1>
              )}
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  sidebarCollapsed ? 'mx-auto' : 'ml-auto'
                }`}
                aria-label="Toggle sidebar"
              >
                <PanelLeft className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                  sidebarCollapsed ? 'rotate-180' : ''
                }`} />
              </button>
            </div>

            {/* Search bar */}
            {!sidebarCollapsed && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search navigation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
              <nav className="space-y-1 p-4">
              {navigationGroups.map((group) => {
                const filteredItems = filterItemsBySearch(group.items);
                const isExpanded = expandedGroups.has(group.id);
                const groupNotificationCount = getGroupNotificationCount(filteredItems);
                const GroupIcon = group.icon;

                if (filteredItems.length === 0) return null;

                // Special handling for Dashboard - always show as single item
                if (group.id === 'dashboard') {
                  const item = filteredItems[0];
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          sidebarCollapsed ? 'justify-center' : ''
                        } ${
                          pathname === item.href
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <ItemIcon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </Link>
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-1 top-0 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto whitespace-nowrap z-[10002]">
                          {item.name}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={group.id} className="space-y-1 relative">
                    {/* Group Header */}
                    <div className="relative">
                      <button
                        onClick={() => !sidebarCollapsed && toggleGroup(group.id)}
                        onMouseEnter={(e) => handleGroupHover(group.id, e)}
                        onMouseLeave={handleGroupLeave}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          sidebarCollapsed
                            ? 'justify-center hover:bg-gray-100 dark:hover:bg-gray-700'
                            : 'justify-between text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <GroupIcon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
                          {!sidebarCollapsed && (
                            <span className="truncate">{group.name}</span>
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <div className="flex items-center space-x-2">
                            {groupNotificationCount > 0 && (
                              <NotificationBadge count={groupNotificationCount} size="sm" variant="red" />
                            )}
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} />
                          </div>
                        )}
                        {sidebarCollapsed && groupNotificationCount > 0 && (
                          <NotificationBadge count={groupNotificationCount} size="sm" variant="red" className="absolute -top-1 -right-1" />
                        )}
                      </button>

                    </div>

                    {/* Group Items - Expanded Sidebar */}
                    {!sidebarCollapsed && isExpanded && (
                      <div className="ml-4 space-y-1">
                        {filteredItems.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                if (item.href === '/coaches/messages') {
                                  markMessagesAsRead();
                                } else if (item.href === '/coaches/calendar') {
                                  markAppointmentsAsRead();
                                }
                              }}
                              className={`group flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                pathname === item.href
                                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              <ItemIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                              {(item.notificationCount ?? 0) > 0 && (
                                <NotificationBadge
                                  count={item.notificationCount!}
                                  size="sm"
                                  variant="red"
                                  className="ml-auto"
                                />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              </nav>
            </div>

            {/* Notification section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className={`w-full group flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    sidebarCollapsed ? 'justify-center' : 'justify-between'
                  }`}
                  aria-label="Notifications"
                >
                  <div className="flex items-center">
                    <Bell className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
                    {!sidebarCollapsed && (
                      <span className="text-gray-700 dark:text-gray-300">Notifications</span>
                    )}
                  </div>
                  {!sidebarCollapsed && (unreadMessageCount + appointmentNotificationCount) > 0 && (
                    <NotificationBadge
                      count={unreadMessageCount + appointmentNotificationCount}
                      size="sm"
                      variant="red"
                    />
                  )}
                  {sidebarCollapsed && (unreadMessageCount + appointmentNotificationCount) > 0 && (
                    <NotificationBadge
                      count={unreadMessageCount + appointmentNotificationCount}
                      size="sm"
                      variant="red"
                      className="absolute -top-1 -right-1"
                    />
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto whitespace-nowrap z-[10002]">
                      Notifications
                      {(unreadMessageCount + appointmentNotificationCount) > 0 && ` (${unreadMessageCount + appointmentNotificationCount})`}
                    </div>
                  )}
                </button>

                {/* Desktop Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className={`absolute ${sidebarCollapsed ? 'left-full ml-1' : 'left-full ml-1'} bottom-full mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-[10002] border border-gray-200 dark:border-gray-600 max-h-96 overflow-y-auto`}>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>

                    {(unreadMessageCount + appointmentNotificationCount) === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No new notifications</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-2">
                        {appointmentNotificationCount > 0 && (
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <CalendarDays className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">New Appointments</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{appointmentNotificationCount} new bookings</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                router.push('/coaches/calendar');
                                setShowNotificationDropdown(false);
                              }}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 text-sm font-medium px-3 py-1 rounded"
                            >
                              View
                            </button>
                          </div>
                        )}

                        {unreadMessageCount > 0 && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">New Messages</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{unreadMessageCount} unread messages</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                router.push('/coaches/messages');
                                setShowNotificationDropdown(false);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User section at bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`w-full group flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    sidebarCollapsed ? 'justify-center' : 'justify-between'
                  }`}
                >
                  <div className="flex items-center">
                    <CircleUserRound className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
                    {!sidebarCollapsed && (
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {user?.first_name || 'Coach'} {user?.last_name || ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Coach
                        </p>
                      </div>
                    )}
                  </div>
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto whitespace-nowrap z-[10002]">
                      {user?.first_name || 'Coach'} {user?.last_name || ''}
                    </div>
                  )}
                </button>

                {/* User Dropdown */}
                {showDropdown && (
                  <div className={`absolute ${sidebarCollapsed ? 'left-full ml-1' : 'left-full ml-1'} bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-[10002] border border-gray-200 dark:border-gray-600`}>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name || 'Coach'} {user?.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Coach
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
          </div>
        </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${isInMeeting ? '' : (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72')} transition-all duration-300 ease-in-out relative z-[1] min-w-0 overflow-x-hidden`}>
          {/* Mobile Header */}
          {!isInMeeting && (
            <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 sm:px-6">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                  {/* Mobile menu button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
                  </button>

                  <img
                    src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
                    alt="ACFL Logo"
                    className="h-8 w-auto"
                  />
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Coach Portal
                  </h1>
                </div>

                {/* Mobile user menu */}
                <div className="flex items-center space-x-2">
                  {/* Mobile Notification Bell */}
                  <div className="relative" ref={mobileNotificationRef}>
                    <button
                      onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Notifications"
                    >
                      <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      {(unreadMessageCount + appointmentNotificationCount) > 0 && (
                        <NotificationBadge
                          count={unreadMessageCount + appointmentNotificationCount}
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
                          className="fixed inset-0 bg-black/20 z-[55]"
                          onClick={() => setShowNotificationDropdown(false)}
                        />
                        <div className="fixed right-4 top-16 left-4 bg-white dark:bg-gray-800 rounded-md shadow-xl z-[65] border border-gray-200 dark:border-gray-600 max-h-[70vh] overflow-y-auto">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Notifications</h3>

                            {(unreadMessageCount + appointmentNotificationCount) === 0 ? (
                              <div className="text-center py-8">
                                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">No new notifications</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {appointmentNotificationCount > 0 && (
                                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <CalendarDays className="w-5 h-5 text-green-600 dark:text-green-400" />
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">New Appointments</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{appointmentNotificationCount} new bookings</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        router.push('/coaches/calendar');
                                        setShowNotificationDropdown(false);
                                      }}
                                      className="text-green-600 dark:text-green-400 hover:text-green-700 text-sm font-medium px-3 py-1 rounded"
                                    >
                                      View
                                    </button>
                                  </div>
                                )}

                                {unreadMessageCount > 0 && (
                                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">New Messages</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{unreadMessageCount} unread messages</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        router.push('/coaches/messages');
                                        setShowNotificationDropdown(false);
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded"
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

                  {/* Mobile User Menu Button */}
                  <div className="relative" ref={mobileDropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="User menu"
                    >
                      <CircleUserRound className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Mobile User Dropdown */}
                    {showDropdown && (
                      <>
                        {/* Backdrop for mobile dropdown */}
                        <div
                          className="fixed inset-0 bg-black/20 z-[60]"
                          onClick={() => setShowDropdown(false)}
                        />
                        <div className="fixed right-4 top-16 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl py-1 z-[70] border border-gray-200 dark:border-gray-600">
                          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.first_name || 'Coach'} {user?.last_name || ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Coach
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
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Mobile Navigation Drawer */}
          {!isInMeeting && mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col">
                {/* Mobile Drawer Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <img
                        src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
                        alt="ACFL Logo"
                        className="h-8 w-auto"
                      />
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        Coach Portal
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* Mobile Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search navigation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Mobile Navigation Groups */}
                <nav className="flex-1 overflow-y-auto p-4">
                  {navigationGroups.map((group) => {
                    const filteredItems = filterItemsBySearch(group.items);
                    const isExpanded = expandedGroups.has(group.id);
                    const groupNotificationCount = getGroupNotificationCount(filteredItems);
                    const GroupIcon = group.icon;

                    if (filteredItems.length === 0) return null;

                    // Special handling for Dashboard - always show as single item
                    if (group.id === 'dashboard') {
                      const item = filteredItems[0];
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors mb-2 ${
                            pathname === item.href
                              ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <ItemIcon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    }

                    return (
                      <div key={group.id} className="mb-4">
                        {/* Mobile Group Header */}
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <GroupIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <span>{group.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {groupNotificationCount > 0 && (
                              <NotificationBadge count={groupNotificationCount} size="sm" variant="red" />
                            )}
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </button>

                        {/* Mobile Group Items */}
                        {isExpanded && (
                          <div className="ml-4 mt-2 space-y-1">
                            {filteredItems.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    if (item.href === '/coaches/messages') {
                                      markMessagesAsRead();
                                    } else if (item.href === '/coaches/calendar') {
                                      markAppointmentsAsRead();
                                    }
                                  }}
                                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                                    pathname === item.href
                                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  <ItemIcon className="w-4 h-4" />
                                  <span className="flex-1">{item.name}</span>
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
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </>
          )}

          {/* Bottom Navigation - Mobile Only */}
          {!isInMeeting && (
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-30">
              <div className="flex items-center h-16 px-4">
                {(() => {
                  // Get all navigation items with their group context
                  const allNavItems = navigationGroups.flatMap(group =>
                    group.items.map(item => ({
                      ...item,
                      groupName: group.name,
                      groupIcon: group.icon
                    }))
                  );

                  // Sort by priority (dashboard first, then by notification count, then alphabetically)
                  const sortedItems = allNavItems.sort((a, b) => {
                    if (a.href === '/coaches') return -1; // Dashboard always first
                    if (b.href === '/coaches') return 1;

                    const aNotifications = a.notificationCount || 0;
                    const bNotifications = b.notificationCount || 0;

                    if (aNotifications !== bNotifications) {
                      return bNotifications - aNotifications; // Higher notifications first
                    }

                    return a.name.localeCompare(b.name); // Alphabetical fallback
                  });

                  const primaryItems = sortedItems.slice(0, 4);
                  const overflowItems = sortedItems.slice(4);
                  const hasOverflow = overflowItems.length > 0;

                  return (
                    <>
                      {/* Primary Navigation Items */}
                      {primaryItems.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = pathname === item.href;
                        const notifications = item.notificationCount || 0;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              if (item.href === '/coaches/messages') {
                                markMessagesAsRead();
                              } else if (item.href === '/coaches/calendar') {
                                markAppointmentsAsRead();
                              }
                            }}
                            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors touch-manipulation min-h-[44px] ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="relative">
                              <ItemIcon className="w-5 h-5" />
                              {notifications > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                  {notifications > 99 ? '99+' : notifications}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs mt-1 font-medium truncate max-w-full ${
                              isActive ? 'text-blue-600 dark:text-blue-400' : ''
                            }`}>
                              {item.name.split(' ')[0]}
                            </span>
                          </Link>
                        );
                      })}

                      {/* Overflow Menu */}
                      {hasOverflow && (
                        <div className="relative" ref={bottomNavOverflowRef}>
                          <button
                            onClick={() => setShowBottomNavOverflow(!showBottomNavOverflow)}
                            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[60px] ${
                              showBottomNavOverflow
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="relative">
                              <MoreHorizontal className="w-5 h-5" />
                              {(() => {
                                const totalOverflowNotifications = overflowItems.reduce((sum, item) => sum + (item.notificationCount || 0), 0);
                                return totalOverflowNotifications > 0 && (
                                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                    {totalOverflowNotifications > 99 ? '99+' : totalOverflowNotifications}
                                  </div>
                                );
                              })()}
                            </div>
                            <span className="text-xs mt-1 font-medium">More</span>
                          </button>

                          {/* Overflow Dropdown */}
                          {showBottomNavOverflow && (
                            <>
                              <div
                                className="fixed inset-0 bg-black/20 z-40"
                                onClick={() => setShowBottomNavOverflow(false)}
                              />
                              <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-600 max-h-80 overflow-y-auto">
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">More Options</h3>
                                </div>

                                {/* Group overflow items by their groups */}
                                {(() => {
                                  const itemsByGroup = overflowItems.reduce((acc, item) => {
                                    if (!acc[item.groupName]) {
                                      acc[item.groupName] = [];
                                    }
                                    acc[item.groupName].push(item);
                                    return acc;
                                  }, {} as Record<string, typeof overflowItems>);

                                  return Object.entries(itemsByGroup).map(([groupName, items]) => (
                                    <div key={groupName} className="py-1">
                                      <div className="px-4 py-1">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                          {groupName}
                                        </p>
                                      </div>
                                      {items.map((item) => {
                                        const ItemIcon = item.icon;
                                        const isActive = pathname === item.href;
                                        const notifications = item.notificationCount || 0;

                                        return (
                                          <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => {
                                              setShowBottomNavOverflow(false);
                                              if (item.href === '/coaches/messages') {
                                                markMessagesAsRead();
                                              } else if (item.href === '/coaches/calendar') {
                                                markAppointmentsAsRead();
                                              }
                                            }}
                                            className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                                              isActive
                                                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                          >
                                            <ItemIcon className="w-4 h-4 flex-shrink-0" />
                                            <span className="flex-1 truncate">{item.name}</span>
                                            {notifications > 0 && (
                                              <div className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                                {notifications > 99 ? '99+' : notifications}
                                              </div>
                                            )}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className={`p-4 lg:p-8 ${navigationGroups.flatMap(g => g.items).length > 4 ? 'pb-20 lg:pb-8' : 'pb-4 lg:pb-8'} overflow-x-hidden`}>
            <div className="max-w-7xl mx-auto w-full min-w-0">
              <DeactivatedAccountBanner />
              <BankAccountSetupBanner />
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* Portal-based Hover Flyout for Collapsed Sidebar */}
        {typeof window !== 'undefined' && sidebarCollapsed && hoveredGroup && hoverPosition && createPortal(
          <div
            className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-[10002] border border-gray-200 dark:border-gray-600 pointer-events-auto"
            style={{
              left: `${hoverPosition.x}px`,
              top: `${hoverPosition.y}px`
            }}
            onMouseEnter={handleFlyoutEnter}
            onMouseLeave={handleFlyoutLeave}
          >
            {(() => {
              const group = navigationGroups.find(g => g.id === hoveredGroup);
              if (!group) return null;

              const filteredItems = filterItemsBySearch(group.items);
              const groupNotificationCount = getGroupNotificationCount(filteredItems);
              const GroupIcon = group.icon;

              return (
                <>
                  <div className="px-3 py-1 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <GroupIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{group.name}</span>
                      {groupNotificationCount > 0 && (
                        <NotificationBadge count={groupNotificationCount} size="sm" variant="red" />
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    {filteredItems.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            handleFlyoutLeave();
                            if (item.href === '/coaches/messages') {
                              markMessagesAsRead();
                            } else if (item.href === '/coaches/calendar') {
                              markAppointmentsAsRead();
                            }
                          }}
                          className={`flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                            pathname === item.href
                              ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 truncate">{item.name}</span>
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
              );
            })()}
          </div>,
          document.body
        )}

        {/* Theme Storage Consent Modal */}
        <ThemeConsentModal
          isOpen={showConsentModal}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      </div>
    </ProtectedRoute>
  );
}