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
import { auditLogger, AuditRequest } from '../utils/auditLogger';

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
    // Step 1:  Validate input
    console.log('\n📋 Step 1: Validating input...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('✅ Input validation passed');

    const { email, password, firstName, lastName, phone, dateOfBirth } = req.body as RegisterClientDto;

    // Step 1.5: Validate birthday if provided
    if (dateOfBirth) {
      console.log('\n📅 Step 1.5: Validating birthday...');
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      
      // Check if birthday is a valid date
      if (isNaN(birthDate.getTime())) {
        console.log('❌ Invalid birthday format');
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid birthday format' 
        });
      }
      
      // Check if birthday is not in the future
      if (birthDate > today) {
        console.log('❌ Birthday is in the future');
        return res.status(400).json({ 
          success: false, 
          message: 'Birthday cannot be in the future' 
        });
      }
      
      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Check minimum age (18 years old for professional coaching services)
      if (age < 18) {
        console.log('❌ User is under 18 years old');
        return res.status(400).json({ 
          success: false, 
          message: 'You must be at least 18 years old to register for coaching services' 
        });
      }
      
      // Check maximum age (120 years old - reasonable limit)
      if (age > 120) {
        console.log('❌ Age exceeds reasonable limit');
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid birthday - age exceeds reasonable limit' 
        });
      }
      
      console.log(`✅ Birthday validation passed (Age: ${age})`);
    }

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

    // Step 8: Generate email verification token
    console.log('\n🔐 Step 8: Generating email verification token...');
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        email: email.toLowerCase(),
        token: verificationToken,
        expires_at: verificationExpiry.toISOString(),
        user_role: 'client',
        user_id: profile.id,
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('⚠️ Failed to store verification token:', tokenError);
      // Continue with registration even if verification token fails
    } else {
      console.log('✅ Verification token generated and stored');
    }

    // Step 9: Send verification email
    console.log('\n📧 Step 9: Sending verification email...');
    try {
      const emailResult = await emailService.sendEmailVerification({
        email: email,
        first_name: firstName,
        role: 'client'
      }, verificationToken);

      if (emailResult.success) {
        console.log('✅ Verification email sent successfully');
      } else {
        console.log('⚠️ Warning: Verification email failed to send:', emailResult.error);
        console.log('📋 Email error details:', emailResult.details);
      }
    } catch (emailError) {
      console.log('⚠️ Warning: Verification email failed to send:', emailError.message);
      // Don't fail registration if email fails
    }

    // Step 10: Send success response
    const response: AuthResponse = {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: {
        id: profile.id, // Use the client profile ID
        email: email,
        role: 'client',
        email_verified: false, // New users are not verified
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

    // Step 8: Generate email verification token
    console.log('\n🔐 Step 8: Generating email verification token...');
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get the coach ID first
    const { data: coachData } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', email)
      .single();

    if (coachData) {
      // Store verification token
      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .insert({
          email: email.toLowerCase(),
          token: verificationToken,
          expires_at: verificationExpiry.toISOString(),
          user_role: 'coach',
          user_id: coachData.id,
          created_at: new Date().toISOString()
        });

      if (tokenError) {
        console.error('⚠️ Failed to store verification token:', tokenError);
        // Continue with registration even if verification token fails
      } else {
        console.log('✅ Verification token generated and stored');
      }
    }

    // Step 9: Send verification email
    console.log('\n📧 Step 9: Sending verification email...');
    try {
      const emailResult = await emailService.sendEmailVerification({
        email: email,
        first_name: firstName,
        role: 'coach'
      }, verificationToken);

      if (emailResult.success) {
        console.log('✅ Verification email sent successfully');
      } else {
        console.log('⚠️ Warning: Verification email failed to send:', emailResult.error);
        console.log('📋 Email error details:', emailResult.details);
      }
    } catch (emailError) {
      console.log('⚠️ Warning: Verification email failed to send:', emailError.message);
      // Don't fail registration if email fails
    }

    // Step 10: Send success response
    const response: AuthResponse = {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email || email,
        role: 'coach',
        email_verified: false // New coaches are not verified
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

    // Check email verification for clients and coaches (not admins or staff)
    if ((role === 'client' || role === 'coach') && profile.email_verified === false) {
      console.log(`⚠️ ${role} email not verified:`, email);
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        statusCode: 'EMAIL_NOT_VERIFIED',
        email: email
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

    // Log successful login
    const auditReq = req as AuditRequest;
    auditReq.user = {
      id: profile.id,
      userId: profile.id,
      email: email,
      role: role,
      first_name: profile.first_name,
      last_name: profile.last_name
    };
    await auditLogger.logLogin(auditReq, email, role, true);

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

    // Log failed login attempt
    const { email } = req.body;
    if (email) {
      const auditReq = req as AuditRequest;
      // Try to determine role from email lookup
      let attemptedRole = 'unknown';
      const { data: adminCheck } = await supabase.from('admins').select('id').ilike('email', email).single();
      if (adminCheck) attemptedRole = 'admin';
      else {
        const { data: staffCheck } = await supabase.from('staff').select('id').ilike('email', email).single();
        if (staffCheck) attemptedRole = 'staff';
        else {
          const { data: clientCheck } = await supabase.from('clients').select('id').ilike('email', email).single();
          if (clientCheck) attemptedRole = 'client';
          else {
            const { data: coachCheck } = await supabase.from('coaches').select('id').ilike('email', email).single();
            if (coachCheck) attemptedRole = 'coach';
          }
        }
      }
      await auditLogger.logLogin(auditReq, email, attemptedRole, false);
    }

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

export const forgotPassword = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🔐 FORGOT PASSWORD REQUEST STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Email:', req.body.email);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    console.log('\n🔍 Step 1: Looking up user profile...');

    // Check if user exists in any role (client, coach, admin, staff)
    let userProfile = null;
    let userRole: 'client' | 'coach' | 'admin' | 'staff' | null = null;

    // Check admin
    const { data: adminProfile } = await supabase
      .from('admins')
      .select('*')
      .ilike('email', email)
      .single();

    if (adminProfile) {
      userProfile = adminProfile;
      userRole = 'admin';
      console.log('✅ Found admin profile');
    } else {
      // Check staff
      const { data: staffProfile } = await supabase
        .from('staff')
        .select('*')
        .ilike('email', email)
        .single();

      if (staffProfile) {
        userProfile = staffProfile;
        userRole = 'staff';
        console.log('✅ Found staff profile');
      } else {
        // Check client
        const { data: clientProfile } = await supabase
          .from('clients')
          .select('*')
          .ilike('email', email)
          .single();

        if (clientProfile) {
          userProfile = clientProfile;
          userRole = 'client';
          console.log('✅ Found client profile');
        } else {
          // Check coach
          const { data: coachProfile } = await supabase
            .from('coaches')
            .select('*')
            .ilike('email', email)
            .single();

          if (coachProfile) {
            userProfile = coachProfile;
            userRole = 'coach';
            console.log('✅ Found coach profile');
          }
        }
      }
    }

    // Always return success to prevent email enumeration
    if (!userProfile || !userRole) {
      console.log('⚠️ User not found, but returning success to prevent enumeration');
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset code to your email.'
      });
    }

    console.log('\n🎲 Step 2: Generating OTP...');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now (extended for better UX)

    console.log('OTP generated:', otp);
    console.log('Current time:', new Date().toISOString());
    console.log('OTP expires at:', otpExpiry.toISOString());

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('password_reset_otps')
      .upsert({
        email: email.toLowerCase(),
        otp: otp,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Store as UTC
        user_role: userRole,
        user_id: userProfile.id,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (otpError) {
      console.error('❌ Failed to store OTP:', otpError);
      throw otpError;
    }
    console.log('✅ OTP stored in database');

    console.log('\n📧 Step 3: Sending OTP email...');

    try {
      const emailResult = await emailService.sendPasswordResetOTP({
        email: email,
        firstName: userProfile.first_name || userProfile.email,
        otp: otp,
        role: userRole
      });

      if (emailResult.success) {
        console.log('✅ Password reset OTP email sent successfully');
      } else {
        console.error('⚠️ Failed to send OTP email:', emailResult.error);
        // Don't fail the request - user might still be able to use the OTP
      }
    } catch (emailError) {
      console.error('⚠️ Email service error:', emailError);
      // Don't fail the request
    }

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ FORGOT PASSWORD COMPLETED');
    console.log(`Total time: ${duration}ms`);
    console.log('========================================\n');

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset code to your email.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ FORGOT PASSWORD FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error.message);
    console.log('========================================\n');

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
};

export const verifyResetOTP = async (req: Request, res: Response) => {
  console.log('\n========================================');
  console.log('🔍 VERIFY OTP REQUEST STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Email:', req.body.email);
  console.log('OTP:', req.body.otp);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    console.log('\n🔍 Step 1: Looking up OTP record...');

    // Get OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .single();

    console.log('OTP lookup result:', {
      found: !!otpRecord,
      error: otpError?.message || 'none'
    });

    if (otpError || !otpRecord) {
      console.log('❌ OTP record not found or error occurred');

      // Let's also check if there's an OTP for this email with any code
      const { data: anyOtpRecord } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (anyOtpRecord) {
        console.log('Found OTP record for email but wrong code. Expected:', anyOtpRecord.otp, 'Got:', otp);
      } else {
        console.log('No OTP record found for this email at all');
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    console.log('\n🔍 Step 2: Checking expiry...');
    console.log('OTP record details:', {
      created_at: otpRecord.created_at,
      expires_at: otpRecord.expires_at,
      otp: otpRecord.otp
    });

    // Check if OTP is expired - ensure we're working with UTC timestamps
    const now = new Date();
    const expiryTime = new Date(otpRecord.expires_at + (otpRecord.expires_at.includes('Z') ? '' : 'Z')); // Ensure UTC

    console.log('Time check:', {
      now: now.toISOString(),
      expiry: expiryTime.toISOString(),
      rawExpiry: otpRecord.expires_at,
      isExpired: now > expiryTime,
      minutesRemaining: Math.round((expiryTime.getTime() - now.getTime()) / (1000 * 60)),
      timeDiffMs: expiryTime.getTime() - now.getTime()
    });

    if (now > expiryTime) {
      console.log('❌ OTP has expired');
      // Clean up expired OTP
      await supabase
        .from('password_reset_otps')
        .delete()
        .eq('id', otpRecord.id);

      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    console.log('✅ OTP verified successfully');

    // Mark OTP as verified and extend expiry for password reset step
    const extendedExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for password reset
    await supabase
      .from('password_reset_otps')
      .update({
        expires_at: extendedExpiry.toISOString(),
        // Add a verified flag if you want to track this
      })
      .eq('id', otpRecord.id);

    console.log('✅ OTP expiry extended for password reset step');

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        email: email,
        otpValid: true
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying your OTP'
    });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('📧 RESEND VERIFICATION EMAIL REQUEST STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Email:', req.body.email);

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    console.log('\n🔍 Step 1: Looking up user...');

    // Check if user exists and get their info
    let userProfile = null;
    let userRole: 'client' | 'coach' = 'client';

    // Check client
    const { data: clientProfile } = await supabase
      .from('clients')
      .select('*')
      .ilike('email', email)
      .single();

    if (clientProfile) {
      userProfile = clientProfile;
      userRole = 'client';
      console.log('✅ Found client profile');
    } else {
      // Check coach
      const { data: coachProfile } = await supabase
        .from('coaches')
        .select('*')
        .ilike('email', email)
        .single();

      if (coachProfile) {
        userProfile = coachProfile;
        userRole = 'coach';
        console.log('✅ Found coach profile');
      }
    }

    if (!userProfile) {
      console.log('❌ No user found for email:', email);
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification email has been sent.'
      });
    }

    // Check if already verified
    if (userProfile.email_verified === true) {
      console.log('✅ Email already verified');
      return res.status(400).json({
        success: false,
        message: 'Your email is already verified. You can log in now.',
        statusCode: 'ALREADY_VERIFIED'
      });
    }

    console.log('\n🔐 Step 2: Generating new verification token...');
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete old verification tokens for this email
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('email', email.toLowerCase());

    // Store new verification token
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        email: email.toLowerCase(),
        token: verificationToken,
        expires_at: verificationExpiry.toISOString(),
        user_role: userRole,
        user_id: userProfile.id,
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('❌ Failed to store verification token:', tokenError);
      throw tokenError;
    }

    console.log('✅ New verification token generated and stored');

    console.log('\n📧 Step 3: Sending verification email...');
    try {
      const emailResult = await emailService.sendEmailVerification({
        email: email,
        first_name: userProfile.first_name,
        role: userRole
      }, verificationToken);

      if (emailResult.success) {
        console.log('✅ Verification email sent successfully');
      } else {
        console.log('⚠️ Warning: Verification email failed to send:', emailResult.error);
      }
    } catch (emailError) {
      console.log('⚠️ Warning: Verification email failed to send:', emailError);
      // Don't fail the request if email fails
    }

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ RESEND VERIFICATION EMAIL COMPLETED');
    console.log(`Total time: ${duration}ms`);
    console.log('========================================\n');

    res.json({
      success: true,
      message: 'Verification email has been sent. Please check your inbox.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ RESEND VERIFICATION EMAIL FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error.message);
    console.log('========================================\n');

    res.status(500).json({
      success: false,
      message: 'An error occurred while sending verification email. Please try again.'
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('📧 EMAIL VERIFICATION REQUEST STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Token:', req.body.token || req.query.token);

  try {
    const token = req.body.token || req.query.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    console.log('\n🔍 Step 1: Looking up verification token...');

    // Get verification token record
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenRecord) {
      console.log('❌ Verification token not found');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    console.log('✅ Verification token found');

    console.log('\n🔍 Step 2: Checking expiry...');
    const now = new Date();
    const expiryTime = new Date(tokenRecord.expires_at + (tokenRecord.expires_at.includes('Z') ? '' : 'Z'));

    if (now > expiryTime) {
      console.log('❌ Verification token has expired');
      // Clean up expired token
      await supabase
        .from('email_verification_tokens')
        .delete()
        .eq('id', tokenRecord.id);

      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new verification email.'
      });
    }

    console.log('✅ Token is still valid');

    console.log('\n💾 Step 3: Updating user verification status...');

    // Update user's email_verified status based on role
    const userRole = tokenRecord.user_role;
    const userId = tokenRecord.user_id;
    let updateError = null;

    if (userRole === 'client') {
      const { error } = await supabase
        .from('clients')
        .update({ email_verified: true })
        .eq('id', userId);
      updateError = error;
    } else if (userRole === 'coach') {
      const { error } = await supabase
        .from('coaches')
        .update({ email_verified: true })
        .eq('id', userId);
      updateError = error;
    }

    if (updateError) {
      console.error('❌ Failed to update verification status:', updateError);
      throw updateError;
    }

    console.log('✅ Email verification status updated');

    console.log('\n🗑️ Step 4: Cleaning up verification token...');
    // Clean up the used token
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('id', tokenRecord.id);
    console.log('✅ Verification token cleaned up');

    // Send welcome email now that email is verified
    console.log('\n📧 Step 5: Sending welcome email...');
    try {
      const { data: userProfile } = await supabase
        .from(userRole === 'client' ? 'clients' : 'coaches')
        .select('email, first_name')
        .eq('id', userId)
        .single();

      if (userProfile) {
        await emailService.sendWelcomeEmail({
          email: userProfile.email,
          first_name: userProfile.first_name,
          role: userRole
        });
        console.log('✅ Welcome email sent');
      }
    } catch (emailError) {
      console.log('⚠️ Warning: Welcome email failed to send:', emailError);
      // Don't fail verification if email fails
    }

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ EMAIL VERIFICATION COMPLETED SUCCESSFULLY');
    console.log(`Total time: ${duration}ms`);
    console.log('========================================\n');

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to ACT Coaching For Life.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ EMAIL VERIFICATION FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error.message);
    console.log('========================================\n');

    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying your email. Please try again.'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🔐 RESET PASSWORD REQUEST STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Email:', req.body.email);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;

    console.log('\n🔍 Step 1: Verifying OTP...');

    // Get and verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .single();

    if (otpError || !otpRecord) {
      console.log('❌ Invalid OTP');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if OTP is expired (should be extended from verification step)
    const now = new Date();
    const expiryTime = new Date(otpRecord.expires_at + (otpRecord.expires_at.includes('Z') ? '' : 'Z'));

    console.log('Password reset time check:', {
      now: now.toISOString(),
      expiry: expiryTime.toISOString(),
      isExpired: now > expiryTime,
      minutesRemaining: Math.round((expiryTime.getTime() - now.getTime()) / (1000 * 60))
    });

    if (now > expiryTime) {
      console.log('❌ OTP expired during password reset');
      // Clean up expired OTP
      await supabase
        .from('password_reset_otps')
        .delete()
        .eq('id', otpRecord.id);

      return res.status(400).json({
        success: false,
        message: 'Session expired. Please start the password reset process again.'
      });
    }

    console.log('✅ OTP still valid for password reset');

    console.log('✅ OTP verified successfully');

    console.log('\n🔐 Step 2: Hashing new password...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ Password hashed');

    console.log('\n💾 Step 3: Updating password in database...');

    // Update password based on user role
    const userRole = otpRecord.user_role;
    const userId = otpRecord.user_id;
    let updateError = null;

    if (userRole === 'admin') {
      const { error } = await supabase
        .from('admins')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);
      updateError = error;
    } else if (userRole === 'staff') {
      const { error } = await supabase
        .from('staff')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);
      updateError = error;
    } else if (userRole === 'client') {
      const { error } = await supabase
        .from('clients')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);
      updateError = error;
    } else if (userRole === 'coach') {
      const { error } = await supabase
        .from('coaches')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);
      updateError = error;
    }

    if (updateError) {
      console.error('❌ Failed to update password:', updateError);
      throw updateError;
    }
    console.log('✅ Password updated successfully');

    console.log('\n🗑️ Step 4: Cleaning up OTP...');
    // Clean up the used OTP
    await supabase
      .from('password_reset_otps')
      .delete()
      .eq('id', otpRecord.id);
    console.log('✅ OTP cleaned up');

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ PASSWORD RESET COMPLETED SUCCESSFULLY');
    console.log(`Total time: ${duration}ms`);
    console.log('========================================\n');

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ PASSWORD RESET FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error.message);
    console.log('========================================\n');

    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password. Please try again.'
    });
  }
};