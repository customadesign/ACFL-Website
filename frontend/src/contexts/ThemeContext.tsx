'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import ThemeConsentModal from '@/components/ThemeConsentModal';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  hasStorageConsent: boolean;
  revokeStorageConsent: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with light theme to match server rendering
  const [theme, setThemeState] = useState<Theme>('light');
  
  const [mounted, setMounted] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasStorageConsent, setHasStorageConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if user has already given consent
    const storageConsent = localStorage.getItem('theme-storage-consent');
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    console.log('ThemeContext: Initializing after mount:', { storageConsent, savedTheme });
    
    // Set consent states
    if (storageConsent === 'granted') {
      setHasStorageConsent(true);
    } else if (storageConsent === 'denied') {
      setHasStorageConsent(false);
    }
    setConsentChecked(true);
    
    // Determine correct theme
    let correctTheme: Theme;
    
    if (storageConsent === 'granted' && savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      correctTheme = savedTheme;
      console.log('ThemeContext: Using saved theme:', correctTheme);
    } else if (storageConsent === 'denied') {
      correctTheme = 'light';
      console.log('ThemeContext: Using light theme (consent denied)');
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      correctTheme = prefersDark ? 'dark' : 'light';
      console.log('ThemeContext: Using system preference:', correctTheme);
    }
    
    // Update theme state and DOM
    setThemeState(correctTheme);
    
    // Apply theme to DOM (ThemeScript should have done this already, but ensure it's correct)
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(correctTheme);
    
    console.log('ThemeContext: Theme set to:', correctTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    console.log('Applying theme:', newTheme); // Debug log
    setThemeState(newTheme);
    
    // Ensure DOM is properly updated
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.remove('light'); // Remove light class if it exists
        document.documentElement.classList.add('dark');
        console.log('Added dark class to HTML element'); // Debug log
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light'); // Explicitly add light class
        console.log('Added light class to HTML element'); // Debug log
      }
      
      // Verify the class was applied
      console.log('HTML classes after theme change:', document.documentElement.className);
    }
  };

  const setTheme = (newTheme: Theme) => {
    const storageConsent = localStorage.getItem('theme-storage-consent');
    
    // If user hasn't given consent yet and is trying to change theme, show modal
    if (storageConsent === null && !hasStorageConsent) {
      setShowConsentModal(true);
      // Apply theme immediately but don't save
      applyTheme(newTheme);
      return;
    }
    
    applyTheme(newTheme);
    
    // Only save to localStorage if user has given consent
    if (hasStorageConsent && storageConsent === 'granted') {
      localStorage.setItem('theme', newTheme);
    }
    // If consent was denied, theme still changes but isn't persisted
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleConsentAccept = () => {
    localStorage.setItem('theme-storage-consent', 'granted');
    localStorage.setItem('theme', theme);
    setHasStorageConsent(true);
    setShowConsentModal(false);
    
    // Show user-friendly notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Create a custom toast notification instead of browser notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-[10000] max-w-sm';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <div class="font-semibold">Theme preference saved!</div>
            <div class="text-sm">Your choice will be remembered for next time.</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 4000);
    }
  };

  const handleConsentDecline = () => {
    localStorage.setItem('theme-storage-consent', 'denied');
    setHasStorageConsent(false);
    setShowConsentModal(false);
    
    // Show user-friendly notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg shadow-lg z-[10000] max-w-sm';
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div class="font-semibold">Theme won't be saved</div>
          <div class="text-sm">It will reset to light mode when you visit again.</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  };

  const revokeStorageConsent = () => {
    localStorage.removeItem('theme-storage-consent');
    localStorage.removeItem('theme');
    setHasStorageConsent(false);
    applyTheme('light');
    
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg z-[10000] max-w-sm';
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <div>
          <div class="font-semibold">Theme preferences cleared</div>
          <div class="text-sm">Your theme will now reset each visit.</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  };

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme, 
      hasStorageConsent, 
      revokeStorageConsent 
    }}>
      {children}
      <ThemeConsentModal
        isOpen={showConsentModal}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}