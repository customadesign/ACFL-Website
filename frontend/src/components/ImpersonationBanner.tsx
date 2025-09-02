'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';

interface ImpersonatedUser {
  id: string;
  name: string;
  type: string;
}

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

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

  const handleStopImpersonation = () => {
    // Restore original admin token
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

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="text-sm">
            <span className="font-medium text-yellow-800">
              Impersonating: {impersonatedUser.name}
            </span>
            <span className="text-yellow-700 ml-2">
              ({impersonatedUser.type})
            </span>
          </div>
        </div>
        
        <button
          onClick={handleStopImpersonation}
          className="flex items-center space-x-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Stop Impersonation</span>
        </button>
      </div>
    </div>
  );
}