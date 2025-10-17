
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DeactivatedActionButton from '@/components/DeactivatedActionButton'
import { 
  Heart, 
  Calendar, 
  MessageCircle, 
  User, 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  Shield, 
  Video, 
  Users,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  GraduationCap,
  Target,
  ArrowLeft,
  Sparkles,
  DollarSign,
  Languages
} from 'lucide-react'
import GHLBookingCalendar from '@/components/GHLBookingCalendar'
import CoachRating from '@/components/coach/CoachRating'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/lib/api'

// Test Coach IDs - coaches that show all buttons to clients
const TEST_COACH_IDS = [
  'a235efaa-df3a-4583-ae72-b459849736fe', // Test Coach
]

// Test Coach identifiers (email and name as fallback)
const TEST_COACH_IDENTIFIERS = {
  emails: ['coach@acfl.com'],
  names: ['Test Coach']
}

// Helper function to check if a coach is a test coach
const isTestCoach = (coach: { id: string; email?: string; name: string }) => {
  return TEST_COACH_IDS.includes(coach.id) ||
         (coach.email && TEST_COACH_IDENTIFIERS.emails.includes(coach.email)) ||
         TEST_COACH_IDENTIFIERS.names.includes(coach.name)
}

interface Coach {
  id: string
  name: string
  specialties: string[]
  modalities: string[]
  location: string[]
  demographics: {
    gender: string
    ethnicity: string
    religious_background: string
  }
  availability: number
  matchScore: number
  rating: number
  languages: string[]
  bio: string
  sexualOrientation: string
  availableTimes: string[]
  email?: string
  phone?: string
  experience?: string
  education?: string
  certifications?: string[]
  insuranceAccepted?: string[]
  sessionRate?: string
  virtualAvailable?: boolean
  inPersonAvailable?: boolean
  profilePhoto?: string
  
  // Coach Verification Questionnaire Fields
  
  // Section 1: Professional Background
  educationalBackground?: string
  educationalBackgroundOther?: string
  coachingExperienceYears?: string
  professionalCertifications?: string[]
  
  // Section 2: Specialization & Expertise  
  coachingExpertise?: string[]
  coachingExpertiseOther?: string
  ageGroupsComfortable?: string[]
  actTrainingLevel?: string
  
  // Section 3: Approach & Methodology
  coachingPhilosophy?: string
  coachingTechniques?: string[]
  sessionStructure?: string
  
  // Section 4: Ethics & Boundaries
  scopeHandlingApproach?: string
  professionalDisciplineHistory?: boolean
  disciplineExplanation?: string
  boundaryMaintenanceApproach?: string
  boundaryMaintenanceOther?: string
  
  // Section 5: Crisis Management
  comfortableWithSuicidalThoughts?: string
  selfHarmProtocol?: string
  
  // Section 6: Availability & Commitment
  weeklyHoursAvailable?: string
  preferredSessionLength?: string
  availabilityTimes?: string[]
  
  // Section 7: Technology
  videoConferencingComfort?: string
  internetConnectionQuality?: string
  
  // Section 8: Languages & Cultural Competency
  languagesFluent?: string[]
  languagesFluentOther?: string
}

