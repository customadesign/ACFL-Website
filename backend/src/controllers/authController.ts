import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { coachService } from '../services/coachService';
import { 
  RegisterClientDto, 
  RegisterCoachDto, 
  LoginDto, 
  AuthResponse,
  JWTPayload 
} from '../types/auth';
import emailService from '../services/emailService';

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
      .ilike('email', email)
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

    // Step 6: Hash password and store it
    console.log('\n🔐 Step 6: Hashing password...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update the client with hashed password
    const { error: updateError } = await supabase
      .from('clients')
      .update({ password_hash: hashedPassword })
      .eq('id', profile.id);
    
    if (updateError) {
      console.error('❌ Failed to update password:', updateError);
      throw updateError;
    }
    console.log('✅ Password hashed and stored');

    // Step 7: Generate JWT token
    console.log('\n🔑 Step 7: Generating JWT token...');
    const token = generateToken({
      id: profile.id,
      userId: profile.id, // Use the client profile ID
      email: email,
      role: 'client'
    });
    console.log('✅ JWT token generated');

    // Step 8: Send welcome email
    console.log('\n📧 Step 8: Sending welcome email...');
    try {
      const emailResult = await emailService.sendWelcomeEmail({
        email: email,
        first_name: firstName,
        role: 'client'
      });
      
      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully');
      } else {
        console.log('⚠️ Warning: Welcome email failed to send:', emailResult.error);
        console.log('📋 Email error details:', emailResult.details);
      }
    } catch (emailError) {
      console.log('⚠️ Warning: Welcome email failed to send:', emailError.message);
      // Don't fail registration if email fails
    }

    // Step 9: Send success response
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

    // Emit admin notification for new client registration
    const io = req.app.get('io');
    if (io) {
      io.to('admin:notifications').emit('admin:new_client', {
        id: profile.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        created_at: new Date().toISOString()
      });
    }

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
      phone
    } = req.body as RegisterCoachDto;

    // Step 2: Check for existing coach
    console.log('\n🔍 Step 2: Checking for existing coach...');
    console.log('Querying coaches table for email:', email);
    
    const { data: existingCoaches, error: checkError } = await supabase
      .from('coaches')
      .select('id, email')
      .ilike('email', email);

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

    // Step 5: Create coach profile with upsert to prevent duplicates
    console.log('\n💾 Step 5: Creating coach profile...');
    const profileData = {
      email: email,
      first_name: firstName,
      last_name: lastName,
      phone,
      is_available: true,
      bio: 'Professional ACT coach ready to help you achieve your goals',
      years_experience: 1,
      // hourly_rate_usd removed - rates now managed in coach_rates table
      qualifications: ['Certified Life Coach'],
      specialties: [],
      languages: ['English'],
      rating: 4.5, // Default rating for new coaches
    };
    console.log('Profile data:', profileData);
    
    // Use upsert to handle potential race conditions
    const { error: profileError } = await supabase
      .from('coaches')
      .upsert(profileData, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      });

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

    // Step 6: Hash password and update coach record
    console.log('\n🔐 Step 6: Hashing password...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update coach with password hash
    const { error: updateError } = await supabase
      .from('coaches')
      .update({ password_hash: hashedPassword })
      .eq('email', email);
    
    // Create default rate for new coach (75 USD per hour)
    if (!updateError && profileData) {
      try {
        // Get the coach ID
        const { data: coach } = await supabase
          .from('coaches')
          .select('id')
          .eq('email', email)
          .single();
        
        if (coach) {
          await coachService.setDefaultRate(coach.id, 75);
          console.log('✅ Default rate created for coach');
        }
      } catch (rateError) {
        console.error('⚠️ Failed to create default rate:', rateError);
        // Non-critical error, continue with registration
      }
    }
    
    if (updateError) {
      console.error('❌ Failed to update coach password:', updateError);
      if (isNewUser) {
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('❌ Failed to rollback user creation:', deleteError);
        }
      }
      throw updateError;
    }
    console.log('✅ Password hashed and stored');

    // Step 7: Generate JWT token
    console.log('\n🔑 Step 7: Generating JWT token...');
    const token = generateToken({
      id: authData.user.id,
      userId: authData.user.id,
      email: authData.user.email || email,
      role: 'coach'
    });
    console.log('✅ JWT token generated');

    // Step 8: Send welcome email
    console.log('\n📧 Step 8: Sending welcome email...');
    try {
      const emailResult = await emailService.sendWelcomeEmail({
        email: email,
        first_name: firstName,
        role: 'coach'
      });
      
      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully');
      } else {
        console.log('⚠️ Warning: Welcome email failed to send:', emailResult.error);
        console.log('📋 Email error details:', emailResult.details);
      }
    } catch (emailError) {
      console.log('⚠️ Warning: Welcome email failed to send:', emailError.message);
      // Don't fail registration if email fails
    }

    // Step 9: Send success response
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

    // Emit admin notification for new coach registration
    const io = req.app.get('io');
    if (io) {
      io.to('admin:notifications').emit('admin:new_coach', {
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        created_at: new Date().toISOString()
      });
    }

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
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🔐 LOGIN ATTEMPT STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Email:', req.body.email);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body as LoginDto;

    console.log('\n🔍 Step 1: Looking up user profile...');

    // Check if user has a profile (client, coach, admin, or staff)
    let profile = null;
    let role: 'client' | 'coach' | 'admin' | 'staff' = 'client';

    // First check for admin profile (case-insensitive)
    const { data: adminProfile, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .ilike('email', email)
      .single();

    if (adminProfile) {
      profile = adminProfile;
      role = 'admin';
      console.log('✅ Found admin profile');
    } else {
      // Check for staff profile (case-insensitive)
      const { data: staffProfile, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .ilike('email', email)
        .single();

      if (staffProfile) {
        profile = staffProfile;
        role = 'staff';
        console.log('✅ Found staff profile');
      } else {
        // Look for client profile by email (case-insensitive)
        const { data: clientProfile, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .ilike('email', email)
          .single();

        if (clientProfile) {
          profile = clientProfile;
          role = 'client';
          console.log('✅ Found client profile');
        } else {
          // Check for coach profile if no client profile (case-insensitive)
          const { data: coachProfile, error: coachError } = await supabase
            .from('coaches')
            .select('*')
            .ilike('email', email)
            .single();

          if (coachProfile) {
            profile = coachProfile;
            role = 'coach';
            console.log('✅ Found coach profile');
          }
        }
      }
    }

    if (!profile) {
      console.log('❌ No profile found for email:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if user is suspended or deactivated (only for clients, coaches, and staff - not admins)
    console.log(`👤 User status check for ${email}: ${profile.status || 'no status'} (role: ${role})`);
    if (profile.status && role !== 'admin') {
      if (profile.status === 'suspended') {
        console.log('⚠️ User account is suspended:', email);
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please check your email for more information or contact support to appeal this decision.',
          statusCode: 'ACCOUNT_SUSPENDED'
        });
      }
      
      if (profile.status === 'inactive' || profile.status === 'deactivated') {
        console.log('⚠️ User account is deactivated:', email);
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please check your email for reactivation instructions or contact support.',
          statusCode: 'ACCOUNT_DEACTIVATED'
        });
      }

      if (profile.status === 'rejected') {
        console.log('⚠️ User account was rejected:', email);
        return res.status(403).json({
          success: false,
          message: 'Your account application was not approved. Please check your email for more information or contact support if you believe this is an error.',
          statusCode: 'ACCOUNT_REJECTED'
        });
      }

      if (profile.status === 'pending') {
        console.log('⚠️ User account is still pending approval:', email);
        return res.status(403).json({
          success: false,
          message: 'Your account is still pending approval. Please wait for admin review or check your email for updates.',
          statusCode: 'ACCOUNT_PENDING'
        });
      }

      // Allow active, approved, and other valid statuses to continue
      if (profile.status === 'active' || profile.status === 'approved') {
        console.log(`✅ User account status is valid: ${profile.status}`);
      }
    }

    console.log('\n🔐 Step 2: Validating password...');
    
    // Check if profile has a password hash
    if (!profile.password_hash) {
      console.log('❌ No password hash found for user');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, profile.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Password validation failed');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    console.log('✅ Password validation successful');

    console.log('\n🔑 Step 3: Generating JWT token...');
    const token = generateToken({
      id: profile.id,
      userId: profile.id,
      email: email,
      role: role
    });
    console.log('✅ JWT token generated');

    // Update last_login timestamp
    console.log('\n🔄 Step 4: Updating last login timestamp...');
    const now = new Date().toISOString();
    
    try {
      if (role === 'admin') {
        await supabase
          .from('admins')
          .update({ last_login: now })
          .eq('id', profile.id);
      } else if (role === 'staff') {
        await supabase
          .from('staff')
          .update({ last_login: now })
          .eq('id', profile.id);
      } else if (role === 'client') {
        await supabase
          .from('clients')
          .update({ last_login: now })
          .eq('id', profile.id);
      } else if (role === 'coach') {
        await supabase
          .from('coaches')
          .update({ last_login: now })
          .eq('id', profile.id);
      }
      console.log('✅ Last login timestamp updated');
    } catch (loginUpdateError) {
      console.log('⚠️ Failed to update last login (non-critical):', loginUpdateError.message);
      // Don't fail the login if this update fails
    }

    // Remove password_hash from response
    const { password_hash, ...safeProfile } = profile;

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: profile.id,
        email: email,
        role: role,
        ...safeProfile
      }
    };

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`Total time: ${duration}ms`);
    console.log('User ID:', profile.id);
    console.log('Role:', role);
    console.log('========================================\n');

    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ LOGIN FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error.message);
    console.log('========================================\n');
    
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
    let role: 'client' | 'coach' | 'admin' | 'staff' = req.user.role;

    if (req.user.role === 'admin') {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .ilike('email', req.user.email)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        return res.status(404).json({
          success: false,
          message: 'Admin profile not found'
        });
      }
      profile = data;
    } else if (req.user.role === 'staff') {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .ilike('email', req.user.email)
        .single();

      if (error) {
        console.error('Error fetching staff profile:', error);
        return res.status(404).json({
          success: false,
          message: 'Staff profile not found'
        });
      }
      profile = data;
    } else if (req.user.role === 'client') {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('email', req.user.email)
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
        .ilike('email', req.user.email)
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

export const createAdmin = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🚀 ADMIN CREATION STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request body:', {
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName
  });

  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check for existing admin
    console.log('\n🔍 Checking for existing admin...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('id, email')
      .ilike('email', email)
      .single();

    if (existingAdmin) {
      console.log('⚠️ Email already exists in admins table');
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin profile
    console.log('\n💾 Creating admin profile...');
    const adminData = {
      email: email,
      first_name: firstName,
      last_name: lastName,
      password_hash: hashedPassword,
      role: 'admin',
      is_active: true
    };

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .insert(adminData)
      .select()
      .single();

    if (adminError) {
      console.error('❌ Admin creation failed:', adminError);
      throw adminError;
    }

    console.log('✅ Admin created successfully');

    // Generate JWT token
    console.log('\n🔑 Generating JWT token...');
    const token = generateToken({
      id: admin.id,
      userId: admin.id,
      email: email,
      role: 'admin'
    });

    // Remove password_hash from response
    const { password_hash, ...safeAdmin } = admin;

    const response: AuthResponse = {
      success: true,
      message: 'Admin created successfully',
      token,
      user: {
        id: admin.id,
        email: email,
        role: 'admin',
        ...safeAdmin
      }
    };

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ ADMIN CREATION COMPLETED SUCCESSFULLY');
    console.log(`Total time: ${duration}ms`);
    console.log('Admin ID:', admin.id);
    console.log('Email:', email);
    console.log('========================================\n');

    res.status(201).json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ ADMIN CREATION FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error.message);
    console.log('========================================\n');

    res.status(500).json({
      success: false,
      message: 'Admin creation failed'
    });
  }
};

