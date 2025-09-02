import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample test data for coach application
const testApplication = {
  firstName: 'Jane',
  lastName: 'TestCoach',
  email: `coach.test.${Date.now()}@example.com`,
  phone: '+15551234567',
  
  educationalBackground: "Master's Degree",
  coachingExperienceYears: '3-5 years',
  professionalCertifications: [
    'ICF (International Coach Federation) Certified',
    'ACT Training Certificate'
  ],
  
  coachingExpertise: [
    'Life transitions',
    'Career development', 
    'Stress management',
    'Anxiety & worry',
    'Self-esteem & confidence'
  ],
  ageGroupsComfortable: [
    'Young adults (18-25)',
    'Adults (26-64)'
  ],
  actTrainingLevel: 'Yes, formal ACT training/certification',
  
  coachingPhilosophy: 'I believe in empowering clients to discover their own strengths and values through ACT principles. My approach focuses on psychological flexibility and helping clients live meaningful lives aligned with their values.',
  coachingTechniques: [
    'Mindfulness practices',
    'Values clarification',
    'Goal setting & action planning',
    'Cognitive Behavioral Techniques'
  ],
  sessionStructure: 'Semi-structured with flexibility',
  
  scopeHandlingApproach: 'When a client presents needs beyond my scope, I first acknowledge their concerns with empathy. I explain my professional boundaries clearly and provide appropriate referrals to mental health professionals or specialists who can better serve their specific needs.',
  professionalDisciplineHistory: false,
  disciplineExplanation: '',
  boundaryMaintenanceApproach: 'Clear communication from the start',
  
  comfortableWithSuicidalThoughts: 'Comfortable with assessment and referral',
  selfHarmProtocol: 'I conduct immediate risk assessment, ensure client safety, provide crisis hotline resources, and facilitate connection to emergency services or mental health professionals as needed. I document all interventions and follow up within 24 hours.',
  
  weeklyHoursAvailable: '20-30 hours',
  preferredSessionLength: '50 minutes',
  availabilityTimes: [
    'Weekday mornings',
    'Weekday evenings'
  ],
  
  videoConferencingComfort: 'Very comfortable',
  internetConnectionQuality: 'High-speed cable',
  
  languagesFluent: ['English'],
  
  references: [
    {
      name: 'Dr. Sarah Johnson',
      title: 'Clinical Supervisor',
      organization: 'Wellness Center Inc.',
      email: 'sarah.johnson@example.com',
      phone: '+15551234568'
    },
    {
      name: 'Michael Brown',
      title: 'Program Director',
      organization: 'Community Coaching Services',
      email: 'michael.brown@example.com',
      phone: '+15551234569'
    }
  ],
  
  agreementsAccepted: {
    termsOfService: true,
    confidentiality: true,
    scopeOfPractice: true,
    platformTerms: true,
    discretionaryApproval: true,
    professionalInsurance: true,
    responseTime: true,
    refundPolicy: true
  }
};

// Get admin token for approval (you'll need to create an admin user first)
async function getAdminToken() {
  // This is a placeholder - you'll need to implement admin authentication
  // For testing, you can manually get a token from your admin user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com', // Replace with your admin email
    password: 'admin123!' // Replace with your admin password
  });
  
  if (error) {
    throw new Error('Failed to get admin token. Make sure you have an admin user created.');
  }
  
  return data.session?.access_token;
}

async function testFullCoachFlow() {
  console.log('🚀 Testing Full Coach Application and Approval Flow\n');
  
  let applicationId: string;
  
  // Step 1: Submit coach application
  console.log('📝 Step 1: Submitting coach application...');
  try {
    const response = await fetch(`${API_URL}/api/coach-applications/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testApplication),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Application submission failed: ${errorData.message}`);
    }

    const applicationData = await response.json() as any;
    applicationId = applicationData.application.id;
    console.log('✅ Application submitted successfully!');
    console.log('Application ID:', applicationId);
    console.log('Email:', testApplication.email);
  } catch (error) {
    console.error('❌ Application submission failed:', error);
    return;
  }

  // Step 2: Check coaches table before approval
  console.log('\n🔍 Step 2: Checking coaches table before approval...');
  try {
    const { data: coachesBefore, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('email', testApplication.email);

    if (error) throw error;
    
    console.log(`Found ${coachesBefore?.length || 0} coaches with this email before approval`);
  } catch (error) {
    console.error('❌ Error checking coaches table:', error);
  }

  // Step 3: Approve the application
  console.log('\n✅ Step 3: Approving application...');
  try {
    // For testing purposes, we'll use a dummy reviewer ID
    // In real usage, this would be the actual admin user ID
    const reviewerId = 'test-admin-id-123';
    
    const approvalResponse = await fetch(`${API_URL}/api/coach-applications/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'd need proper admin authentication
        // 'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        reviewerId: reviewerId,
        reason: 'Application meets all requirements for approval'
      }),
    });

    if (!approvalResponse.ok) {
      const errorData = await approvalResponse.json() as any;
      throw new Error(`Approval failed: ${errorData.message}`);
    }

    console.log('✅ Application approved successfully!');
  } catch (error) {
    console.error('❌ Application approval failed:', error);
    console.log('\n💡 Note: The approval might fail due to authentication requirements.');
    console.log('To test the approval manually:');
    console.log('1. Log into the admin panel at http://localhost:3000/admin');
    console.log(`2. Find application ID: ${applicationId}`);
    console.log('3. Click "Approve" to test coach profile creation');
    return;
  }

  // Step 4: Check if coach was created
  console.log('\n🔍 Step 4: Checking if coach profile was created...');
  try {
    const { data: coachesAfter, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('email', testApplication.email);

    if (error) throw error;
    
    if (coachesAfter && coachesAfter.length > 0) {
      console.log('✅ Coach profile created successfully!');
      console.log('Coach ID:', coachesAfter[0].id);
      console.log('Coach Name:', coachesAfter[0].first_name, coachesAfter[0].last_name);
      console.log('Specialties:', coachesAfter[0].specialties);
      console.log('Status:', coachesAfter[0].status);
    } else {
      console.log('❌ Coach profile was not created');
    }
  } catch (error) {
    console.error('❌ Error checking coach creation:', error);
  }

  // Step 5: Check coach demographics
  console.log('\n🔍 Step 5: Checking coach demographics...');
  try {
    const { data: demographics, error } = await supabase
      .from('coach_demographics')
      .select('*')
      .eq('coach_id', applicationId);

    if (error) throw error;
    
    if (demographics && demographics.length > 0) {
      console.log('✅ Coach demographics created successfully!');
      console.log('Languages:', demographics[0].languages);
      console.log('Timezone:', demographics[0].timezone);
    } else {
      console.log('ℹ️  Coach demographics not found (this is optional)');
    }
  } catch (error) {
    console.error('⚠️  Error checking coach demographics:', error);
  }

  console.log('\n🏁 Test completed!');
  console.log('\n📋 Summary:');
  console.log('- Application ID:', applicationId);
  console.log('- Test Email:', testApplication.email);
  console.log('- Check admin panel:', `http://localhost:3000/admin/coach-applications`);
}

// Run the test
testFullCoachFlow().then(() => {
  console.log('\n✅ Full flow test complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});