function CoachProfileContent() {
  const params = useParams()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [showBookingCalendar, setShowBookingCalendar] = useState(false)
  const [sessionType, setSessionType] = useState<'consultation' | 'session'>('consultation')
  const [ratingStats, setRatingStats] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 })
  const [canRate, setCanRate] = useState(false)
  const [hasAppointmentHistory, setHasAppointmentHistory] = useState(false)

  useEffect(() => {
    // Fetch coach data based on ID
    const fetchCoach = async () => {
      try {
        const API_URL = getApiUrl()
        console.log('Fetching coach with ID:', params.id)
        const response = await fetch(`${API_URL}/api/coaches/${params.id}`)
        console.log('Coach fetch response status:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('Coach data received:', data)
          setCoach(data)
        } else if (response.status === 404) {
          console.error('Coach not found in database, trying mock data')
          // For now, use mock data
          const mockCoaches: Coach[] = [
            {
              id: '562a2527-dfc9-4c3e-b5b6-8e943b6d8f97',
              name: "Richard Peng",
              specialties: ["Anxiety", "Depression"],
              modalities: ["ACT", "Mindfulness-Based Coaching", "Values-Based Action Planning"],
              location: ["CA", "NY"],
              demographics: {
                gender: "Male",
                ethnicity: "Asian American, Taiwanese",
                religious_background: "None"
              },
              availability: 2,
              matchScore: 95,
              languages: ["English"],
              bio: "I'm a certified ACT coach specializing in anxiety and stress management. Using acceptance and commitment therapy principles, I've spent over 10 years helping clients develop psychological flexibility, align with their values, and build resilience in their daily lives.",
              sexualOrientation: "Gay / lesbian",
              availableTimes: ["weekday_mornings", "weekday_afternoons"],
              email: "richard.peng@actcoaching.com",
              phone: "(555) 123-4567",
              experience: "10+ years",
              education: "M.A. in Counseling Psychology, Stanford University",
              certifications: ["Certified ACT Coach", "Mindfulness-Based Stress Reduction (MBSR)", "ICF Professional Certified Coach (PCC)"],
              insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "United Healthcare", "Cigna"],
              sessionRate: "$150-200/session",
              rating: 4.8,
              virtualAvailable: true,
              inPersonAvailable: true,
              
              // Coach Verification Questionnaire Responses
              
              // Section 1: Professional Background
              educationalBackground: "Master's Degree",
              coachingExperienceYears: "6-10 years", 
              professionalCertifications: ["ICF (International Coach Federation) Certified", "ACT Training Certificate", "Mental Health First Aid"],
              
              // Section 2: Specialization & Expertise
              coachingExpertise: ["Anxiety & worry", "Stress management", "Life transitions", "Self-esteem & confidence", "Work-life balance"],
              ageGroupsComfortable: ["Young adults (18-25)", "Adults (26-64)", "Seniors (65+)"],
              actTrainingLevel: "Yes, formal ACT training/certification",
              
              // Section 3: Approach & Methodology
              coachingPhilosophy: "I believe in empowering clients through acceptance and mindfulness-based approaches. My philosophy centers on helping individuals develop psychological flexibility, align with their core values, and take committed action toward meaningful goals. I create a safe, non-judgmental space where clients can explore their thoughts and emotions while building resilience.",
              coachingTechniques: ["Cognitive Behavioral Techniques", "Mindfulness practices", "Goal setting & action planning", "Values clarification", "Solution-focused techniques", "Motivational interviewing"],
              sessionStructure: "Semi-structured with flexibility",
              
              // Section 4: Ethics & Boundaries  
              scopeHandlingApproach: "I maintain clear professional boundaries and immediately refer clients to appropriate mental health professionals when issues exceed my scope of practice as a coach. I have established relationships with licensed therapists and psychiatrists for seamless referrals. I clearly communicate the differences between coaching and therapy during intake and regularly assess if coaching remains appropriate throughout our work together.",
              professionalDisciplineHistory: false,
              boundaryMaintenanceApproach: "All of the above",
              
              // Section 5: Crisis Management
              comfortableWithSuicidalThoughts: "Yes, I have training and experience",
              selfHarmProtocol: "I follow a structured safety protocol that includes: immediate risk assessment, development of safety plan with the client, connection to crisis resources (988 Suicide & Crisis Lifeline), involvement of support system when appropriate, and follow-up within 24 hours. I maintain current training in crisis intervention and work closely with licensed mental health professionals for ongoing support and consultation.",
              
              // Section 6: Availability & Commitment
              weeklyHoursAvailable: "21-30 hours",
              preferredSessionLength: "60 minutes", 
              availabilityTimes: ["Weekday mornings (6am-12pm)", "Weekday afternoons (12pm-5pm)", "Weekday evenings (5pm-10pm)"],
              
              // Section 7: Technology
              videoConferencingComfort: "Very comfortable - use it regularly",
              internetConnectionQuality: "Excellent - high-speed fiber/cable",
              
              // Section 8: Languages & Cultural Competency
              languagesFluent: ["English"]
            },
            {
              id: '1',
              name: "Richard Peng",
              specialties: ["Anxiety", "Depression"],
              modalities: ["ACT", "Mindfulness-Based Coaching", "Values-Based Action Planning"],
              location: ["CA", "NY"],
              demographics: {
                gender: "Male",
                ethnicity: "Asian American, Taiwanese",
                religious_background: "None"
              },
              availability: 2,
              matchScore: 95,
              languages: ["English"],
              bio: "I'm a certified ACT coach specializing in anxiety and stress management. Using acceptance and commitment therapy principles, I've spent over 10 years helping clients develop psychological flexibility, align with their values, and build resilience in their daily lives.",
              sexualOrientation: "Gay / lesbian",
              availableTimes: ["weekday_mornings", "weekday_afternoons"],
              email: "richard.peng@actcoaching.com",
              phone: "(555) 123-4567",
              experience: "10+ years",
              education: "M.A. in Counseling Psychology, Stanford University",
              certifications: ["Certified ACT Coach", "Mindfulness-Based Stress Reduction (MBSR)", "ICF Professional Certified Coach (PCC)"],
              insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "United Healthcare", "Cigna"],
              sessionRate: "$150-200/session",
              rating: 4.8,
              virtualAvailable: true,
              inPersonAvailable: true,

              // Coach Verification Questionnaire Responses

              // Section 1: Professional Background
              educationalBackground: "Master's Degree",
              coachingExperienceYears: "6-10 years",
              professionalCertifications: ["ICF (International Coach Federation) Certified", "ACT Training Certificate", "Mental Health First Aid"],

              // Section 2: Specialization & Expertise
              coachingExpertise: ["Anxiety & worry", "Stress management", "Life transitions", "Self-esteem & confidence", "Work-life balance"],
              ageGroupsComfortable: ["Young adults (18-25)", "Adults (26-64)", "Seniors (65+)"],
              actTrainingLevel: "Yes, formal ACT training/certification",

              // Section 3: Approach & Methodology
              coachingPhilosophy: "I believe in empowering clients through acceptance and mindfulness-based approaches. My philosophy centers on helping individuals develop psychological flexibility, align with their core values, and take committed action toward meaningful goals. I create a safe, non-judgmental space where clients can explore their thoughts and emotions while building resilience.",
              coachingTechniques: ["Cognitive Behavioral Techniques", "Mindfulness practices", "Goal setting & action planning", "Values clarification", "Solution-focused techniques", "Motivational interviewing"],
              sessionStructure: "Semi-structured with flexibility",

              // Section 4: Ethics & Boundaries
              scopeHandlingApproach: "I maintain clear professional boundaries and immediately refer clients to appropriate mental health professionals when issues exceed my scope of practice as a coach. I have established relationships with licensed therapists and psychiatrists for seamless referrals. I clearly communicate the differences between coaching and therapy during intake and regularly assess if coaching remains appropriate throughout our work together.",
              professionalDisciplineHistory: false,
              boundaryMaintenanceApproach: "All of the above",

              // Section 5: Crisis Management
              comfortableWithSuicidalThoughts: "Yes, I have training and experience",
              selfHarmProtocol: "I follow a structured safety protocol that includes: immediate risk assessment, development of safety plan with the client, connection to crisis resources (988 Suicide & Crisis Lifeline), involvement of support system when appropriate, and follow-up within 24 hours. I maintain current training in crisis intervention and work closely with licensed mental health professionals for ongoing support and consultation.",

              // Section 6: Availability & Commitment
              weeklyHoursAvailable: "21-30 hours",
              preferredSessionLength: "60 minutes",
              availabilityTimes: ["Weekday mornings (6am-12pm)", "Weekday afternoons (12pm-5pm)", "Weekday evenings (5pm-10pm)"],

              // Section 7: Technology
              videoConferencingComfort: "Very comfortable - use it regularly",
              internetConnectionQuality: "Excellent - high-speed fiber/cable",

              // Section 8: Languages & Cultural Competency
              languagesFluent: ["English"]
            },
            {
              id: '2',
              name: "Alice Zhang",
              specialties: ["Depression", "Mindfulness"],
              modalities: ["ACT", "Mindfulness-Based Stress Reduction", "Values Clarification", "Committed Action Planning"],
              location: ["CA"],
              demographics: {
                gender: "Female",
                ethnicity: "Chinese Canadian",
                religious_background: "Buddhist"
              },
              availability: 10,
              matchScore: 88,
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
              rating: 4.9,
              virtualAvailable: true,
              inPersonAvailable: false
            },
            {
              id: '3',
              name: "Nisha Desai",
              specialties: ["Trauma Recovery", "Life Transitions"],
              modalities: ["ACT", "Trauma-Informed ACT", "Acceptance and Mindfulness Practices", "Values-Based Goal Setting"],
              location: ["NY", "FL"],
              demographics: {
                gender: "Female",
                ethnicity: "Indian",
                religious_background: "Hindu"
              },
              availability: 3,
              matchScore: 82,
              languages: ["English", "Spanish"],
              bio: "I'm a trauma-informed ACT coach specializing in helping clients heal from past experiences and navigate major life transitions. Using ACT principles and mindfulness practices, I help clients develop psychological flexibility, reconnect with their values, and move forward with confidence and purpose.",
              sexualOrientation: "Straight / heterosexual",
              availableTimes: ["Weekday Afternoons", "Weekday Evenings"],
              email: "nisha.desai@actcoaching.com",
              phone: "(555) 345-6789",
              experience: "12 years",
              education: "M.S.W., Columbia University",
              certifications: ["Certified ACT Coach", "Trauma-Informed Care Specialist", "EMDR Trained"],
              insuranceAccepted: ["Oxford", "Empire Blue Cross", "Humana", "Medicare"],
              sessionRate: "$160-210/session",
              rating: 4.7,
              virtualAvailable: true,
              inPersonAvailable: true
            }
          ]
          
          const foundCoach = mockCoaches.find(c => c.id === params.id)
          if (foundCoach) {
            setCoach(foundCoach)
          }
        }
      } catch (error) {
        console.error('Error fetching coach:', error)
        // Try mock data as fallback
        const mockCoaches: Coach[] = [
          {
            id: '562a2527-dfc9-4c3e-b5b6-8e943b6d8f97',
            name: "Richard Peng",
            specialties: ["Anxiety", "Depression"],
            modalities: ["ACT", "Mindfulness-Based Coaching", "Values-Based Action Planning"],
            location: ["CA", "NY"],
            demographics: {
              gender: "Male",
              ethnicity: "Asian American, Taiwanese",
              religious_background: "None"
            },
            availability: 2,
            matchScore: 95,
            languages: ["English"],
            bio: "I'm a certified ACT coach specializing in anxiety and stress management.",
            sexualOrientation: "Gay / lesbian",
            availableTimes: ["weekday_mornings", "weekday_afternoons"],
            email: "richard.peng@actcoaching.com",
            phone: "(555) 123-4567",
            experience: "10+ years",
            education: "M.A. in Counseling Psychology, Stanford University",
            certifications: ["Certified ACT Coach"],
            insuranceAccepted: ["Blue Cross Blue Shield"],
            sessionRate: "$150-200/session",
            rating: 4.8,
            virtualAvailable: true,
            inPersonAvailable: true
          }
        ]
        const foundCoach = mockCoaches.find(c => c.id === params.id)
        if (foundCoach) {
          setCoach(foundCoach)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCoach()
    fetchRatingStats()
    if (user) {
      checkAppointmentHistory()
      checkIfCoachIsSaved()
    }
  }, [params.id, user])

  const fetchRatingStats = async () => {
    try {
      const API_URL = getApiUrl()
      console.log('Fetching rating stats for coach:', params.id)
      const response = await fetch(`${API_URL}/api/client/coaches/${params.id}/ratings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      console.log('Rating stats response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Rating stats data:', data)
        setRatingStats({
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0
        })
      } else {
        // Set default values if fetch fails
        setRatingStats({
          averageRating: 0,
          totalReviews: 0
        })
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error)
      // Set default values on error
      setRatingStats({
        averageRating: 0,
        totalReviews: 0
      })
    }
  }

  const checkAppointmentHistory = async () => {
    try {
      const API_URL = getApiUrl()
      console.log('Checking appointment history for user:', user?.id, 'coach:', params.id)
      // Check if the user has any completed appointments with this coach
      const response = await fetch(`${API_URL}/api/client/${user?.id}/coaches/${params.id}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      console.log('History response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('History data:', data)
        setHasAppointmentHistory(data.hasHistory)
        setCanRate(data.hasHistory && !data.hasRated)
      } else {
        // For development/testing, allow rating without history check
        console.log('History check failed, enabling rating for testing')
        setHasAppointmentHistory(true)
        setCanRate(true)
      }
    } catch (error) {
      console.error('Error checking appointment history:', error)
      // For development/testing, allow rating without history check
      setHasAppointmentHistory(true)
      setCanRate(true)
    }
  }

  const checkIfCoachIsSaved = async () => {
    try {
      const API_URL = getApiUrl()
      console.log('Checking if coach is saved for user:', user?.id, 'coach:', params.id)
      const response = await fetch(`${API_URL}/api/client/saved-coaches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      console.log('Saved coaches response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Saved coaches data:', data)
        // Check if this coach is in the saved coaches list
        // The API returns data directly, not data.savedCoaches
        const isCoachSaved = data.data?.some((savedCoach: any) => savedCoach.id === params.id || savedCoach.coach_id === params.id)
        setIsSaved(isCoachSaved || false)
      } else {
        setIsSaved(false)
      }
    } catch (error) {
      console.error('Error checking saved coaches:', error)
      setIsSaved(false)
    }
  }

  const handleBookSession = (type: 'consultation' | 'session' = 'consultation') => {
    setSessionType(type)
    setShowBookingCalendar(true)
  }

  const handleBookingComplete = () => {
    setShowBookingCalendar(false)
    // Could show a success message or refresh data here
  }

  const toggleSaved = async () => {
    if (!user) return

    try {
      const API_URL = getApiUrl()

      if (isSaved) {
        // Remove saved coach
        const response = await fetch(`${API_URL}/api/client/saved-coaches/${coach?.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          setIsSaved(false)
          // Re-check the saved state to ensure synchronization
          checkIfCoachIsSaved()
        } else {
          console.error('Failed to remove saved coach')
        }
      } else {
        // Save coach
        const response = await fetch(`${API_URL}/api/client/saved-coaches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            coachId: coach?.id
          })
        })

        if (response.ok) {
          setIsSaved(true)
          // Re-check the saved state to ensure synchronization
          checkIfCoachIsSaved()
        } else {
          console.error('Failed to save coach')
        }
      }
    } catch (error) {
      console.error('Error toggling saved coach:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <div className="text-xl text-gray-600 dark:text-gray-300">Loading coach profile...</div>
        </div>
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-xl text-gray-600 dark:text-gray-300 mb-4">Coach not found</div>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Page Header with Back Button and Save */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Back to Search</span>
              <span className="xs:hidden">Back</span>
            </Button>
            <DeactivatedActionButton action={isSaved ? "remove saved coach" : "save coach"}>
              <Button
                variant="ghost"
                onClick={toggleSaved}
                className={`flex items-center space-x-1 sm:space-x-2 transition-colors text-sm sm:text-base ${isSaved ? 'text-red-500 hover:text-red-600' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Heart className={`w-4 h-4 transition-all ${isSaved ? 'fill-current scale-110' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
            </DeactivatedActionButton>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-white">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto sm:mx-0">
                  {coach.profilePhoto ? (
                    <img
                      src={coach.profilePhoto}
                      alt={`${coach.name} profile`}
                      className="w-full h-full rounded-full object-cover border-4 border-white/30 shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{coach.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-blue-100 text-sm sm:text-base">
                    <div className="flex items-center justify-center sm:justify-start space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{coach.experience} Experience</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center justify-center sm:justify-start space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{coach.location.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Rating and Match Score */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${i < Math.floor(ratingStats.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-white/30'}`}
                      />
                    ))}
                  </div>
                  <span className="text-base sm:text-lg font-semibold">{ratingStats.averageRating.toFixed(1)}</span>
                  <span className="text-blue-100 text-sm sm:text-base">({ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'})</span>
                </div>
                
                {coach.matchScore && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-base sm:text-lg font-semibold">{coach.matchScore}% Match</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Free Consultation - Visible to coaches OR clients viewing Test Coach only */}
                {(() => {
                  const shouldShow = user?.user_type === 'coach' || (user?.user_type === 'client' && isTestCoach(coach));
                  console.log('FREE CONSULTATION BUTTON CHECK:', {
                    userType: user?.user_type,
                    coachId: coach.id,
                    coachEmail: coach.email,
                    coachName: coach.name,
                    isTestCoach: isTestCoach(coach),
                    shouldShow: shouldShow
                  });
                  return shouldShow;
                })() && (
                  <DeactivatedActionButton action="book a consultation">
                    <Button
                      size="lg"
                      className="bg-white text-blue-700 hover:bg-blue-50 font-semibold transition-all hover:scale-105 w-full sm:w-auto"
                      onClick={() => handleBookSession('consultation')}
                    >
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Free Consultation
                    </Button>
                  </DeactivatedActionButton>
                )}

                {/* Book Paid Session - Visible to ALL users */}
                <DeactivatedActionButton action="book a session">
                  <Button
                    size="lg"
                    className="bg-green-600 text-white hover:bg-green-700 font-semibold transition-all hover:scale-105 w-full sm:w-auto"
                    onClick={() => handleBookSession('session')}
                  >
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Book Paid Session
                  </Button>
                </DeactivatedActionButton>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 sm:mt-8 lg:mt-0 lg:ml-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xs mx-auto lg:max-w-none lg:mx-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold">{coach.availability}</div>
                  <div className="text-xs sm:text-sm text-blue-100">Slots Available</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold">{coach.languages.length}</div>
                  <div className="text-xs sm:text-sm text-blue-100">Languages</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Contact & Session Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-sm sm:text-base truncate">{coach.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-sm sm:text-base">{coach.phone}</p>
                    </div>
                  </div>
                </div>
                {/* Booking buttons */}
                <div className="flex gap-2 mt-4 sm:mt-6">
                  {/* Free Call - Visible to coaches OR clients viewing Test Coach only */}
                  {(user?.user_type === 'coach' || (user?.user_type === 'client' && isTestCoach(coach))) && (
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all hover:scale-105 py-2.5 sm:py-3 text-sm sm:text-base"
                      onClick={() => handleBookSession('consultation')}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Free Call</span>
                      <span className="sm:hidden">Free</span>
                    </Button>
                  )}
                  {/* Paid - Visible to ALL users */}
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transition-all hover:scale-105 py-2.5 sm:py-3 text-sm sm:text-base"
                    onClick={() => handleBookSession('session')}
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Paid</span>
                    <span className="sm:hidden">Pay</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Session Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Session Rate</span>
                    <span className="font-semibold text-green-600 text-sm sm:text-base">{coach.sessionRate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Experience</span>
                    <span className="font-medium text-sm sm:text-base">{coach.experience}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Rating</span>
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < Math.floor(ratingStats.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm font-medium">({ratingStats.averageRating.toFixed(1)})</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Match Score</span>
                      <span className="text-sm font-medium">{coach.matchScore || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${coach.matchScore || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Format */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-purple-600" />
                  <span>Session Format</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  {coach.virtualAvailable && (
                    <div className="flex items-center space-x-3 p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Video Sessions Available</span>
                    </div>
                  )}
                  {coach.inPersonAvailable && (
                    <div className="flex items-center space-x-3 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">In-Person Sessions Available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insurance */}
            {coach.insuranceAccepted && (
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <span>Insurance Accepted</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    {coach.insuranceAccepted.map((insurance, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs sm:text-sm py-1">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span className="break-words">{insurance}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Professional Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span>About Me</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg">{coach.bio}</p>
              </CardContent>
            </Card>

            {/* Specialties & Approach */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  <span>Areas of Focus</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2 text-sm sm:text-base">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span>Specialties</span>
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2">
                      {coach.specialties.map((specialty, idx) => (
                        <div key={idx} className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium break-words">{specialty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2 text-sm sm:text-base">
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span>Coaching Approaches</span>
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2">
                      {coach.modalities.map((modality, idx) => (
                        <div key={idx} className="flex items-center space-x-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium break-words">{modality}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Languages & Demographics */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <span>Languages & Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2 text-sm sm:text-base">
                      <Languages className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span>Languages Spoken</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {coach.languages.map((language, idx) => (
                        <span key={idx} className="inline-block text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 sm:px-3 py-1 rounded-full font-medium">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2 text-sm sm:text-base">
                      <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>Demographics</span>
                    </h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-500">Gender:</span>
                        <span className="font-medium break-words">{coach.demographics.gender}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-500">Ethnicity:</span>
                        <span className="font-medium break-words">{coach.demographics.ethnicity}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-500">Religious Background:</span>
                        <span className="font-medium break-words">{coach.demographics.religious_background}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-500">Sexual Orientation:</span>
                        <span className="font-medium break-words">{coach.sexualOrientation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Background */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <span>Professional Background</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2 text-sm sm:text-base">
                      <GraduationCap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Education</span>
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm">{coach.education}</p>
                  </div>
                  {coach.certifications && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2 text-sm sm:text-base">
                        <Award className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <span>Certifications</span>
                      </h4>
                      <div className="grid gap-1.5 sm:gap-2">
                        {coach.certifications.map((cert, idx) => (
                          <div key={idx} className="flex items-start space-x-2 p-2.5 sm:p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm font-medium break-words">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Availability & Session Types */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span>Availability & Session Types</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2 text-sm sm:text-base">
                      <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <span>Available Times</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {coach.availableTimes.map((time, idx) => (
                        <span key={idx} className="inline-block text-xs sm:text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 sm:px-3 py-1 rounded-full font-medium">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 1: Professional Background */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <span>Section 1: Professional Background</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.educationalBackground && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Educational Background</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm">{coach.educationalBackground}</p>
                    </div>
                  )}
                  {coach.coachingExperienceYears && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Years of Coaching Experience</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg text-sm">{coach.coachingExperienceYears}</p>
                    </div>
                  )}
                  {coach.professionalCertifications && coach.professionalCertifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Professional Certifications</h4>
                      <div className="space-y-2">
                        {coach.professionalCertifications.map((cert, idx) => (
                          <div key={idx} className="flex items-center space-x-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Award className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Specialization & Expertise */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-rose-600" />
                  <span>Section 2: Specialization & Expertise</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.coachingExpertise && coach.coachingExpertise.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Primary Areas of Coaching Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {coach.coachingExpertise.map((expertise, idx) => (
                          <span key={idx} className="inline-block text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 px-3 py-1 rounded-full font-medium">
                            {expertise}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {coach.ageGroupsComfortable && coach.ageGroupsComfortable.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Age Groups Comfortable Working With</h4>
                      <div className="flex flex-wrap gap-2">
                        {coach.ageGroupsComfortable.map((ageGroup, idx) => (
                          <span key={idx} className="inline-block text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 px-3 py-1 rounded-full font-medium">
                            {ageGroup}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {coach.actTrainingLevel && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">ACT (Acceptance and Commitment Therapy) Training</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm">{coach.actTrainingLevel}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Approach & Methodology */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>Section 3: Approach & Methodology</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.coachingPhilosophy && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Coaching Philosophy</h4>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{coach.coachingPhilosophy}</p>
                      </div>
                    </div>
                  )}
                  {coach.coachingTechniques && coach.coachingTechniques.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Coaching Techniques Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {coach.coachingTechniques.map((technique, idx) => (
                          <span key={idx} className="inline-block text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 px-3 py-1 rounded-full font-medium">
                            {technique}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {coach.sessionStructure && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Session Structure</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-sm">{coach.sessionStructure}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Professional Boundaries & Ethics */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Section 4: Professional Boundaries & Ethics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.scopeHandlingApproach && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Handling Situations Beyond Scope of Practice</h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{coach.scopeHandlingApproach}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Professional License History</h4>
                    <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">No professional licenses suspended, revoked, or disciplined</span>
                    </div>
                  </div>
                  {coach.boundaryMaintenanceApproach && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Professional Boundary Maintenance</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-sm">{coach.boundaryMaintenanceApproach}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Crisis Management */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span>Section 5: Crisis Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.comfortableWithSuicidalThoughts && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Working with Clients with Suicidal Thoughts</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">{coach.comfortableWithSuicidalThoughts}</p>
                    </div>
                  )}
                  {coach.selfHarmProtocol && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Self-Harm Protocol</h4>
                      <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{coach.selfHarmProtocol}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Availability & Commitment */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Section 6: Availability & Commitment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.weeklyHoursAvailable && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Weekly Hours Available</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">{coach.weeklyHoursAvailable}</p>
                    </div>
                  )}
                  {coach.preferredSessionLength && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Preferred Session Length</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm">{coach.preferredSessionLength}</p>
                    </div>
                  )}
                  {coach.availabilityTimes && coach.availabilityTimes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">General Availability Times</h4>
                      <div className="flex flex-wrap gap-2">
                        {coach.availabilityTimes.map((time, idx) => (
                          <span key={idx} className="inline-block text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full font-medium">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 7: Technology & Communication */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-cyan-600" />
                  <span>Section 7: Technology & Communication</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.videoConferencingComfort && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Video Conferencing Comfort Level</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg text-sm">{coach.videoConferencingComfort}</p>
                    </div>
                  )}
                  {coach.internetConnectionQuality && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Internet Connection Quality</h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">{coach.internetConnectionQuality}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 8: Languages & Cultural Competency */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Languages className="w-5 h-5 text-green-600" />
                  <span>Section 8: Languages & Cultural Competency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {coach.languagesFluent && coach.languagesFluent.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Languages for Coaching</h4>
                      <div className="flex flex-wrap gap-2">
                        {coach.languagesFluent.map((language, idx) => (
                          <span key={idx} className="inline-block text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-medium">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rating Section */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span>Ratings & Reviews</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Average Rating Display */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {ratingStats.averageRating.toFixed(1)}
                        </div>
                        <div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(ratingStats.averageRating)
                                    ? 'text-yellow-400 fill-current'
                                    : i < Math.ceil(ratingStats.averageRating) && ratingStats.averageRating % 1 >= 0.5
                                    ? 'text-yellow-400 fill-current opacity-50'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Based on {ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Form */}
                  {user ? (
                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Rate Your Experience
                      </h4>
                      <CoachRating
                        coachId={coach.id}
                        clientId={user.id}
                        readOnly={false}
                        onRatingSubmit={(rating, comment) => {
                          console.log('Rating submitted:', rating, comment)
                          fetchRatingStats()
                        }}
                      />
                      {!hasAppointmentHistory && (
                        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Note: In production, rating is only available after completing a session with this coach.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {!user && (
                    <div className="border-t pt-6">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Sign in to rate this coach
                        </p>
                        <Button
                          onClick={() => router.push('/login')}
                          variant="outline"
                          size="sm"
                        >
                          Sign In
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-xl text-white overflow-hidden">
              <CardContent className="relative z-10 p-4 sm:p-6 md:p-8 text-center">
                <div className="mb-4 sm:mb-6">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-3 sm:mb-4 text-yellow-300" />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Ready to start your journey?</h3>
                  <p className="text-blue-100 text-sm sm:text-base md:text-lg px-2">
                    Schedule a free 15-minute consultation to see if we're a good fit for your coaching needs.
                  </p>
                </div>
                {/* CTA Buttons */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex gap-2 w-full">
                    {/* Free Consultation - Visible to coaches OR clients viewing Test Coach only */}
                    {(user?.user_type === 'coach' || (user?.user_type === 'client' && isTestCoach(coach))) && (
                      <Button
                        size="lg"
                        className="flex-1 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm sm:text-base md:text-lg py-2.5 sm:py-3 transition-all hover:scale-105"
                        onClick={() => handleBookSession('consultation')}
                      >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="hidden sm:inline">Free Consultation</span>
                        <span className="sm:hidden">Free</span>
                      </Button>
                    )}
                    {/* Paid Session - Visible to ALL users */}
                    <Button
                      size="lg"
                      className="flex-1 bg-green-500 text-white hover:bg-green-600 font-semibold text-sm sm:text-base md:text-lg py-2.5 sm:py-3 transition-all hover:scale-105"
                      onClick={() => handleBookSession('session')}
                    >
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden sm:inline">Paid Session</span>
                      <span className="sm:hidden">Paid</span>
                    </Button>
                  </div>
                  {(user?.user_type === 'coach' || (user?.user_type === 'client' && isTestCoach(coach))) && (
                    <p className="text-xs sm:text-sm text-blue-100">
                      No commitment required • 15 minutes • Video call
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced GHL Booking Calendar with Square Payment */}
      {showBookingCalendar && coach && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white pr-2">
                <span className="hidden sm:inline">
                  Book {sessionType === 'consultation' ? 'Free Consultation' : 'Paid Session'} with {coach.name}
                </span>
                <span className="sm:hidden">
                  Book {sessionType === 'consultation' ? 'Free' : 'Paid'} Session
                </span>
              </h2>
              <button
                onClick={() => setShowBookingCalendar(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <GHLBookingCalendar
                coach={{
                  id: coach.id,
                  name: coach.name,
                  email: coach.email
                }}
                onBookingComplete={handleBookingComplete}
                requirePayment={sessionType === 'session'} // Require payment for paid sessions
                sessionType={sessionType}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CoachProfile() {
  return <CoachProfileContent />
}