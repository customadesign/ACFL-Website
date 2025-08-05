import { Request, Response } from 'express';

// Mock data - same as in matchController but with additional fields for profile pages
const coaches = [
  {
    id: "1",
    name: "Richard Peng",
    specialties: ["Anxiety", "Depression"],
    modalities: ["ACT", "Mindfulness-Based Coaching", "Values-Based Action Planning"],
    location: ["CA", "NY"],
    demographics: { gender: "Male", ethnicity: "Asian American, Taiwanese", religion: "None" },
    availability: 2,
    matchScore: 95,
    languages: ["English"],
    bio: "I'm a certified ACT coach specializing in anxiety and stress management. Using acceptance and commitment therapy principles, I've spent over 10 years helping clients develop psychological flexibility, align with their values, and build resilience in their daily lives.",
    sexualOrientation: "Gay / lesbian",
    availableTimes: ["Weekday Mornings", "Weekday Afternoons"],
    email: "richard.peng@actcoaching.com",
    phone: "(555) 123-4567",
    experience: "10+ years",
    education: "M.A. in Counseling Psychology, Stanford University",
    certifications: ["Certified ACT Coach", "Mindfulness-Based Stress Reduction (MBSR)", "ICF Professional Certified Coach (PCC)"],
    insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "United Healthcare", "Cigna"],
    sessionRate: "$150-200/session",
    virtualAvailable: true,
    inPersonAvailable: true
  },
  {
    id: "2",
    name: "Alice Zhang",
    specialties: ["Depression", "Mindfulness"],
    modalities: ["ACT", "Mindfulness-Based Stress Reduction", "Values Clarification", "Committed Action Planning"],
    location: ["CA"],
    demographics: { gender: "Female", ethnicity: "Chinese Canadian", religion: "Buddhist" },
    availability: 10,
    matchScore: 94,
    languages: ["English", "Hindi", "French"],
    bio: "I'm a certified ACT coach with expertise in mindfulness and values-based living. I focus on supporting clients experiencing low mood and stress by integrating ACT principles, mindfulness practices, and helping them connect with what matters most to find meaning and vitality in their lives.",
    sexualOrientation: "Straight / heterosexual",
    availableTimes: ["Weekday Evenings", "Weekends"],
    email: "alice.zhang@actcoaching.com",
    phone: "(555) 234-5678",
    experience: "8 years",
    education: "Ph.D. in Clinical Psychology, UC Berkeley",
    certifications: ["Certified ACT Trainer", "MBSR Teacher Certification", "ICF Master Certified Coach (MCC)"],
    insuranceAccepted: ["Kaiser Permanente", "Anthem", "Health Net"],
    sessionRate: "$175-225/session",
    virtualAvailable: true,
    inPersonAvailable: false
  },
  {
    id: "3",
    name: "Maria Rodriguez",
    specialties: ["Trauma Recovery", "Anxiety", "Depression"],
    modalities: ["ACT", "EMDR", "Trauma-Informed Care"],
    location: ["TX", "FL"],
    demographics: { gender: "Female", ethnicity: "Hispanic", religion: "Catholic" },
    availability: 5,
    matchScore: 93,
    languages: ["English", "Spanish"],
    bio: "Bilingual ACT coach specializing in trauma recovery and anxiety management. I help clients heal from past experiences while building psychological flexibility and reconnecting with their core values.",
    sexualOrientation: "Straight / heterosexual",
    availableTimes: ["Weekday Afternoons", "Weekday Evenings"],
    email: "maria.rodriguez@actcoaching.com",
    phone: "(555) 345-6789",
    experience: "12 years",
    education: "M.S.W., Columbia University",
    certifications: ["Certified ACT Coach", "EMDR Certified", "Trauma-Informed Care Specialist"],
    insuranceAccepted: ["United Healthcare", "Cigna", "Humana", "Medicare"],
    sessionRate: "$160-210/session",
    virtualAvailable: true,
    inPersonAvailable: true
  },
  {
    id: "4",
    name: "David Thompson",
    specialties: ["Work Stress", "Relationships", "Life Transitions"],
    modalities: ["ACT", "Values-Based Living", "Mindfulness"],
    location: ["NY", "NJ"],
    demographics: { gender: "Male", ethnicity: "White", religion: "Christian" },
    availability: 8,
    matchScore: 92,
    languages: ["English"],
    bio: "Executive coach with 15 years of experience helping professionals navigate workplace stress and major life transitions using ACT principles.",
    sexualOrientation: "Straight / heterosexual",
    availableTimes: ["Weekday Mornings", "Weekends"],
    email: "david.thompson@actcoaching.com",
    phone: "(555) 456-7890",
    experience: "15 years",
    education: "MBA, Wharton School; M.A. in Psychology, NYU",
    certifications: ["Certified ACT Coach", "ICF Professional Certified Coach (PCC)", "Executive Leadership Certificate"],
    insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "Self-Pay"],
    sessionRate: "$200-250/session",
    virtualAvailable: true,
    inPersonAvailable: true
  },
  {
    id: "5",
    name: "Keisha Williams",
    specialties: ["Racial Identity", "Academic Stress", "Self-Esteem"],
    modalities: ["ACT", "Cultural Awareness", "Identity Development"],
    location: ["GA", "SC"],
    demographics: { gender: "Female", ethnicity: "Black", religion: "Baptist" },
    availability: 6,
    matchScore: 91,
    languages: ["English"],
    bio: "Specializing in racial identity exploration and academic success using ACT frameworks. I help students and professionals embrace their authentic selves while achieving their goals.",
    sexualOrientation: "Straight / heterosexual",
    availableTimes: ["Weekday Afternoons", "Weekends"],
    email: "keisha.williams@actcoaching.com",
    phone: "(555) 567-8901",
    experience: "9 years",
    education: "Ph.D. in Counseling Psychology, Emory University",
    certifications: ["Certified ACT Coach", "Cultural Competency Specialist", "Academic Success Coach"],
    insuranceAccepted: ["Medicaid", "Blue Cross Blue Shield", "United Healthcare"],
    sessionRate: "$140-180/session",
    virtualAvailable: true,
    inPersonAvailable: true
  },
  // Adding more profiles with basic details - in a real application, you'd want full details for all
  {
    id: "6",
    name: "Dr. Sarah Kim",
    specialties: ["Anxiety", "Perfectionism", "Work-Life Balance"],
    modalities: ["ACT", "Mindfulness", "Self-Compassion"],
    location: ["WA", "OR"],
    demographics: { gender: "Female", ethnicity: "Korean American", religion: "None" },
    availability: 4,
    matchScore: 90,
    languages: ["English", "Korean"],
    bio: "Former therapist turned ACT coach, specializing in helping high-achievers overcome perfectionism and find work-life balance through mindfulness and values alignment.",
    sexualOrientation: "Straight / heterosexual",
    availableTimes: ["Weekday Evenings", "Weekends"],
    email: "sarah.kim@actcoaching.com",
    phone: "(555) 678-9012",
    experience: "11 years",
    education: "Ph.D. in Clinical Psychology, University of Washington",
    certifications: ["Licensed Clinical Psychologist", "Certified ACT Coach", "Mindfulness-Based Stress Reduction Instructor"],
    insuranceAccepted: ["Kaiser Permanente", "Premera", "Regence"],
    sessionRate: "$180-230/session",
    virtualAvailable: true,
    inPersonAvailable: true
  },
  {
    id: "7",
    name: "James Mitchell",
    specialties: ["Depression", "Grief", "Addiction Recovery"],
    modalities: ["ACT", "Grief Counseling", "Recovery Support"],
    location: ["CO", "UT"],
    demographics: { gender: "Male", ethnicity: "White", religion: "None" },
    availability: 7,
    matchScore: 89,
    languages: ["English"],
    bio: "ACT coach with personal experience in addiction recovery. I help clients process grief and depression while building commitment to meaningful life changes.",
    sexualOrientation: "Straight / heterosexual",
    availableTimes: ["Weekday Mornings", "Weekday Afternoons"],
    email: "james.mitchell@actcoaching.com",
    phone: "(555) 789-0123",
    experience: "7 years",
    education: "M.A. in Addiction Counseling, University of Colorado",
    certifications: ["Certified ACT Coach", "Certified Addiction Counselor", "Grief Recovery Specialist"],
    insuranceAccepted: ["Anthem", "Kaiser Permanente", "United Healthcare"],
    sessionRate: "$130-170/session",
    virtualAvailable: true,
    inPersonAvailable: true
  },
  // Continue with abbreviated profiles for the remaining coaches to save space
  // In a real application, you'd want full details for all 100+ coaches
  {
    id: "8",
    name: "Priya Patel",
    specialties: ["Anxiety", "Cultural Identity", "Family Relationships"],
    modalities: ["ACT", "Family Systems", "Cultural Integration"],
    location: ["CA", "NV"],
    demographics: { gender: "Female", ethnicity: "Indian American", religion: "Hindu" },
    availability: 9,
    matchScore: 88,
    languages: ["English", "Hindi", "Gujarati"],
    bio: "First-generation immigrant coach helping clients navigate cultural identity and family expectations while staying true to personal values through ACT principles.",
    sexualOrientation: "Straight / heterosexual",
    availableTimes: ["Weekday Evenings", "Weekends"],
    email: "priya.patel@actcoaching.com",
    phone: "(555) 890-1234",
    experience: "6 years",
    education: "M.S. in Counseling Psychology, Palo Alto University",
    certifications: ["Certified ACT Coach", "Family Systems Specialist"],
    insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "Cigna"],
    sessionRate: "$155-195/session",
    virtualAvailable: true,
    inPersonAvailable: false
  }
  // Note: For brevity, I'm showing just the first 8 detailed profiles.
  // In a real application, you'd want to include all 102 coaches with full profile details.
  // The matching algorithm in matchController.ts will return all 102 coaches,
  // but the individual profile pages will only work for coaches 1-8 with full details.
];

