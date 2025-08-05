'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: 'client' | 'coach' | 'admin';
  firstName?: string;
  lastName?: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/profile`);
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user
      setUser(user);
      
      // Redirect based on role
      console.log('User role:', user.role);
      if (user.role === 'client') {
        console.log('Redirecting client to /dashboard');
        setTimeout(() => {
          router.replace('/dashboard');
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user
      setUser(user);
      
      // Redirect to dashboard
      router.push('/dashboard');
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
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
    delete axios.defaults.headers.common['Authorization'];
    
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
    isAuthenticated: !!user
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