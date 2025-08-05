'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Heart, Calendar, MessageCircle, User } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BookingModal from '@/components/BookingModal'
import { useAuth } from '@/contexts/AuthContext'

interface Coach {
  id: string
  name: string
  specialties: string[]
  modalities: string[]
  location: string[]
  demographics: {
    gender: string
    ethnicity: string
    religion: string
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
}

function CoachProfileContent() {
  const params = useParams()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingType, setBookingType] = useState<'consultation' | 'session'>('consultation')

  useEffect(() => {
    // Fetch coach data based on ID
    const fetchCoach = async () => {
      try {
        const response = await fetch(`/api/coach/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCoach(data)
        } else {
          // For now, use mock data
          const mockCoaches: Coach[] = [
            {
              id: '1',
              name: "Richard Peng",
              specialties: ["Anxiety", "Depression"],
              modalities: ["ACT", "Mindfulness-Based Coaching", "Values-Based Action Planning"],
              location: ["CA", "NY"],
              demographics: {
                gender: "Male",
                ethnicity: "Asian American, Taiwanese",
                religion: "None"
              },
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
              rating: 4.8,
              virtualAvailable: true,
              inPersonAvailable: true
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
                religion: "Buddhist"
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
                religion: "Hindu"
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
      } finally {
        setLoading(false)
      }
    }

    fetchCoach()
  }, [params.id])

  const handleBookConsultation = () => {
    setBookingType('consultation')
    setShowBookingModal(true)
  }

  const handleBookSession = () => {
    setBookingType('session')
    setShowBookingModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading coach profile...</div>
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Coach not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                alt="ACT Coaching For Life Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900">ACT Coaching For Life</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Welcome, {user?.firstName || 'Client'}</span>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/dashboard">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Dashboard
              </button>
            </Link>
            <Link href="/search-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Search Coaches
              </button>
            </Link>
            <Link href="/saved-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Saved Coaches
              </button>
            </Link>
            <Link href="/appointments">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Appointments
              </button>
            </Link>
            <Link href="/messages">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Messages
              </button>
            </Link>
            <Link href="/profile">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Profile
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coach Header Card */}
        <Card className="overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{coach.name}</h1>
                <div className="flex items-center space-x-4 text-blue-100">
                  <span>{coach.experience} Experience</span>
                  <span>•</span>
                  <span>{coach.location.join(", ")}</span>
                </div>
              </div>
              {coach.matchScore && (
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-lg font-semibold">{coach.matchScore}% Match</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Contact & Session Info */}
          <div className="md:col-span-1 space-y-6">
            {/* Contact Information */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{coach.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{coach.phone}</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={handleBookConsultation}
              >
                Schedule Consultation
              </Button>
            </Card>

            {/* Session Details */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Session Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Session Rate</p>
                  <p className="font-medium">{coach.sessionRate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{coach.experience}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(coach.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({coach.rating || 0})</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Match Score</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${coach.matchScore || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{coach.matchScore || 0}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Insurance */}
            {coach.insuranceAccepted && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Insurance Accepted</h3>
                <div className="space-y-1">
                  {coach.insuranceAccepted.map((insurance, idx) => (
                    <div key={idx} className="text-sm py-1">
                      ✓ {insurance}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Professional Info */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">About Me</h3>
              <p className="text-gray-700 leading-relaxed">{coach.bio}</p>
            </Card>

            {/* Specialties & Approach */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Areas of Focus</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
                  <div className="space-y-1">
                    {coach.specialties.map((specialty, idx) => (
                      <div key={idx} className="text-sm text-gray-700">• {specialty}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Coaching Approaches</h4>
                  <div className="space-y-1">
                    {coach.modalities.map((modality, idx) => (
                      <div key={idx} className="text-sm text-gray-700">• {modality}</div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Languages & Demographics */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Languages & Demographics</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Languages Spoken</h4>
                  <div className="space-y-1">
                    {coach.languages.map((language, idx) => (
                      <div key={idx} className="text-sm text-gray-700">• {language}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Demographics</h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>Gender: {coach.demographics.gender}</div>
                    <div>Ethnicity: {coach.demographics.ethnicity}</div>
                    <div>Religion: {coach.demographics.religion}</div>
                    <div>Sexual Orientation: {coach.sexualOrientation}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Background */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Professional Background</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Education</h4>
                  <p className="text-gray-700">{coach.education}</p>
                </div>
                {coach.certifications && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                    <div className="space-y-1">
                      {coach.certifications.map((cert, idx) => (
                        <div key={idx} className="text-sm text-gray-700">• {cert}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Availability & Session Types */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Availability & Session Types</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Available Times</h4>
                  <div className="flex flex-wrap gap-2">
                    {coach.availableTimes.map((time, idx) => (
                      <span key={idx} className="inline-block text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Session Formats</h4>
                  <div className="space-y-2">
                    {coach.virtualAvailable && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Virtual Sessions Available</span>
                      </div>
                    )}
                    {coach.inPersonAvailable && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">In-Person Sessions Available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 p-6">
              <h3 className="font-semibold text-lg mb-2">Ready to start your journey?</h3>
              <p className="text-gray-700 mb-4">
                Schedule a free 15-minute consultation to see if we're a good fit for your coaching needs.
              </p>
              <div className="flex space-x-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                  onClick={handleBookConsultation}
                >
                  Book Free Consultation
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={handleBookSession}
                >
                  Book Full Session
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {coach && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          coach={coach}
          sessionType={bookingType}
        />
      )}
    </div>
  )
}

export default function CoachProfile() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <CoachProfileContent />
    </ProtectedRoute>
  )
} 