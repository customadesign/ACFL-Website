'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Type,
  ScrollText,
  ChevronDown,
  ChevronRight,
  Search,
  Sidebar,
  PanelLeft,
  UserCog,
  Calendar as CalendarIcon,
  TrendingUp,
  Cog
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  permission?: string | null;
  notificationCount?: number;
  adminOnly?: boolean;
  staffOnly?: boolean;
}

interface NavigationGroup {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  items: NavigationItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showBottomNavOverflow, setShowBottomNavOverflow] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['user-management', 'operations']));
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const mobileNotificationRef = useRef<HTMLDivElement>(null);
  const bottomNavOverflowRef = useRef<HTMLDivElement>(null);

  // Admin theme management with localStorage integration
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hasStorageConsent, setHasStorageConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<'light' | 'dark'>('light'); // Track the theme waiting for consent
  const [mounted, setMounted] = useState(false);

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
      console.log('Admin theme initialized to:', currentDOMTheme, '(consent granted, from DOM)');
    } else if (storageConsent === 'denied') {
      setHasStorageConsent(false);
      // Use the theme from DOM but don't save
      setTheme(currentDOMTheme);
      setPendingTheme(currentDOMTheme);
      console.log('Admin theme initialized to:', currentDOMTheme, '(consent denied, from DOM)');
    } else {
      // No consent recorded yet - use current DOM theme
      setTheme(currentDOMTheme);
      setPendingTheme(currentDOMTheme);
      console.log('Admin theme initialized to:', currentDOMTheme, '(no consent yet, from DOM)');
    }
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
      console.log('Admin theme changed to:', newTheme, '- saved to localStorage');
    } else {
      // No consent yet OR consent denied - always show modal
      setShowConsentModal(true);
      console.log('Admin theme changed to:', newTheme, '- showing consent modal');
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

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);


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

  const navigationGroups: NavigationGroup[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      items: [
        { name: 'Overview', href: '/admin', icon: Home, permission: null }, // Always visible
      ]
    },
    {
      id: 'user-management',
      name: 'User Management',
      icon: UserCog,
      items: [
        { name: 'Users', href: '/admin/users', icon: Users, notificationCount: displayNewUsersCount, permission: PERMISSIONS.USERS_VIEW },
        { name: 'Coach Applications', href: '/admin/coach-applications', icon: FileText, notificationCount: displayNewCoachApplicationsCount, permission: PERMISSIONS.USERS_VIEW },
        { name: 'Profile', href: '/admin/profile', icon: User, permission: null, staffOnly: true },
      ]
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: CalendarIcon,
      items: [
        { name: 'Appointments', href: '/admin/appointments', icon: Calendar, notificationCount: displayNewAppointmentsCount, permission: PERMISSIONS.APPOINTMENTS_VIEW },
        { name: 'Messages', href: '/admin/messages', icon: MessageSquare, notificationCount: displayNewMessagesCount, permission: PERMISSIONS.MESSAGES_VIEW },
        { name: 'Financials', href: '/admin/financials', icon: DollarSign, permission: PERMISSIONS.FINANCIAL_VIEW },
      ]
    },
    {
      id: 'content-analytics',
      name: 'Content & Analytics',
      icon: TrendingUp,
      items: [
        { name: 'Content Management', href: '/admin/content', icon: Type, permission: PERMISSIONS.CONTENT_VIEW },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
      ]
    },
    {
      id: 'system',
      name: 'System Management',
      icon: Cog,
      items: [
        { name: 'Staff Capabilities', href: '/admin/staff-capabilities', icon: Shield, permission: null, adminOnly: true },
        { name: 'System Logs', href: '/admin/system-logs', icon: ScrollText, permission: null, adminOnly: true },
        { name: 'Settings', href: '/admin/settings', icon: Settings, permission: null, adminOnly: true },
      ]
    },
  ];

  // Filter navigation groups and items based on permissions
  const filteredNavigationGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
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
    })
  })).filter(group => group.items.length > 0); // Remove empty groups

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Collapsible Sidebar - Desktop */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-[10001] ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
      } transition-all duration-300 ease-in-out`}>
        <div className="flex h-full flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
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
                {user?.role === 'staff' ? 'Staff Portal' : 'Admin Panel'}
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
            <div className="shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
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

          {/* Navigation Groups - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide min-h-0">
            <nav className="space-y-1 p-4">
            {filteredNavigationGroups.map((group) => {
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

          {/* Notification section - Fixed at bottom */}
          <div className="shrink-0 p-1 border-t border-gray-200 dark:border-gray-700">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className={`w-full group flex items-center px-2 py-1 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  sidebarCollapsed ? 'justify-center' : 'justify-between'
                }`}
                aria-label="Notifications"
              >
                <div className="flex items-center min-h-[40px]">
                  <Bell className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
                  {!sidebarCollapsed && (
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Updates & Alerts</p>
                    </div>
                  )}
                </div>
                {!sidebarCollapsed && (displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount) > 0 && (
                  <NotificationBadge
                    count={displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount}
                    size="sm"
                    variant="red"
                  />
                )}
                {sidebarCollapsed && (displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount) > 0 && (
                  <NotificationBadge
                    count={displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount}
                    size="sm"
                    variant="red"
                    className="absolute -top-1 -right-1"
                  />
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto whitespace-nowrap z-[10002]">
                    Notifications
                    {(displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount) > 0 && ` (${displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount})`}
                  </div>
                )}
              </button>

              {/* Desktop Notification Dropdown */}
              {showNotificationDropdown && (
                <div className={`absolute ${sidebarCollapsed ? 'left-full ml-1' : 'left-full ml-1'} bottom-full mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-[10002] border border-gray-200 dark:border-gray-600 max-h-96 overflow-y-auto`}>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>

                  {(displayNewUsersCount + displayNewCoachApplicationsCount + displayNewAppointmentsCount + displayNewMessagesCount) === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No new notifications</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
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
              )}
            </div>
          </div>

          {/* User section - Fixed at bottom */}
          <div className="shrink-0 p-1 border-t border-gray-200 dark:border-gray-700">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-full group flex items-center px-2 py-1 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  sidebarCollapsed ? 'justify-center' : 'justify-between'
                }`}
              >
                <div className="flex items-center min-h-[40px]">
                  <CircleUserRound className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
                  {!sidebarCollapsed && (
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {user?.first_name || 'Admin'} {user?.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.role === 'staff' ? 'Staff Member' : 'Administrator'}
                      </p>
                    </div>
                  )}
                </div>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto whitespace-nowrap z-[10002]">
                    {user?.first_name || 'Admin'} {user?.last_name || ''}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showDropdown && (
                <div className={`absolute ${sidebarCollapsed ? 'left-full ml-1' : 'left-full ml-1'} bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-[10002] border border-gray-200 dark:border-gray-600`}>
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'} transition-all duration-300 ease-in-out relative z-[1]`}>
        {/* Mobile Header */}
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
                  {user?.role === 'staff' ? 'Staff Portal' : 'Admin Panel'}
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
                        className="fixed inset-0 bg-black/20 z-[55]"
                        onClick={() => setShowNotificationDropdown(false)}
                      />
                      <div className="fixed right-4 top-16 left-4 bg-white dark:bg-gray-800 rounded-md shadow-xl z-[65] border border-gray-200 dark:border-gray-600 max-h-[70vh] overflow-y-auto">
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
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
                {filteredNavigationGroups.map((group) => {
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
                                onClick={() => setMobileMenuOpen(false)}
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
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-30">
          <div className="flex items-center h-16 px-4">
            {(() => {
              // Get all navigation items with their group context
              const allNavItems = filteredNavigationGroups.flatMap(group =>
                group.items.map(item => ({
                  ...item,
                  groupName: group.name,
                  groupIcon: group.icon
                }))
              );

              // Sort by priority (dashboard first, then by notification count, then alphabetically)
              const sortedItems = allNavItems.sort((a, b) => {
                if (a.href === '/admin') return -1; // Dashboard always first
                if (b.href === '/admin') return 1;

                const aNotifications = a.notificationCount || 0;
                const bNotifications = b.notificationCount || 0;

                if (aNotifications !== bNotifications) {
                  return bNotifications - aNotifications; // Higher notifications first
                }

                return a.name.localeCompare(b.name); // Alphabetical fallback
              });

              const primaryItems = sortedItems.slice(0, 3);
              const overflowItems = sortedItems.slice(3);
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
                          {item.name}
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
                                        onClick={() => setShowBottomNavOverflow(false)}
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

        {/* Main Content */}
        <main className={`p-4 lg:p-8 ${filteredNavigationGroups.flatMap(g => g.items).length > 3 ? 'pb-20 lg:pb-8' : 'pb-4 lg:pb-8'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
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
            const group = filteredNavigationGroups.find(g => g.id === hoveredGroup);
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
                        onClick={handleFlyoutLeave}
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
  );
}