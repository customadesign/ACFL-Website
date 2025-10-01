'use client';

import { useEffect, useState } from 'react';
import { Shield, LogOut, User } from 'lucide-react';

interface ImpersonatedUser {
  id: string;
  name: string;
  type: string;
}

export default function AdminImpersonationFloat() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if currently impersonating
    const impersonatingFlag = localStorage.getItem('impersonating');
    const impersonatedUserData = localStorage.getItem('impersonated_user');
    
    if (impersonatingFlag === 'true' && impersonatedUserData) {
      try {
        const userData = JSON.parse(impersonatedUserData);
        setIsImpersonating(true);
        setImpersonatedUser(userData);
      } catch (error) {
        console.error('Error parsing impersonated user data:', error);
      }
    }
  }, []);

  const handleSwitchToAdmin = () => {
    // Restore original admin token without redirecting
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('impersonating');
      localStorage.removeItem('impersonated_user');
      
      // Redirect back to admin panel
      window.location.href = '/admin/users';
    }
  };

  const handleStopImpersonation = () => {
    // Same as switch to admin for now, but could be different in the future
    handleSwitchToAdmin();
  };

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <>
      {/* Floating Admin Switch Button */}
      <div className="fixed bottom-20 right-4 lg:bottom-4 z-[99999] flex flex-col gap-2">
        {/* Minimized state when not visible */}
        {!isVisible && (
          <button
            onClick={() => setIsVisible(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            title="Admin Controls"
          >
            <Shield className="w-5 h-5" />
          </button>
        )}

        {/* Expanded state */}
        {isVisible && (
          <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-orange-600 dark:text-orange-400 text-sm">
                  Admin Mode
                </span>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Impersonation Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Viewing as:
                </span>
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <div className="font-semibold">{impersonatedUser.name}</div>
                <div className="text-xs opacity-75 capitalize">
                  {impersonatedUser.type} Account
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleSwitchToAdmin}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Shield className="w-4 h-4" />
                Switch to Admin
              </button>
              
            
            </div>

            {/* Info Text */}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              You are viewing this account as an admin
            </div>
          </div>
        )}
      </div>
    </>
  );
}