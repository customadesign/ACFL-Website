import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Sample test data for coach application
const testApplication = {
  // Basic Information
  firstName: 'John',
  lastName: 'TestCoach',
  email: `coach.test.${Date.now()}@example.com`,
  phone: '+15551234567',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  
  // Professional Background
  educationalBackground: "Master's Degree",
  coachingExperienceYears: '3-5 years',
  professionalCertifications: [
    'ICF (International Coach Federation) Certified',
    'ACT Training Certificate'
  ],
  
  // Specialization & Expertise
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
  
  // Approach & Methodology
  coachingPhilosophy: 'I believe in empowering clients to discover their own strengths and values through ACT principles. My approach focuses on psychological flexibility and helping clients live meaningful lives aligned with their values.',
  coachingTechniques: [
    'Mindfulness practices',
    'Values clarification',
    'Goal setting & action planning',
    'Cognitive Behavioral Techniques'
  ],
  sessionStructure: 'Semi-structured with flexibility',
  
  // Professional Boundaries & Ethics
  scopeHandlingApproach: 'When a client presents needs beyond my scope, I first acknowledge their concerns with empathy. I explain my professional boundaries clearly and provide appropriate referrals to mental health professionals or specialists who can better serve their specific needs.',
  professionalDisciplineHistory: false,
  disciplineExplanation: '',
  boundaryMaintenanceApproach: 'Clear communication from the start',
  
  // Crisis Management
  comfortableWithSuicidalThoughts: 'Comfortable with assessment and referral',
  selfHarmProtocol: 'I conduct immediate risk assessment, ensure client safety, provide crisis hotline resources, and facilitate connection to emergency services or mental health professionals as needed. I document all interventions and follow up within 24 hours.',
  
  // Availability & Commitment
  weeklyHoursAvailable: '20-30 hours',
  preferredSessionLength: '50 minutes',
  availabilityTimes: [
    'Weekday mornings',
    'Weekday evenings',
    'Weekend mornings'
  ],
  
  // Technology & Communication
  videoConferencingComfort: 'Very comfortable',
  internetConnectionQuality: 'Excellent (fiber/cable)',
  
  // Languages & Cultural Competency
  languagesFluent: ['English', 'Spanish'],
  
  // Professional References
  references: [
    {
      name: 'Dr. Sarah Johnson',
      title: 'Clinical Supervisor',
      organization: 'Wellness Center Inc.',
      email: 'sarah.johnson@example.com',
      phone: '+1234567891'
    },
    {
      name: 'Michael Brown',
      title: 'Program Director',
      organization: 'Community Coaching Services',
      email: 'michael.brown@example.com',
      phone: '+1234567892'
    }
  ],
  
  // Agreement Statements
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

async function testCoachApplicationSubmission() {
  console.log('🚀 Testing Coach Application Submission\n');
  console.log('API URL:', API_URL);
  console.log('Test Email:', testApplication.email);
  console.log('\n📝 Submitting application...\n');

  try {
    const response = await fetch(`${API_URL}/api/coach-applications/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testApplication),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response:', responseText);
      return;
    }

    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Application submitted successfully!');
      console.log('Application ID:', responseData.application?.id);
      console.log('\n📧 Check for confirmation email at:', testApplication.email);
      console.log('\n🔍 To view in admin panel:');
      console.log('1. Log in as admin at http://localhost:3000/login');
      console.log('2. Navigate to http://localhost:3000/admin/coach-applications');
    } else {
      console.error('\n❌ Application submission failed:');
      console.error('Error:', responseData.message || 'Unknown error');
      if (responseData.errors) {
        console.error('Validation errors:', responseData.errors);
      }
    }
  } catch (error) {
    console.error('\n❌ Network error:', error);
    console.error('Make sure the backend server is running on port 3001');
  }
}

// Run the test
testCoachApplicationSubmission().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
});