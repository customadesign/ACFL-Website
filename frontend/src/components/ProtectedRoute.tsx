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
        router.push(redirectTo);
        return;
      }

      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        // Redirect based on user role
        if (user.role === 'client') {
          router.push('/');
        } else if (user.role === 'coach') {
          router.push('/coaches');
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        return;
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
    return null; // Will redirect in useEffect
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}