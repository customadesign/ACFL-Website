'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('❌ ProtectedRoute: User not authenticated, redirecting to', redirectTo);
        router.push(redirectTo);
        return;
      }

      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        console.log(`❌ ProtectedRoute: User role "${user.role}" not in allowed roles [${allowedRoles.join(', ')}]`);
        // Redirect based on user role
        const redirectPath = user.role === 'client'
          ? '/clients'
          : user.role === 'coach'
          ? '/coaches'
          : (user.role === 'admin' || user.role === 'staff')
          ? '/admin'
          : '/';

        console.log(`🔄 Redirecting ${user.role} to ${redirectPath}`);
        router.push(redirectPath);

        // Force redirect with window.location as fallback
        setTimeout(() => {
          if (window.location.pathname !== redirectPath) {
            console.log('⚠️ Router redirect failed, using window.location');
            window.location.href = redirectPath;
          }
        }, 500);
        return;
      } else if (allowedRoles.length > 0 && user) {
        console.log(`✅ ProtectedRoute: User role "${user.role}" is allowed [${allowedRoles.join(', ')}]`);
      }
    }
  }, [user, loading, isAuthenticated, allowedRoles, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute: Rendering null - not authenticated');
    return null; // Will redirect in useEffect
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    console.log(`🚫 ProtectedRoute: Rendering null - role "${user.role}" not allowed`);
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}