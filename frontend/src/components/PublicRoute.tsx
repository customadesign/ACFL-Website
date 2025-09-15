'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // List of public pages that should be accessible to everyone
  const alwaysAccessiblePages = [
    '/help',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/faq',
    '/resources',
    '/blog',
    '/press',
    '/careers',
    '/pricing',
    '/corporate',
    '/group-coaching'
  ];

  useEffect(() => {
    // Don't redirect if on an always-accessible page
    if (alwaysAccessiblePages.includes(pathname)) {
      return;
    }

    if (!loading && isAuthenticated && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (user.role === 'client') {
        router.push('/clients');
      } else if (user.role === 'coach') {
        router.push('/coaches');
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'staff') {
        router.push('/admin');
      }
    }
  }, [user, loading, isAuthenticated, router, pathname]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If on an always-accessible page, show it regardless of auth status
  if (alwaysAccessiblePages.includes(pathname)) {
    return <>{children}</>;
  }

  // If authenticated and not on an always-accessible page, show redirect message
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated, show the public content
  return <>{children}</>;
}