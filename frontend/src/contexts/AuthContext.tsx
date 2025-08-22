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
  login: (email: string, password: string) => Promise<void>;
  registerClient: (data: RegisterClientData) => Promise<void>;
  registerCoach: (data: RegisterCoachData) => Promise<void>;
  logout: () => void;
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
  specialties: string[];
  languages: string[];
  bio?: string;
  qualifications?: string[];
  experience?: number;
  hourlyRate?: number;
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

  const logout = () => {
    // Remove token
    localStorage.removeItem('token');
    try {
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.warn('Could not delete axios default headers:', error);
    }
    
    // Reset theme to light
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    
    // Clear user
    setUser(null);
    
    // Redirect to home
    router.push('/');
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