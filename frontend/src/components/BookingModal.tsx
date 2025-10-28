'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Calendar, Clock, Video, MapPin, CreditCard } from 'lucide-react'
import { concernOptions } from '@/constants/formOptions'
import { getApiUrl } from '@/lib/api'
import SquareBookingFlow from '@/components/payments/SquareBookingFlow'

interface Coach {
  id: string
  name: string
  sessionRate?: string
  virtualAvailable?: boolean
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coach: Coach
  sessionType: 'consultation' | 'session'
  enablePayments?: boolean
}

// Test Coach IDs - coaches that show instant booking for free consultations
const TEST_COACH_IDS = [
  'a235efaa-df3a-4583-ae72-b4590497386fe', // Test Coach
]

// Test Coach identifiers (email and name as fallback)
const TEST_COACH_IDENTIFIERS = {
  emails: ['coach@acfl.com'],
  names: ['Test Coach']
}

// Helper function to check if a coach is a test coach
const isTestCoach = (coachId: string, coachName?: string) => {
  return TEST_COACH_IDS.includes(coachId) ||
         (coachName && TEST_COACH_IDENTIFIERS.names.includes(coachName))
}

export default function BookingModal({ isOpen, onClose, coach, sessionType, enablePayments = sessionType === 'session' }: BookingModalProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  // All sessions are virtual - no format selection needed
  
  // Debug coach availability
  console.log('Coach availability:', {
    name: coach.name,
    virtualAvailable: coach.virtualAvailable
  })
  const [notes, setNotes] = useState('')
  const [areaOfFocus, setAreaOfFocus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)
  const API_URL = getApiUrl()

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  // Generate next 14 days (excluding weekends for simplicity)
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()
    let currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() + 1) // Start from tomorrow

    while (dates.length < 10) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        dates.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const handleInstantConsultation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now

      const response = await fetch(`${API_URL}/api/client/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coachId: coach.id,
          scheduledAt: now.toISOString(),
          endsAt: endTime.toISOString(),
          sessionType: 'consultation',
          notes: 'Instant free consultation session',
          areaOfFocus: 'Free Consultation',
          createVideoMeeting: true // Flag to create VideoSDK meeting
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          router.push('/clients/appointments')
        }, 2000)
      } else {
        throw new Error(data.message || 'Failed to book instant consultation')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to book instant consultation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickTest = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour later

      const response = await fetch(`${API_URL}/api/client/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coachId: coach.id,
          scheduledAt: now.toISOString(),
          endsAt: endTime.toISOString(),
          sessionType: 'session',
          notes: 'Quick test session for video meeting system',
          areaOfFocus: 'Video Meeting Test',
          createVideoMeeting: true // Flag to create VideoSDK meeting
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          // Navigate to appointments page
          router.push('/clients/appointments')
        }, 2000)
      } else {
        throw new Error(data.message || 'Failed to book test session')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to book test session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Block paid sessions from using free booking
      if (sessionType === 'session') {
        throw new Error('Paid sessions require payment. Please use the "Book Paid Session" button.')
      }

      if (!selectedDate || !selectedTime) {
        throw new Error('Please select both date and time')
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      const endDateTime = new Date(scheduledDateTime.getTime() + (sessionType === 'consultation' ? 15 : 60) * 60 * 1000)
      
      const response = await fetch(`${API_URL}/api/client/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coachId: coach.id,
          scheduledAt: scheduledDateTime.toISOString(),
          endsAt: endDateTime.toISOString(),
          sessionType,
          notes: notes.trim(),
          areaOfFocus: areaOfFocus || null,
          createVideoMeeting: true // Flag to create VideoSDK meeting
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Booking error response:', data)
        throw new Error(data.message || data.error || 'Failed to book appointment')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        // Reset form
        setSelectedDate('')
        setSelectedTime('')
        setNotes('')
        setAreaOfFocus('')
        setSuccess(false)
        // Navigate to appointments page
        router.push('/clients/appointments')
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentBookingComplete = (bookingResult: { paymentId: string; sessionId?: string; bookingId?: string }) => {
    setSuccess(true)
    setTimeout(() => {
      onClose()
      // Reset form
      setSelectedDate('')
      setSelectedTime('')
      setNotes('')
      setAreaOfFocus('')
      setSuccess(false)
      setShowPaymentFlow(false)
      // Navigate to appointments page
      router.push('/clients/appointments')
    }, 2000)
  }

  const handlePaymentBooking = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      return
    }
    setShowPaymentFlow(true)
  }

  if (!isOpen) return null

  const availableDates = generateAvailableDates()
  const timeSlots = generateTimeSlots()

  // Show Square payment flow if enabled and payment flow is active
  if (showPaymentFlow && enablePayments) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">
              Book {sessionType === 'consultation' ? 'Free Consultation' : 'Paid Session'} with {coach.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPaymentFlow(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <SquareBookingFlow
              coachId={coach.id}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onBookingComplete={handlePaymentBookingComplete}
              onCancel={() => setShowPaymentFlow(false)}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Book {sessionType === 'consultation' ? 'Free Consultation' : 'Session'} with {coach.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                {sessionType === 'consultation' ? 'Consultation' : 'Session'} Booked Successfully!
              </h3>
              <p className="text-gray-600">
                You'll receive a confirmation email shortly with meeting details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Session Details</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {sessionType === 'consultation' ? '15 minutes' : '60 minutes'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    <span>Cost: {sessionType === 'consultation' ? 'Free' : coach.sessionRate || 'Contact coach for pricing'}</span>
                  </div>
                </div>
              </div>

              {/* Instant Consultation for Test Coach Only */}
              {sessionType === 'consultation' && isTestCoach(coach.id, coach.name) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">⚡ Book Instant Consultation</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Start a free 15-minute consultation right now!
                  </p>
                  <Button
                    type="button"
                    onClick={handleInstantConsultation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    📹 Book Instant Session (Now)
                  </Button>
                </div>
              )}

              {/* Quick Test Option for Sessions */}
              {sessionType === 'session' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">🚀 Quick Test Session</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Want to test the video meeting system? Book a session starting now!
                  </p>
                  <Button
                    type="button"
                    onClick={handleQuickTest}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    📹 Book Test Session (Starts Now)
                  </Button>
                </div>
              )}

              {/* Regular Scheduling */}
              <div className={sessionType === 'session' ? 'pt-4 border-t' : ''}>
                {sessionType === 'session' && (
                  <h3 className="font-medium text-gray-900 mb-4">Or schedule for later:</h3>
                )}
              
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDates.map((date) => {
                    const dateString = date.toISOString().split('T')[0]
                    const isSelected = selectedDate === dateString
                    return (
                      <button
                        key={dateString}
                        type="button"
                        onClick={() => setSelectedDate(dateString)}
                        className={`p-3 text-sm border rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-xs">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-sm border rounded transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Session Format - Video Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Format
                </label>
                <div className="p-4 border border-gray-300 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900">Video Session</div>
                      <div className="text-sm text-green-700">Secure video call via our platform</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {/* Areas of Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area of Focus (Optional)
                </label>
                <select
                  value={areaOfFocus}
                  onChange={(e) => setAreaOfFocus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select an area</option>
                  {concernOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific topics you'd like to discuss or questions you have for the coach..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {notes.length}/500 characters
                </div>
              </div>

              {/* Payment Notice for Paid Sessions */}
              {sessionType === 'session' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-orange-800 font-medium">Payment Required</p>
                      <p className="text-sm text-orange-700">
                        This is a paid session. You must complete payment to book this session.
                        Payment is processed securely through Square.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>

                {/* Force payment for all paid sessions */}
                {sessionType === 'session' ? (
                  <Button
                    type="button"
                    onClick={handlePaymentBooking}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isLoading || !selectedDate || !selectedTime}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Book Paid Session
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading || !selectedDate || !selectedTime}
                  >
                    {isLoading ? 'Booking...' : 'Book Free Consultation'}
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}