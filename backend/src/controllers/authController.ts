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
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🚀 CLIENT REGISTRATION STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request body:', {
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone || 'not provided',
    dateOfBirth: req.body.dateOfBirth || 'not provided'
  });

  try {
    // Step 1: Validate input
    console.log('\n📋 Step 1: Validating input...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('✅ Input validation passed');

    const { email, password, firstName, lastName, phone, dateOfBirth } = req.body as RegisterClientDto;

    // Step 2: Check for existing client
    console.log('\n🔍 Step 2: Checking for existing client...');
    console.log('Querying clients table for email:', email);
    
    const { data: existingClient, error: checkClientError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingClient) {
      console.log('⚠️ Email already exists in clients table');
      console.log('Existing client ID:', existingClient.id);
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    console.log('✅ No existing client found, proceeding with registration');

    // Step 3: Create auth user (simplified for now)
    console.log('\n👤 Step 3: Creating auth user with Supabase Auth...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.SUPABASE_SERVICE_KEY);
    
    // For now, skip Supabase Auth and create client directly
    console.log('⚠️ Skipping Supabase Auth for now - creating client directly');
    const isNewUser = false; // We're not creating an auth user

    // Step 4: Skip email confirmation for now
    console.log('\n📧 Step 4: Email confirmation...');
    console.log('Skipping email confirmation for now');

    // Step 5: Create client profile
    console.log('\n💾 Step 5: Creating client profile...');
    
    // Create the client profile directly (no foreign key constraint)
    const profileData = {
      email: email,
      first_name: firstName,
      last_name: lastName,
      phone,
      dob: dateOfBirth,
    };
    console.log('Profile data:', profileData);
    
    const { data: profile, error: profileError } = await supabase
      .from('clients')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Client profile creation failed:', profileError.message);
      console.error('Error code:', profileError.code);
      console.error('Full error:', profileError);
      
      // Skip rollback for now since we're not creating auth users
      console.log('⚠️ Skipping rollback - no auth user to delete');
      throw profileError;
    }
    
    console.log('✅ Client profile created successfully');

    // Step 6: Generate JWT token
    console.log('\n🔑 Step 6: Generating JWT token...');
    const token = generateToken({
      userId: profile.id, // Use the client profile ID
      email: email,
      role: 'client'
    });
    console.log('✅ JWT token generated');

    // Step 7: Send success response
    const response: AuthResponse = {
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: profile.id, // Use the client profile ID
        email: email,
        role: 'client',
        ...profile // Include all profile data
      }
    };

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ REGISTRATION COMPLETED SUCCESSFULLY');
    console.log(`Total time: ${duration}ms`);
    console.log('User ID:', profile.id);
    console.log('Email:', email);
    console.log('========================================\n');

    res.status(201).json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ REGISTRATION FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    console.log('========================================\n');
    
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

export const registerCoach = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🚀 COACH REGISTRATION STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request body:', {
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone || 'not provided',
    specialties: req.body.specialties || [],
    languages: req.body.languages || [],
    bio: req.body.bio || 'not provided',
    qualifications: req.body.qualifications || 'not provided',
    experience: req.body.experience || 'not provided',
    hourlyRate: req.body.hourlyRate || 'not provided'
  });

  try {
    // Step 1: Validate input
    console.log('\n📋 Step 1: Validating input...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('✅ Input validation passed');

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

    // Step 2: Check for existing coach
    console.log('\n🔍 Step 2: Checking for existing coach...');
    console.log('Querying coaches table for email:', email);
    
    const { data: existingCoaches, error: checkError } = await supabase
      .from('coaches')
      .select('id, email')
      .eq('email', email);

    // Only check for actual errors, not "no rows found" 
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Database error checking existing coach:', checkError);
      throw checkError;
    }

    if (existingCoaches && existingCoaches.length > 0) {
      console.log('⚠️ Email already exists in coaches table');
      console.log('Existing coach ID:', existingCoaches[0].id);
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    console.log('✅ No existing coach found, proceeding with registration');

    // Step 3: Create auth user
    console.log('\n👤 Step 3: Creating auth user with Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError.message);
      console.error('Error code:', authError.code);
      console.error('Full error:', authError);
      
      // Don't delete anything - just return error
      if (authError.message.includes('already registered')) {
        console.log('⚠️ User already exists in auth.users');
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      throw authError;
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth signup');
      throw new Error('User creation failed');
    }
    
    console.log('✅ Auth user created successfully');
    console.log('Auth user ID:', authData.user.id);
    console.log('Auth user email:', authData.user.email);
    
    // Track if this is a new user we just created
    const isNewUser = true;

    // Step 4: Auto-confirm email in development
    console.log('\n📧 Step 4: Email confirmation...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode - attempting to auto-confirm email...');
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          authData.user.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.log('⚠️ Warning: Could not auto-confirm email:', confirmError.message);
          console.log('User will need to confirm email manually');
        } else {
          console.log('✅ Email auto-confirmed for immediate login');
        }
      } else {
        console.log('Production mode - email confirmation required');
      }
    } catch (confirmErr) {
      console.log('⚠️ Warning: Email auto-confirmation failed:', confirmErr);
      // Continue with registration
    }

    // Step 5: Create coach profile
    console.log('\n💾 Step 5: Creating coach profile...');
    const profileData = {
      email: email,
      first_name: firstName,
      last_name: lastName,
      phone,
      is_available: true,
      bio,
      years_experience: experience || null,
      hourly_rate_usd: hourlyRate || null,
      qualifications,
      specialties: specialties || [],
      languages: languages || [],
      rating: 4.5, // Default rating for new coaches
    };
    console.log('Profile data:', profileData);
    
    const { error: profileError } = await supabase
      .from('coaches')
      .insert(profileData);

    if (profileError) {
      console.error('❌ Coach profile creation failed:', profileError.message);
      console.error('Error code:', profileError.code);
      console.error('Full error:', profileError);
      
      // Only delete the auth user if we just created it in this request
      // Never delete existing users!
      if (isNewUser) {
        console.log('🔄 Rolling back - deleting newly created auth user...');
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('✅ Rollback completed - auth user deleted');
        } catch (deleteError) {
          console.error('❌ Failed to rollback user creation:', deleteError);
        }
      }
      throw profileError;
    }
    
    console.log('✅ Coach profile created successfully');

    // Step 6: Generate JWT token
    console.log('\n🔑 Step 6: Generating JWT token...');
    const token = generateToken({
      userId: authData.user.id,
      email: authData.user.email || email,
      role: 'coach'
    });
    console.log('✅ JWT token generated');

    // Step 7: Send success response
    const response: AuthResponse = {
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email || email,
        role: 'coach'
      }
    };

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ COACH REGISTRATION COMPLETED SUCCESSFULLY');
    console.log(`Total time: ${duration}ms`);
    console.log('User ID:', authData.user.id);
    console.log('Email:', email);
    console.log('========================================\n');

    res.status(201).json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ COACH REGISTRATION FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    console.log('========================================\n');
    
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

    // For now, skip Supabase Auth and check profiles directly
    console.log('Attempting login for email:', email);

    // Check if user has a client profile
    let profile = null;
    let role: 'client' | 'coach' | 'admin' = 'client'; // Default role
    
    // Look for client profile by email
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();
    
    if (clientProfile) {
      profile = clientProfile;
      role = 'client';
      console.log('Found client profile');
    } else {
      // Check for coach profile if no client profile
      const { data: coachProfile, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('email', email)
        .single();
      
      if (coachProfile) {
        profile = coachProfile;
        role = 'coach';
        console.log('Found coach profile');
      }
    }

    if (!profile) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate token
    const token = generateToken({
      userId: profile.id, // Use the profile ID
      email: email,
      role: role
    });

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: profile.id, // Use the profile ID
        email: email,
        role: role,
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

    console.log('Getting profile for user:', req.user);

    // Get profile based on role (skip Supabase Auth)
    let profile = null;
    let role: 'client' | 'coach' | 'admin' = req.user.role;
    
    if (req.user.role === 'client') {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', req.user.userId)
        .single();
      
      if (error) {
        console.error('Error fetching client profile:', error);
        return res.status(404).json({ 
          success: false, 
          message: 'Client profile not found' 
        });
      }
      profile = data;
    } else if (req.user.role === 'coach') {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', req.user.userId)
        .single();
      
      if (error) {
        console.error('Error fetching coach profile:', error);
        return res.status(404).json({ 
          success: false, 
          message: 'Coach profile not found' 
        });
      }
      profile = data;
    }

    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        role: role,
        created_at: profile.created_at,
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