'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getApiUrl } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'client' | 'coach' | 'admin' | 'staff';
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, skipRedirect?: boolean) => Promise<void>;
  registerClient: (data: RegisterClientData) => Promise<void>;
  registerCoach: (data: RegisterCoachData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterClientData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

interface RegisterCoachData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = getApiUrl();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.warn('Could not set axios default headers:', error);
      }
    }
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          console.log(`Checking authentication with token... (attempt ${retryCount + 1})`);
          console.log('API URL:', API_URL);
          
          // Use fetch instead of axios to avoid potential axios configuration issues
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include' // Include credentials for CORS
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Auth check successful:', data.user);
            setUser(data.user);
            
            // Update axios headers if successful
            try {
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (headerError) {
              console.warn('Could not set axios default headers:', headerError);
            }
          } else if (response.status === 401 || response.status === 404) {
            console.log('Removing invalid token due to auth error');
            localStorage.removeItem('token');
            try {
              delete axios.defaults.headers.common['Authorization'];
            } catch (headerError) {
              console.warn('Could not delete axios default headers:', headerError);
            }
            setUser(null);
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error: any) {
          console.error('Auth check failed:', error);
          console.error('Error details:', {
            message: error.message,
            name: error.name,
            type: typeof error
          });
          
          // Check for network-related errors
          const isNetworkError = 
            error.name === 'TypeError' ||  // Network errors in fetch
            error.message?.includes('fetch') ||
            error.message?.includes('network') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('Failed to fetch') ||
            error.code === 'NETWORK_ERROR' ||
            error.code === 'ECONNREFUSED';
          
          if (isNetworkError) {
            // Network error - retry with exponential backoff
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
              console.log(`Network error, retrying in ${delay}ms... (${retryCount + 1}/4)`);
              setTimeout(() => checkAuth(retryCount + 1), delay);
              return;
            } else {
              console.log('Max retries reached for network error, keeping token for manual retry');
              console.log('User can try refreshing the page or check network connection');
            }
          } else {
            console.log('Unknown error during auth check, keeping token');
          }
        }
      } else {
        console.log('No token found');
      }
      setLoading(false);
      setAuthChecked(true);
    };

    // Wait for the app to be fully mounted and backend to be ready
    const timer = setTimeout(() => {
      checkAuth();
    }, 500); // Increased delay to 500ms to give backend more time

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string, skipRedirect?: boolean) => {
    try {
      console.log('Attempting login with:', email);
      console.log('API URL:', API_URL);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { token, user } = response.data;
      console.log('Login response:', { token: !!token, user });
      
      // Save token
      localStorage.setItem('token', token);
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.warn('Could not set axios default headers:', error);
      }
      
      // Set user
      setUser(user);
      
      // Only redirect if not handled by the login page itself
      if (!skipRedirect) {
        // Check if there's a pending redirect in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        const fromAssessment = urlParams.get('from') === 'assessment';
        
        if (redirect || fromAssessment) {
          // Let the login page handle the redirect
          console.log('Login page will handle redirect:', { redirect, fromAssessment });
          return;
        }
        
        // Otherwise redirect based on role
        console.log('User role:', user.role);

        // Use window.location for more reliable redirect
        const redirectUrl = (() => {
          switch(user.role) {
            case 'client':
              console.log('Redirecting client to /clients');
              return '/clients';
            case 'coach':
              console.log('Redirecting coach to /coaches');
              return '/coaches';
            case 'admin':
            case 'staff':
              console.log(`Redirecting ${user.role} to /admin`);
              return '/admin';
            default:
              console.log('Unknown role, redirecting to home');
              return '/';
          }
        })();

        // Use a combination of router.push and window.location for reliable redirect
        router.push(redirectUrl);
        // Fallback to window.location if router doesn't work
        setTimeout(() => {
          if (window.location.pathname === '/login' || window.location.pathname === '/') {
            window.location.href = redirectUrl;
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Login error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED' || !error.response) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      // Handle account status errors specifically
      if (error.response?.status === 403) {
        const { message, statusCode } = error.response.data;
        
        // These are account status issues, show the message directly
        if (statusCode === 'ACCOUNT_SUSPENDED' ||
            statusCode === 'ACCOUNT_DEACTIVATED' ||
            statusCode === 'ACCOUNT_REJECTED' ||
            statusCode === 'ACCOUNT_PENDING') {
          throw new Error(message);
        }
      }
      
      // For other errors, use generic message
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const registerClient = async (data: RegisterClientData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register/client`, data);
      
      const { token, user } = response.data;
      
      // Save token
      localStorage.setItem('token', token);
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.warn('Could not set axios default headers:', error);
      }
      
      // Set user
      setUser(user);

      // Redirect to client dashboard with fallback
      router.push('/clients');
      setTimeout(() => {
        if (window.location.pathname.includes('/register')) {
          window.location.href = '/clients';
        }
      }, 500);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const registerCoach = async (data: RegisterCoachData) => {
    try {
      console.log('Sending coach registration:', data);
      const response = await axios.post(`${API_URL}/api/auth/register/coach`, data);
      
      const { token, user } = response.data;
      
      // Save token
      localStorage.setItem('token', token);
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.warn('Could not set axios default headers:', error);
      }
      
      // Set user
      setUser(user);

      // Redirect to coach dashboard with fallback
      router.push('/coaches');
      setTimeout(() => {
        if (window.location.pathname.includes('/register')) {
          window.location.href = '/coaches';
        }
      }, 500);
    } catch (error: any) {
      console.error('Registration error:', error.response?.data);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessage = validationErrors
          .map((err: any) => err.msg || err.message)
          .join(', ');
        throw new Error(errorMessage);
      }
      
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    console.log('🔓 Starting logout process...');
    
    // Check if we're in a valid browser environment
    if (typeof window === 'undefined') {
      console.warn('⚠️ Logout called in non-browser environment');
      return;
    }
    
    try {
      // Call backend logout endpoint if token exists and we're online
      const token = localStorage.getItem('token');
      if (token && navigator.onLine !== false) {
        console.log('📞 Calling backend logout endpoint...');
        try {
          const response = await axios.post(`${API_URL}/api/auth/logout`, {}, {
            timeout: 5000 // 5 second timeout
          });
          console.log('✅ Backend logout successful:', response.data.message);
        } catch (backendError: any) {
          console.warn('⚠️ Backend logout failed (continuing with client cleanup):', 
            backendError.response?.data?.message || backendError.message);
          
          // Log specific error types for debugging
          if (backendError.code === 'NETWORK_ERROR') {
            console.log('📡 Network error during logout - user may be offline');
          } else if (backendError.response?.status === 401) {
            console.log('🔒 Token already invalid - proceeding with cleanup');
          }
          // Continue with client-side cleanup even if backend fails
        }
      } else if (!navigator.onLine) {
        console.log('📴 User appears offline - skipping backend logout call');
      } else {
        console.log('🚫 No token found - skipping backend logout call');
      }
    } catch (error: any) {
      console.warn('⚠️ Error during backend logout:', error.message || error);
      // Continue with cleanup regardless
    }

    console.log('🧹 Starting comprehensive client-side cleanup...');
    
    // Remove authentication token
    localStorage.removeItem('token');
    console.log('✅ Token removed from localStorage');
    
    // Remove any other potential auth-related items
    const authRelatedKeys = [
      'refreshToken',
      'tokenExpiry', 
      'lastAuthCheck',
      'rememberMe',
      'userId',
      'userRole',
      'sessionId'
    ];
    
    authRelatedKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Removed ${key} from localStorage`);
      }
    });
    
    // Clear session storage as well
    try {
      const sessionKeys = Object.keys(sessionStorage);
      const authSessionKeys = sessionKeys.filter(key => 
        key.toLowerCase().includes('token') || 
        key.toLowerCase().includes('auth') ||
        key.toLowerCase().includes('user')
      );
      
      authSessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`✅ Removed ${key} from sessionStorage`);
      });
    } catch (error) {
      console.warn('Could not clear sessionStorage:', error);
    }
    
    // Clear axios default headers thoroughly
    try {
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers['Authorization'];
      // Reset axios instance to defaults
      axios.defaults.headers.common = {};
      console.log('✅ Axios headers completely cleared');
    } catch (error) {
      console.warn('Could not delete axios default headers:', error);
    }
    
    // Reset theme to light (optional cleanup)
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    console.log('✅ Theme reset to light');
    
    // Clear user state
    setUser(null);
    setAuthChecked(false); // Reset auth check state
    console.log('✅ User state and auth check cleared');
    
    // Force a page refresh after logout to ensure complete cleanup
    // and prevent any lingering state issues
    setTimeout(() => {
      console.log('🚀 Redirecting to home page...');
      
      // Check if we're in the admin section to redirect to login instead
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        console.log('🔄 Admin/Staff logout - redirecting to login page');
        router.push('/login');
      } else {
        console.log('🏠 Regular logout - redirecting to home page');
        router.push('/');
      }
      
      // Optional: Force a page refresh to ensure complete state cleanup
      // Uncomment if you encounter persistent state issues
      // setTimeout(() => window.location.reload(), 500);
    }, 150); // Slightly longer delay for mobile devices
    
    console.log('✅ Logout process completed');
  };

  const value = {
    user,
    loading,
    login,
    registerClient,
    registerCoach,
    logout,
    isAuthenticated: !!user && authChecked
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}