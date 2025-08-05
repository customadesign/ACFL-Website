'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Calendar, Clock, Video, MapPin } from 'lucide-react'

interface Coach {
  id: string
  name: string
  sessionRate?: string
  virtualAvailable?: boolean
  inPersonAvailable?: boolean
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coach: Coach
  sessionType: 'consultation' | 'session'
}

export default function BookingModal({ isOpen, onClose, coach, sessionType }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  // All sessions are virtual - no format selection needed
  
  // Debug coach availability
  console.log('Coach availability:', {
    name: coach.name,
    virtualAvailable: coach.virtualAvailable,
    inPersonAvailable: coach.inPersonAvailable
  })
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!selectedDate || !selectedTime) {
        throw new Error('Please select both date and time')
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const response = await fetch('/api/client/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coachId: coach.id,
          scheduledAt: scheduledDateTime.toISOString(),
          sessionType,
          notes: notes.trim()
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
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const availableDates = generateAvailableDates()
  const timeSlots = generateTimeSlots()

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

              {/* Session Format - Fixed as Virtual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Format
                </label>
                <div className="p-4 border border-gray-300 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">Virtual Session</div>
                      <div className="text-sm text-blue-700">Video call via secure platform</div>
                    </div>
                  </div>
                </div>
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

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

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
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || !selectedDate || !selectedTime}
                >
                  {isLoading ? 'Booking...' : `Book ${sessionType === 'consultation' ? 'Consultation' : 'Session'}`}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}