export const getCoachById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Import supabase at the top of the function
    const { supabase } = require('../lib/supabase');
    
    // Fetch coach from database
    const { data: coach, error } = await supabase
      .from('coaches')
      .select(`
        *,
        users (email),
        coach_demographics (
          gender,
          ethnicity,
          religion,
          location_states,
          available_times,
          video_available,
          in_person_available,
          phone_available,
          insurance_accepted,
          min_age,
          max_age
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    
    if (!coach) {
      console.log('No coach found with ID:', id);
      return res.status(404).json({ error: 'Coach not found' });
    }
    
    // Format the response to match the expected structure
    const demographics = coach.coach_demographics || {};
    const formattedCoach = {
      id: coach.id,
      name: `${coach.first_name} ${coach.last_name}`,
      specialties: coach.specialties || [],
      modalities: ["ACT"], // Default to ACT since all coaches use ACT
      location: demographics.location_states || [],
      demographics: {
        gender: demographics.gender || '',
        ethnicity: demographics.ethnicity || '',
        religion: demographics.religion || ''
      },
      availability: coach.is_available ? 1 : 0,
      matchScore: 0,
      languages: coach.languages || [],
      bio: coach.bio || '',
      sexualOrientation: '', // Not stored in current schema
      availableTimes: demographics.available_times || [],
      email: coach.users?.email || '',
      phone: coach.phone || '',
      experience: coach.experience ? `${coach.experience} years` : '',
      education: '', // Not stored in current schema
      certifications: coach.qualifications || [],
      insuranceAccepted: demographics.insurance_accepted || [],
      sessionRate: coach.hourly_rate ? `$${coach.hourly_rate}/session` : '',
      virtualAvailable: demographics.video_available || true,
      inPersonAvailable: demographics.in_person_available || false
    };
    
    res.json(formattedCoach);
  } catch (error) {
    console.error('Error fetching coach:', error);
    res.status(500).json({ error: 'Failed to fetch coach profile' });
  }
}; 