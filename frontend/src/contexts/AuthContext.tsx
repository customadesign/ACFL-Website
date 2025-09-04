'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getApiUrl } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'client' | 'coach' | 'admin';
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
          console.log('Checking authentication with token...');
          const response = await axios.get(`${API_URL}/api/auth/profile`);
          console.log('Auth check successful:', response.data.user);
          setUser(response.data.user);
        } catch (error: any) {
          console.error('Auth check failed:', error);
          // Only remove token if it's a 401 or 404 error (not network issues)
          if (error.response?.status === 401 || error.response?.status === 404) {
            console.log('Removing invalid token');
            localStorage.removeItem('token');
            try {
              try {
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.warn('Could not delete axios default headers:', error);
    }
            } catch (error) {
              console.warn('Could not delete axios default headers:', error);
            }
            setUser(null);
          } else if (retryCount < 2) {
            // Retry on network errors
            console.log(`Network error, retrying... (${retryCount + 1}/3)`);
            setTimeout(() => checkAuth(retryCount + 1), 1000);
            return;
          } else {
            console.log('Max retries reached, keeping token for manual retry');
          }
        }
      } else {
        console.log('No token found');
      }
      setLoading(false);
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, skipRedirect?: boolean) => {
    try {
      console.log('Attempting login with:', email);
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
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
        if (user.role === 'client') {
          console.log('Redirecting client to /clients');
          setTimeout(() => {
            router.replace('/clients');
          }, 100);
        } else if (user.role === 'coach') {
          console.log('Redirecting coach to /coaches');
          setTimeout(() => {
            router.replace('/coaches');
          }, 100);
        } else if (user.role === 'admin') {
          console.log('Redirecting admin to /admin');
          setTimeout(() => {
            router.replace('/admin');
          }, 100);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
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
      
      // Redirect to client dashboard
      router.push('/clients');
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
      
      // Redirect to coach dashboard
      router.push('/coaches');
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
        console.log('🔄 Admin logout - redirecting to login page');
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