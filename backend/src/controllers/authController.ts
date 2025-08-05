import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { 
  RegisterClientDto, 
  RegisterCoachDto, 
  LoginDto, 
  AuthResponse,
  JWTPayload 
} from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

export const registerClient = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, dateOfBirth } = req.body as RegisterClientDto;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create client profile
    const { error: profileError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('id', user.id);
      throw profileError;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'client'
    });

    const response: AuthResponse = {
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: 'client'
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

export const registerCoach = async (req: Request, res: Response) => {
  try {
    console.log('Coach registration request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      specialties,
      languages,
      bio,
      qualifications,
      experience,
      hourlyRate
    } = req.body as RegisterCoachDto;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        role: 'coach',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create coach profile
    const { error: profileError } = await supabase
      .from('coaches')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        specialties,
        languages,
        bio,
        qualifications,
        experience,
        hourly_rate: hourlyRate,
        is_available: true,
        rating: 0,
        total_sessions: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('id', user.id);
      throw profileError;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'coach'
    });

    const response: AuthResponse = {
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: 'coach'
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body as LoginDto;

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Get user profile based on role
    let profile = null;
    if (user.role === 'client') {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    } else if (user.role === 'coach') {
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ...profile
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};

export const getProfile = async (req: Request & { user?: JWTPayload }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, created_at, updated_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get profile based on role
    let profile = null;
    if (user.role === 'client') {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    } else if (user.role === 'coach') {
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    }

    res.json({
      success: true,
      user: {
        ...user,
        ...profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile' 
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Since we're using JWT, we don't need to do anything server-side
  // The client should remove the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};