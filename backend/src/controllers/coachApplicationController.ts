import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { coachService } from '../services/coachService';
import emailService from '../services/emailService';
import bcrypt from 'bcrypt';

interface CoachApplicationData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  
  // Professional Background (Section 1)
  educationalBackground: string;
  coachingExperienceYears: string;
  professionalCertifications: string[];
  
  // Specialization & Expertise (Section 2)
  coachingExpertise: string[];
  ageGroupsComfortable: string[];
  actTrainingLevel: string;
  
  // Approach & Methodology (Section 3)
  coachingPhilosophy: string;
  coachingTechniques: string[];
  sessionStructure: string;
  
  // Professional Boundaries & Ethics (Section 4)
  scopeHandlingApproach: string;
  professionalDisciplineHistory: boolean;
  disciplineExplanation?: string;
  boundaryMaintenanceApproach: string;
  
  // Crisis Management (Section 5)
  comfortableWithSuicidalThoughts: string;
  selfHarmProtocol: string;
  
  // Availability & Commitment (Section 6)
  weeklyHoursAvailable: string;
  preferredSessionLength: string;
  availabilityTimes: string[];
  
  // Technology & Communication (Section 7)
  videoConferencingComfort: string;
  internetConnectionQuality: string;
  
  // Languages & Cultural Competency (Section 8)
  languagesFluent: string[];
  
  // Professional References
  references: Array<{
    name: string;
    title: string;
    organization: string;
    email: string;
    phone?: string;
  }>;
  
  // Agreement Statements
  agreementsAccepted: {
    termsOfService: boolean;
    confidentiality: boolean;
    scopeOfPractice: boolean;
    platformTerms: boolean;
    discretionaryApproval: boolean;
    professionalInsurance: boolean;
    responseTime: boolean;
    refundPolicy: boolean;
  };
}

