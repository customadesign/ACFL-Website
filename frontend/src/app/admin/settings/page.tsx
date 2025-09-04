'use client';

import { useEffect, useState } from 'react';
import { 
  Settings,
  Save,
  RefreshCw,
  Bell,
  Mail,
  Shield,
  Database,
  Globe,
  DollarSign,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    coachApprovalRequired: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    userWelcomeEmails: boolean;
    appointmentReminders: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    maxLoginAttempts: number;
    ipWhitelist: string[];
  };
  payment: {
    stripePublicKey: string;
    stripeWebhookSecret: string;
    defaultCurrency: string;
    taxRate: number;
    processingFee: number;
  };
  scheduling: {
    defaultSessionDuration: number;
    maxAdvanceBooking: number;
    cancellationWindow: number;
    timeZone: string;
    businessHours: {
      start: string;
      end: string;
      days: string[];
    };
  };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Mock data for now - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSettings: SystemSettings = {
        general: {
          siteName: 'ACT Coaching For Life',
          siteDescription: 'Professional ACT coaching platform connecting clients with certified coaches',
          supportEmail: 'support@actcoaching.com',
          maintenanceMode: false,
          registrationEnabled: true,
          coachApprovalRequired: true
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          adminAlerts: true,
          userWelcomeEmails: true,
          appointmentReminders: true
        },
        security: {
          sessionTimeout: 30,
          passwordMinLength: 8,
          requireTwoFactor: false,
          maxLoginAttempts: 5,
          ipWhitelist: []
        },
        payment: {
          stripePublicKey: 'pk_test_...',
          stripeWebhookSecret: 'whsec_...',
          defaultCurrency: 'USD',
          taxRate: 8.5,
          processingFee: 2.9
        },
        scheduling: {
          defaultSessionDuration: 60,
          maxAdvanceBooking: 30,
          cancellationWindow: 24,
          timeZone: 'America/New_York',
          businessHours: {
            start: '09:00',
            end: '17:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        }
      };
      
      setSettings(mockSettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage({ type: 'error', message: 'Failed to save settings. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payment', label: 'Payment', icon: DollarSign },
    { id: 'scheduling', label: 'Scheduling', icon: Clock }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Mobile-First Header Skeleton */}
          <div className="pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
              <div className="flex-1 min-w-0">
                <div className="h-8 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-2/3 sm:w-1/3 animate-pulse mb-2 sm:mb-3"></div>
                <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-full sm:w-1/2 animate-pulse"></div>
              </div>
              <div className="flex-shrink-0">
                <div className="h-11 sm:h-12 w-full sm:w-36 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Mobile-First Tabs Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mx-3 sm:mx-0 mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex overflow-x-auto px-3 sm:px-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="min-h-[44px] py-3 sm:py-4 px-3 sm:px-4 animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-16 sm:w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile-First Settings Content Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mx-3 sm:mx-0">
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-2"></div>
                  <div className="h-11 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
              ))}
              
              {/* Toggle Section Skeleton */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/4 mb-4"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-4">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                    </div>
                    <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load settings</h2>
          <p className="text-gray-500 dark:text-gray-400">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Mobile-First Responsive Header */}
        <div className="pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">
                System Settings
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
                Configure platform settings and preferences
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto min-h-[44px] bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl touch-manipulation"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="text-sm sm:text-base">{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Save Message */}
        {saveMessage && (
          <div className={`mx-3 sm:mx-0 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-start space-x-3 shadow-sm ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }`}>
            <div className="flex-shrink-0 pt-0.5">
              {saveMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <span className="text-sm sm:text-base font-medium">{saveMessage.message}</span>
          </div>
        )}

        {/* Mobile-First Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mx-3 sm:mx-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto scrollbar-hide px-3 sm:px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-sm sm:text-base flex items-center space-x-2 whitespace-nowrap transition-all duration-200 touch-manipulation ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6 sm:space-y-8 max-w-none sm:max-w-2xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                    placeholder="Enter site name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    Site Description
                  </label>
                  <textarea
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    rows={3}
                    className="w-full min-h-[132px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation resize-vertical"
                    placeholder="Enter site description"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                    className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                    placeholder="support@example.com"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  System Controls
                </h3>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 pr-0 sm:pr-4">
                      <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 block">
                        Maintenance Mode
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Temporarily disable site access for maintenance
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.general.maintenanceMode}
                          onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                          settings.general.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                            settings.general.maintenanceMode ? 'transform translate-x-5' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 pr-0 sm:pr-4">
                      <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 block">
                        User Registration
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Allow new users to register on the platform
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.general.registrationEnabled}
                          onChange={(e) => updateSetting('general', 'registrationEnabled', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                          settings.general.registrationEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                            settings.general.registrationEnabled ? 'transform translate-x-5' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 pr-0 sm:pr-4">
                      <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 block">
                        Coach Approval Required
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Require admin approval for new coach applications
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.general.coachApprovalRequired}
                          onChange={(e) => updateSetting('general', 'coachApprovalRequired', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                          settings.general.coachApprovalRequired ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                            settings.general.coachApprovalRequired ? 'transform translate-x-5' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 sm:space-y-8 max-w-none sm:max-w-2xl">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Notification Preferences
                  </h3>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 pr-0 sm:pr-4">
                        <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 block">
                          Email Notifications
                        </label>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Send notifications via email
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.emailNotifications}
                            onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                            settings.notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                              settings.notifications.emailNotifications ? 'transform translate-x-5' : ''
                            }`}></div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 pr-0 sm:pr-4">
                        <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 block">
                          Admin Alerts
                        </label>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Receive alerts for important system events
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.adminAlerts}
                            onChange={(e) => updateSetting('notifications', 'adminAlerts', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                            settings.notifications.adminAlerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                              settings.notifications.adminAlerts ? 'transform translate-x-5' : ''
                            }`}></div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 pr-0 sm:pr-4">
                        <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 block">
                          Welcome Emails
                        </label>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Send welcome emails to new users
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.userWelcomeEmails}
                            onChange={(e) => updateSetting('notifications', 'userWelcomeEmails', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                            settings.notifications.userWelcomeEmails ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                              settings.notifications.userWelcomeEmails ? 'transform translate-x-5' : ''
                            }`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6 sm:space-y-8 max-w-none sm:max-w-2xl">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                      placeholder="30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                      placeholder="8"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Advanced Security
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 pr-0 sm:pr-4">
                      <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 block">
                        Require Two-Factor Authentication
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Require 2FA for all admin accounts
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.requireTwoFactor}
                          onChange={(e) => updateSetting('security', 'requireTwoFactor', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                          settings.security.requireTwoFactor ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                            settings.security.requireTwoFactor ? 'transform translate-x-5' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-6 sm:space-y-8 max-w-none sm:max-w-2xl">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                      Default Currency
                    </label>
                    <select
                      value={settings.payment.defaultCurrency}
                      onChange={(e) => updateSetting('payment', 'defaultCurrency', e.target.value)}
                      className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-12" 
                      style={{ backgroundImage: "url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e')" }}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.payment.taxRate}
                      onChange={(e) => updateSetting('payment', 'taxRate', parseFloat(e.target.value))}
                      className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                      placeholder="8.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Scheduling Settings */}
            {activeTab === 'scheduling' && (
              <div className="space-y-6 sm:space-y-8 max-w-none sm:max-w-2xl">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                      Default Session Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={settings.scheduling.defaultSessionDuration}
                      onChange={(e) => updateSetting('scheduling', 'defaultSessionDuration', parseInt(e.target.value))}
                      className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                      placeholder="60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                      Max Advance Booking (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.scheduling.maxAdvanceBooking}
                      onChange={(e) => updateSetting('scheduling', 'maxAdvanceBooking', parseInt(e.target.value))}
                      className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                      placeholder="30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                      Time Zone
                    </label>
                    <select
                      value={settings.scheduling.timeZone}
                      onChange={(e) => updateSetting('scheduling', 'timeZone', e.target.value)}
                      className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-12" 
                      style={{ backgroundImage: "url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e')" }}
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile-Specific Bottom Padding for Better UX */}
        <div className="h-8 sm:h-16"></div>
      </div>
    </div>
  );
}