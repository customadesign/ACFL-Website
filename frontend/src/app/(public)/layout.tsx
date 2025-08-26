'use client';

import { useEffect } from 'react';
import PublicRoute from '@/components/PublicRoute';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Force remove dark class from html element for public pages
    document.documentElement.classList.remove('dark');
    
    // Override CSS variables to light mode values
    const root = document.documentElement;
    root.style.setProperty('--background', '0 0% 100%');
    root.style.setProperty('--foreground', '222.2 84% 4.9%');
    root.style.setProperty('--card', '0 0% 100%');
    root.style.setProperty('--card-foreground', '222.2 84% 4.9%');
    root.style.setProperty('--primary', '222.2 47.4% 11.2%');
    root.style.setProperty('--primary-foreground', '210 40% 98%');
    root.style.setProperty('--secondary', '210 40% 96.1%');
    root.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--muted', '210 40% 96.1%');
    root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
    root.style.setProperty('--accent', '210 40% 96.1%');
    root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
    root.style.setProperty('--destructive', '0 84.2% 60.2%');
    root.style.setProperty('--destructive-foreground', '210 40% 98%');
    root.style.setProperty('--border', '214.3 31.8% 91.4%');
    root.style.setProperty('--input', '214.3 31.8% 91.4%');
    root.style.setProperty('--ring', '222.2 84% 4.9%');
    
    return () => {
      // Clean up inline styles when leaving public pages
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--secondary-foreground');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--destructive');
      root.style.removeProperty('--destructive-foreground');
      root.style.removeProperty('--border');
      root.style.removeProperty('--input');
      root.style.removeProperty('--ring');
    };
  }, []);
  
  return (
    <PublicRoute>
      <div className="min-h-screen bg-white">
        {children}
      </div>
    </PublicRoute>
  )
}