export const submitCoachApplication = async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('🚀 COACH APPLICATION SUBMISSION STARTED');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request body keys:', Object.keys(req.body));

  try {
    // Step 1: Validate input
    console.log('\n📋 Step 1: Validating input...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    console.log('✅ Input validation passed');

    const applicationData = req.body as CoachApplicationData;

    // Step 2: Check for existing application
    console.log('\n🔍 Step 2: Checking for existing application...');
    const { data: existingApplication, error: checkError } = await supabase
      .from('coach_applications')
      .select('id, email, status')
      .ilike('email', applicationData.email)
      .single();

    if (existingApplication) {
      console.log('⚠️ Application already exists:', existingApplication);
      return res.status(400).json({
        success: false,
        message: 'An application with this email already exists',
        existingStatus: existingApplication.status
      });
    }
    console.log('✅ No existing application found');

    // Step 3: Validate required agreements
    console.log('\n📝 Step 3: Validating agreements...');
    const requiredAgreements = [
      'termsOfService', 'confidentiality', 'scopeOfPractice', 
      'platformTerms', 'discretionaryApproval', 'responseTime', 'refundPolicy'
    ];
    
    const unacceptedAgreements = requiredAgreements.filter(
      agreement => !applicationData.agreementsAccepted[agreement as keyof typeof applicationData.agreementsAccepted]
    );

    if (unacceptedAgreements.length > 0) {
      console.log('❌ Missing required agreements:', unacceptedAgreements);
      return res.status(400).json({
        success: false,
        message: 'All required agreements must be accepted',
        missingAgreements: unacceptedAgreements
      });
    }
    console.log('✅ All required agreements accepted');

    // Step 4: Validate references
    console.log('\n👥 Step 4: Validating references...');
    if (!applicationData.references || applicationData.references.length < 2) {
      console.log('❌ Insufficient references provided');
      return res.status(400).json({
        success: false,
        message: 'At least 2 professional references are required'
      });
    }

    for (let i = 0; i < applicationData.references.length; i++) {
      const ref = applicationData.references[i];
      if (!ref.name || !ref.title || !ref.organization || !ref.email) {
        console.log(`❌ Incomplete reference ${i + 1}:`, ref);
        return res.status(400).json({
          success: false,
          message: `Reference ${i + 1} is missing required information`
        });
      }
    }
    console.log('✅ References validation passed');

    // Step 5: Hash password
    console.log('\n🔒 Step 5: Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(applicationData.password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Step 6: Create application record
    console.log('\n💾 Step 6: Creating application record...');
    const applicationRecord = {
      email: applicationData.email,
      first_name: applicationData.firstName,
      last_name: applicationData.lastName,
      phone: applicationData.phone,
      password_hash: passwordHash,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      
      // Professional Background
      educational_background: applicationData.educationalBackground,
      coaching_experience_years: applicationData.coachingExperienceYears,
      professional_certifications: applicationData.professionalCertifications,
      
      // Specialization & Expertise
      coaching_expertise: applicationData.coachingExpertise,
      age_groups_comfortable: applicationData.ageGroupsComfortable,
      act_training_level: applicationData.actTrainingLevel,
      
      // Approach & Methodology
      coaching_philosophy: applicationData.coachingPhilosophy,
      coaching_techniques: applicationData.coachingTechniques,
      session_structure: applicationData.sessionStructure,
      
      // Professional Boundaries & Ethics
      scope_handling_approach: applicationData.scopeHandlingApproach,
      professional_discipline_history: applicationData.professionalDisciplineHistory,
      discipline_explanation: applicationData.disciplineExplanation,
      boundary_maintenance_approach: applicationData.boundaryMaintenanceApproach,
      
      // Crisis Management
      comfortable_with_suicidal_thoughts: applicationData.comfortableWithSuicidalThoughts,
      self_harm_protocol: applicationData.selfHarmProtocol,
      
      // Availability & Commitment
      weekly_hours_available: applicationData.weeklyHoursAvailable,
      preferred_session_length: applicationData.preferredSessionLength,
      availability_times: applicationData.availabilityTimes,
      
      // Technology & Communication
      video_conferencing_comfort: applicationData.videoConferencingComfort,
      internet_connection_quality: applicationData.internetConnectionQuality,
      
      // Languages & Cultural Competency
      languages_fluent: applicationData.languagesFluent,
      
      // Professional References
      references: applicationData.references,
      
      // Agreement Statements
      agreements_accepted: applicationData.agreementsAccepted
    };

    const { data: application, error: applicationError } = await supabase
      .from('coach_applications')
      .insert([applicationRecord])
      .select()
      .single();

    if (applicationError) {
      console.error('❌ Application creation failed:', applicationError);
      throw applicationError;
    }

    console.log('✅ Application created successfully');
    console.log('Application ID:', application.id);

    // Step 6: Create audit trail entry
    console.log('\n📋 Step 6: Creating audit trail...');
    const auditEntry = {
      application_id: application.id,
      reviewer_id: null, // System action
      action: 'submitted',
      previous_status: null,
      new_status: 'pending',
      notes: 'Application submitted by applicant',
      created_at: new Date().toISOString()
    };

    const { error: auditError } = await supabase
      .from('coach_application_reviews')
      .insert([auditEntry]);

    if (auditError) {
      console.log('⚠️ Warning: Audit trail creation failed:', auditError);
      // Don't fail the application for audit issues
    } else {
      console.log('✅ Audit trail created');
    }

    // Step 7: Send confirmation email
    console.log('\n📧 Step 7: Sending confirmation email...');
    try {
      const emailResult = await emailService.sendCoachApplicationConfirmation({
        email: applicationData.email,
        first_name: applicationData.firstName,
        application_id: application.id
      });

      if (emailResult.success) {
        console.log('✅ Confirmation email sent successfully');
      } else {
        console.log('⚠️ Warning: Confirmation email failed:', emailResult.error);
      }
    } catch (emailError) {
      console.log('⚠️ Warning: Email service error:', emailError);
      // Don't fail application for email issues
    }

    // Step 8: Send success response
    const response = {
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id,
      status: 'pending',
      submittedAt: application.submitted_at
    };

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ APPLICATION SUBMISSION COMPLETED');
    console.log(`Total time: ${duration}ms`);
    console.log('Application ID:', application.id);
    console.log('========================================\n');

    res.status(201).json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.error('❌ APPLICATION SUBMISSION FAILED');
    console.log(`Total time: ${duration}ms`);
    console.error('Error:', error);
    console.log('========================================\n');

    res.status(500).json({
      success: false,
      message: 'Application submission failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getCoachApplications = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = supabase
      .from('coach_applications')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        rejection_reason,
        coaching_expertise,
        coaching_experience_years,
        act_training_level,
        languages_fluent
      `)
      .order('submitted_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    query = query.range(offset, offset + limitNum - 1);

    const { data: applications, error } = await query;

    if (error) {
      throw error;
    }

    // For each application, try to find the corresponding coach user ID
    const applicationsWithCoachId = await Promise.all(
      (applications || []).map(async (app) => {
        // If application is approved, try to find the coach user ID
        if (app.status === 'approved') {
          const { data: coach } = await supabase
            .from('coaches')
            .select('id')
            .ilike('email', app.email)
            .single();
          
          return {
            ...app,
            coach_id: coach?.id || null
          };
        }
        
        return {
          ...app,
          coach_id: null
        };
      })
    );

    // Get total count for pagination
    let countQuery = supabase
      .from('coach_applications')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      applications: applicationsWithCoachId,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getCoachApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: application, error } = await supabase
      .from('coach_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      throw error;
    }

    // Get review history
    const { data: reviews, error: reviewsError } = await supabase
      .from('coach_application_reviews')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: true });

    if (reviewsError) {
      console.log('Warning: Could not fetch review history:', reviewsError);
    }

    res.json({
      success: true,
      application,
      reviewHistory: reviews || []
    });

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to create coach profile from approved application
const createCoachProfileFromApplication = async (application: any) => {
  try {
    console.log('🔄 Creating coach profile from application...');
    
    // Check if coach profile already exists by email (case-insensitive)
    const { data: existingCoach, error: checkError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', application.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('Error checking for existing coach:', checkError);
    }

    if (existingCoach) {
      console.log('Coach profile already exists, updating with application data...');
      
      // Update existing coach with comprehensive application data
      const updateData = {
        // Basic Information
        first_name: application.first_name,
        last_name: application.last_name,
        phone: application.phone,
        is_available: true,
        status: 'active', // Coach is active when application is approved
        
        // Password hash from application
        password_hash: application.password_hash,
        
        // Core Profile Fields
        bio: application.coaching_philosophy,
        years_experience: parseExperienceYears(application.coaching_experience_years),
        specialties: application.coaching_expertise,
        languages: application.languages_fluent,
        
        // Professional Background
        educational_background: application.educational_background,
        professional_certifications: application.professional_certifications,
        qualifications: application.professional_certifications?.join(', '),
        
        // Specialization & Expertise
        age_groups_comfortable: application.age_groups_comfortable,
        act_training_level: application.act_training_level,
        
        // Approach & Methodology
        coaching_techniques: application.coaching_techniques,
        session_structure: application.session_structure,
        
        // Professional Boundaries & Ethics
        scope_handling_approach: application.scope_handling_approach,
        boundary_maintenance_approach: application.boundary_maintenance_approach,
        
        // Crisis Management
        comfortable_with_suicidal_thoughts: application.comfortable_with_suicidal_thoughts,
        self_harm_protocol: application.self_harm_protocol,
        
        // Availability & Commitment
        weekly_hours_available: application.weekly_hours_available,
        preferred_session_length: application.preferred_session_length,
        availability_times: application.availability_times,
        
        // Technology & Communication
        video_conferencing_comfort: application.video_conferencing_comfort,
        internet_connection_quality: application.internet_connection_quality,
        
        // Application Metadata
        application_id: application.id,
        approved_at: new Date().toISOString(),
        verification_status: 'verified'
      };
      
      const { error: updateError } = await supabase
        .from('coaches')
        .update(updateData)
        .eq('id', existingCoach.id);

      if (updateError) {
        throw updateError;
      }
      
      console.log('✅ Coach profile updated successfully');
      return existingCoach.id;
    }

    // Create new coach profile with comprehensive application data
    console.log('🏗️ Creating new coach profile...');
    const coachData = {
      // Basic Information
      email: application.email,
      first_name: application.first_name,
      last_name: application.last_name,
      phone: application.phone,
      is_available: true,
      status: 'active', // Coach is active when application is approved
      
      // Password hash from application
      password_hash: application.password_hash,
      
      // Core Profile Fields
      bio: application.coaching_philosophy,
      years_experience: parseExperienceYears(application.coaching_experience_years),
      // hourly_rate_usd removed - rates now managed in coach_rates table
      specialties: application.coaching_expertise,
      languages: application.languages_fluent,
      
      // Professional Background
      educational_background: application.educational_background,
      professional_certifications: application.professional_certifications,
      qualifications: application.professional_certifications?.join(', '),
      
      // Specialization & Expertise
      age_groups_comfortable: application.age_groups_comfortable,
      act_training_level: application.act_training_level,
      
      // Approach & Methodology
      coaching_techniques: application.coaching_techniques,
      session_structure: application.session_structure,
      
      // Professional Boundaries & Ethics
      scope_handling_approach: application.scope_handling_approach,
      boundary_maintenance_approach: application.boundary_maintenance_approach,
      
      // Crisis Management
      comfortable_with_suicidal_thoughts: application.comfortable_with_suicidal_thoughts,
      self_harm_protocol: application.self_harm_protocol,
      
      // Availability & Commitment
      weekly_hours_available: application.weekly_hours_available,
      preferred_session_length: application.preferred_session_length,
      availability_times: application.availability_times,
      
      // Technology & Communication
      video_conferencing_comfort: application.video_conferencing_comfort,
      internet_connection_quality: application.internet_connection_quality,
      
      // Application Metadata
      application_id: application.id,
      approved_at: new Date().toISOString(),
      verification_status: 'verified'
    };

    const { data: newCoach, error: createError } = await supabase
      .from('coaches')
      .insert([coachData])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Create default rate for new coach (75 USD per hour)
    try {
      await coachService.setDefaultRate(newCoach.id, 75);
      console.log('✅ Default rate created for approved coach');
    } catch (rateError) {
      console.error('⚠️ Failed to create default rate for approved coach:', rateError);
      // Non-critical error, continue with approval
    }

    // Create coach demographics record
    const demographicsData = {
      coach_id: newCoach.id,
      languages: application.languages_fluent,
      availability: mapAvailabilityTimes(application.availability_times),
      accepts_insurance: false, // Default, can be updated later
      accepts_sliding_scale: false, // Default, can be updated later
      timezone: 'America/New_York', // Default, can be updated later
      meta: {
        video_available: true,
        preferred_session_length: application.preferred_session_length,
        weekly_hours_available: application.weekly_hours_available,
        video_conferencing_comfort: application.video_conferencing_comfort,
        internet_connection_quality: application.internet_connection_quality
      }
    };

    const { error: demographicsError } = await supabase
      .from('coach_demographics')
      .insert([demographicsData]);

    if (demographicsError) {
      console.log('Warning: Coach demographics creation failed:', demographicsError);
      // Don't fail the main process for demographics
    }

    console.log('✅ Coach profile created successfully');
    return newCoach.id;
  } catch (error) {
    console.error('Error creating coach profile:', error);
    throw error;
  }
};

// Helper function to parse experience years into a number
const parseExperienceYears = (experienceString: string): number => {
  const experienceMap: { [key: string]: number } = {
    'Less than 1 year': 0,
    '1-2 years': 1,
    '3-5 years': 3,
    '6-10 years': 6,
    'More than 10 years': 10
  };
  
  return experienceMap[experienceString] || 1;
};

// Helper function to map availability times to coach_availability_option enum
const mapAvailabilityTimes = (availabilityTimes: string[]): string[] => {
  const timeMap: { [key: string]: string } = {
    'Weekday mornings (6am-12pm)': 'weekday_mornings',
    'Weekday afternoons (12pm-5pm)': 'weekday_afternoons',
    'Weekday evenings (5pm-10pm)': 'weekday_evenings',
    'Weekend mornings': 'weekends',
    'Weekend afternoons': 'weekends',
    'Weekend evenings': 'weekends',
    'Late night (10pm-12am)': 'weekday_evenings'
  };
  
  const mappedTimes = availabilityTimes.map(time => timeMap[time]).filter(Boolean);
  
  // Remove duplicates and return
  return [...new Set(mappedTimes)];
};

export const getCoachApplicationStats = async (req: Request, res: Response) => {
  try {
    const { data: applications, error } = await supabase
      .from('coach_applications')
      .select('status, submitted_at, reviewed_at');

    if (error) {
      throw error;
    }

    const stats = {
      total: applications?.length || 0,
      pending: applications?.filter(app => app.status === 'pending').length || 0,
      under_review: applications?.filter(app => app.status === 'under_review').length || 0,
      approved: applications?.filter(app => app.status === 'approved').length || 0,
      rejected: applications?.filter(app => app.status === 'rejected').length || 0,
      suspended: applications?.filter(app => app.status === 'suspended').length || 0,
      averageReviewTime: calculateAverageReviewTime(applications || [])
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application statistics'
    });
  }
};

const calculateAverageReviewTime = (applications: any[]): number => {
  const reviewedApps = applications.filter(app => app.reviewed_at && app.submitted_at);
  
  if (reviewedApps.length === 0) return 0;
  
  const totalTime = reviewedApps.reduce((sum, app) => {
    const submitted = new Date(app.submitted_at).getTime();
    const reviewed = new Date(app.reviewed_at).getTime();
    return sum + (reviewed - submitted);
  }, 0);
  
  // Return average time in hours
  return Math.round(totalTime / reviewedApps.length / (1000 * 60 * 60));
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, reviewerId } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get current application
    const { data: currentApp, error: fetchError } = await supabase
      .from('coach_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      throw fetchError;
    }

    // Update application status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = reviewerId;
    } else if (status === 'rejected') {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = reviewerId;
      updateData.rejection_reason = reason;
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from('coach_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create audit trail entry
    const auditEntry = {
      application_id: id,
      reviewer_id: reviewerId,
      action: status,
      previous_status: currentApp.status,
      new_status: status,
      notes: reason || `Status changed to ${status}`,
      created_at: new Date().toISOString()
    };

    const { error: auditError } = await supabase
      .from('coach_application_reviews')
      .insert([auditEntry]);

    if (auditError) {
      console.log('Warning: Audit trail creation failed:', auditError);
    }

    // Create coach profile if approved
    if (status === 'approved') {
      try {
        console.log('✅ Application approved, creating coach profile...');
        const coachId = await createCoachProfileFromApplication(updatedApp);
        console.log('✅ Coach profile created successfully with ID:', coachId);
      } catch (coachCreationError) {
        console.error('❌ Failed to create coach profile:', coachCreationError);
        // Don't fail the approval process, but log the error
        // Admin can manually create coach profile if needed
      }
    }

    // Send notification email
    try {
      if (status === 'approved') {
        await emailService.sendCoachApprovalEmail({
          email: updatedApp.email,
          first_name: updatedApp.first_name
        });
      } else if (status === 'rejected') {
        await emailService.sendCoachRejectionEmail({
          email: updatedApp.email,
          first_name: updatedApp.first_name,
          rejection_reason: reason || 'Application did not meet our current requirements'
        });
      }
    } catch (emailError) {
      console.log('Warning: Notification email failed:', emailError);
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApp
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const bulkUpdateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { applicationIds, status, reason, reviewerId } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application IDs array is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    console.log(`\n🔄 BULK STATUS UPDATE: ${applicationIds.length} applications to ${status}`);

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Process each application
    for (const applicationId of applicationIds) {
      try {
        // Get current application
        const { data: currentApp, error: fetchError } = await supabase
          .from('coach_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (fetchError) {
          results.failed.push({
            id: applicationId,
            error: 'Application not found'
          });
          continue;
        }

        // Skip if already in target status
        if (currentApp.status === status) {
          results.skipped.push({
            id: applicationId,
            reason: `Already ${status}`
          });
          continue;
        }

        // Update application status
        const updateData: any = {
          status,
          updated_at: new Date().toISOString()
        };

        if (status === 'approved') {
          updateData.reviewed_at = new Date().toISOString();
          updateData.reviewed_by = reviewerId;
        } else if (status === 'rejected') {
          updateData.reviewed_at = new Date().toISOString();
          updateData.reviewed_by = reviewerId;
          updateData.rejection_reason = reason;
        }

        const { data: updatedApp, error: updateError } = await supabase
          .from('coach_applications')
          .update(updateData)
          .eq('id', applicationId)
          .select()
          .single();

        if (updateError) {
          results.failed.push({
            id: applicationId,
            error: updateError.message
          });
          continue;
        }

        // Create audit trail entry
        const auditEntry = {
          application_id: applicationId,
          reviewer_id: reviewerId,
          action: `bulk_${status}`,
          previous_status: currentApp.status,
          new_status: status,
          notes: reason ? `Bulk action: ${reason}` : `Bulk ${status}`,
          created_at: new Date().toISOString()
        };

        await supabase
          .from('coach_application_reviews')
          .insert([auditEntry]);

        // Create coach profile if approved
        if (status === 'approved') {
          try {
            await createCoachProfileFromApplication(updatedApp);
          } catch (profileError) {
            console.log(`Warning: Coach profile creation failed for ${applicationId}:`, profileError);
          }
        }

        // Send notification email
        try {
          if (status === 'approved') {
            await emailService.sendCoachApprovalEmail({
              email: updatedApp.email,
              first_name: updatedApp.first_name
            });
          } else if (status === 'rejected') {
            await emailService.sendCoachRejectionEmail({
              email: updatedApp.email,
              first_name: updatedApp.first_name,
              rejection_reason: reason || 'Application did not meet our current requirements'
            });
          }
        } catch (emailError) {
          console.log(`Warning: Email notification failed for ${applicationId}:`, emailError);
        }

        results.successful.push({
          id: applicationId,
          name: `${updatedApp.first_name} ${updatedApp.last_name}`,
          email: updatedApp.email
        });

      } catch (error) {
        console.error(`Error processing application ${applicationId}:`, error);
        results.failed.push({
          id: applicationId,
          error: error.message || 'Unknown error'
        });
      }
    }

    console.log('Bulk update results:', results);

    res.json({
      success: true,
      message: `Bulk ${status} completed`,
      results: {
        total: applicationIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        details: results
      }
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};