export interface User {
  id: string;
  email: string;
  role: 'client' | 'coach' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Client extends User {
  role: 'client';
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
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

export interface AuthRequest extends Express.Request {
  user?: User | Client | Coach;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'client' | 'coach' | 'admin';
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
  specialties: string[];
  languages: string[];
  bio?: string;
  qualifications?: string[];
  experience?: number;
  hourlyRate?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Partial<User | Client | Coach>;
}