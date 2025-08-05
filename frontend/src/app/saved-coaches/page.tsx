'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Star, Calendar, Video, MapPin, MessageCircle, Trash2, User, RefreshCw } from "lucide-react"
import ProtectedRoute from '@/components/ProtectedRoute'
import BookingModal from '@/components/BookingModal'
import MessageCoachModal from '@/components/MessageCoachModal'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'

interface SavedCoach {
  id: string
  name: string
  specialties: string[]
  languages: string[]
  bio: string
  sessionRate: string
  virtualAvailable: boolean
  inPersonAvailable: boolean
  savedDate: string
  experience: string
  rating: number
  email?: string
  fakeAppointment?: any
}


function SavedCoachesContent() {
  const { user, logout, isAuthenticated } = useAuth()
  const [savedCoaches, setSavedCoaches] = useState<SavedCoach[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCoach, setSelectedCoach] = useState<SavedCoach | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const loadSavedCoaches = async (forceRefresh = false) => {
    // Don't load if already loaded and not forcing refresh
    if (!forceRefresh && hasLoaded) {
      return
    }

    // Don't start loading if already loading
    if (loading && !forceRefresh) {
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/client/saved-coaches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setSavedCoaches(response.data.data)
        setHasLoaded(true)
      }
    } catch (error) {
      console.error('Error loading saved coaches:', error)
      setError('Failed to load saved coaches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasLoaded) {
      loadSavedCoaches()
    }
  }, [hasLoaded])

  const handleRemoveCoach = async (coachId: string) => {
    try {
      await axios.delete(`${API_URL}/api/client/saved-coaches/${coachId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Remove from local state
      setSavedCoaches(prev => prev.filter(coach => coach.id !== coachId))
    } catch (error) {
      console.error('Error removing saved coach:', error)
      setError('Failed to remove coach')
    }
  }

  const handleScheduleSession = (coach: SavedCoach) => {
    setSelectedCoach(coach)
    setShowBookingModal(true)
  }

  const handleSendMessage = (coach: SavedCoach) => {
    // Create a fake appointment object for the message modal
    const fakeAppointment = {
      id: 'temp-' + Date.now(),
      coach_id: coach.id,
      coaches: {
        first_name: coach.name.split(' ')[0],
        last_name: coach.name.split(' ').slice(1).join(' ') || '',
        id: coach.id
      },
      scheduled_at: new Date().toISOString(),
      session_type: 'General Inquiry'
    }
    setSelectedCoach({...coach, fakeAppointment})
    setShowMessageModal(true)
  }

  const handleModalSuccess = () => {
    // Force refresh saved coaches after booking/messaging
    loadSavedCoaches(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Memoized computed values
  const averageRating = useMemo(() => {
    if (savedCoaches.length === 0) return 0
    return (savedCoaches.reduce((sum, coach) => sum + coach.rating, 0) / savedCoaches.length).toFixed(1)
  }, [savedCoaches])

  const virtualAvailableCount = useMemo(() => {
    return savedCoaches.filter(coach => coach.virtualAvailable).length
  }, [savedCoaches])

  if (loading && savedCoaches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading saved coaches...</div>
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
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm whitespace-nowrap">
              Saved Coaches
            </button>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Page Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Saved Coaches</h2>
            <p className="text-lg text-gray-600">
              Coaches you've saved for easy access and comparison
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => loadSavedCoaches(true)}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Saved</p>
                <p className="text-2xl font-bold text-blue-900">{savedCoaches.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Avg Rating</p>
                <p className="text-2xl font-bold text-green-900">
                  {averageRating}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center">
              <Video className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-800">Virtual Available</p>
                <p className="text-2xl font-bold text-purple-900">
                  {virtualAvailableCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Saved Coaches List */}
        {savedCoaches.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Coaches Yet</h3>
            <p className="text-gray-600 mb-6">
              Start saving coaches you're interested in to easily compare and contact them later.
            </p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Find Coaches
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {savedCoaches.map((coach) => (
              <Card key={coach.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link href={`/coach/${coach.id}`}>
                        <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                          {coach.name}
                        </h3>
                      </Link>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{coach.rating}</span>
                      </div>
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Saved Coach
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      Saved on {formatDate(coach.savedDate)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Specialties:</p>
                        <p className="text-sm text-gray-600">{coach.specialties.join(', ') || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Languages:</p>
                        <p className="text-sm text-gray-600">{coach.languages.join(', ') || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Experience:</p>
                        <p className="text-sm text-gray-600">{coach.experience} experience</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Session Rate:</p>
                        <p className="text-sm text-gray-600">{coach.sessionRate}</p>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{coach.bio}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <span className="font-medium">{coach.sessionRate}</span>
                      </div>
                      {coach.virtualAvailable && (
                        <div className="flex items-center">
                          <Video className="w-4 h-4 mr-1" />
                          <span>Virtual</span>
                        </div>
                      )}
                      {coach.inPersonAvailable && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>In-Person</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/coach/${coach.id}`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          View Full Profile
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleScheduleSession(coach)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Session
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                        onClick={() => handleSendMessage(coach)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveCoach(coach.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {savedCoaches.length > 0 && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <Calendar className="w-4 h-4 mr-2" />
                Compare Coaches
              </Button>
              <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Multiple
              </Button>
              <Link href="/">
                <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50 w-full">
                  <Heart className="w-4 h-4 mr-2" />
                  Find More Coaches
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Modals */}
        {selectedCoach && (
          <>
            <BookingModal
              isOpen={showBookingModal}
              onClose={() => setShowBookingModal(false)}
              coach={{
                id: selectedCoach.id,
                name: selectedCoach.name,
                sessionRate: selectedCoach.sessionRate,
                virtualAvailable: selectedCoach.virtualAvailable,
                inPersonAvailable: selectedCoach.inPersonAvailable
              }}
              sessionType="session"
            />
            <MessageCoachModal
              isOpen={showMessageModal}
              onClose={() => setShowMessageModal(false)}
              appointment={selectedCoach.fakeAppointment || {
                id: 'temp-' + Date.now(),
                coach_id: selectedCoach.id,
                coaches: {
                  first_name: selectedCoach.name.split(' ')[0],
                  last_name: selectedCoach.name.split(' ').slice(1).join(' ') || '',
                  id: selectedCoach.id
                },
                scheduled_at: new Date().toISOString(),
                session_type: 'General Inquiry'
              }}
              onSuccess={handleModalSuccess}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function SavedCoachesPage() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <SavedCoachesContent />
    </ProtectedRoute>
  )
} 