export const logout = async (req: Request & { user?: JWTPayload }, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🔓 LOGOUT REQUEST STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User:', req.user?.email || 'anonymous');
  console.log('Role:', req.user?.role || 'unknown');

  try {
    // Log the logout activity if user is authenticated
    if (req.user) {
      console.log('\n📝 Recording logout activity...');
      try {
        const now = new Date().toISOString();
        
        // Update last_logout timestamp based on role
        if (req.user.role === 'admin') {
          await supabase
            .from('admins')
            .update({ last_logout: now })
            .eq('id', req.user.id);
        } else if (req.user.role === 'staff') {
          await supabase
            .from('staff')
            .update({ last_logout: now })
            .eq('id', req.user.id);
        } else if (req.user.role === 'client') {
          await supabase
            .from('clients')
            .update({ last_logout: now })
            .eq('id', req.user.id);
        } else if (req.user.role === 'coach') {
          await supabase
            .from('coaches')
            .update({ last_logout: now })
            .eq('id', req.user.id);
        }
        
        console.log('✅ Logout activity recorded');
      } catch (logoutUpdateError) {
        console.log('⚠️ Failed to record logout activity (non-critical):', logoutUpdateError.message);
        // Don't fail the logout if this update fails
      }
    }

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ LOGOUT COMPLETED SUCCESSFULLY');
    console.log(`Total time: ${duration}ms`);
    console.log('========================================\n');

    // Send success response
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ LOGOUT FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error.message);
    console.log('========================================\n');
    
    // Still return success since JWT logout is primarily client-side
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};