import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  role: 'client' | 'coach' | 'admin' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}

export interface Client extends User {
  role: 'client';
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  email_verified?: boolean;
  preferences?: {
    specialties?: string[];
    languages?: string[];
    gender?: 'male' | 'female' | 'other' | 'no-preference';
  };
}

export interface Coach extends User {
  role: 'coach';
  firstName: string;
  lastName: string;
  phone?: string;
  email_verified?: boolean;
  specialties: string[];
  languages: string[];
  bio?: string;
  qualifications?: string[];
  experience?: number;
  hourlyRate?: number;
  isAvailable: boolean;
  rating?: number;
  totalSessions?: number;
}

export interface Staff extends User {
  role: 'staff';
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  role_level: 'staff' | 'supervisor' | 'manager' | 'admin';
  employee_id?: string;
  hire_date?: Date;
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'intern';
  bio?: string;
  supervisor_id?: string;
  skills?: string[];
  certifications?: string[];
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role: 'client' | 'coach' | 'admin' | 'staff';
}

export interface RegisterClientDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface RegisterCoachDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Partial<User | Client | Coach | Staff>;
}