'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Calendar, Clock } from 'lucide-react'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onSuccess: () => void
}

export default function RescheduleModal({ isOpen, onClose, appointment, onSuccess }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Generate next 14 days (excluding weekends)
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
      const newScheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const response = await fetch(`/api/client/appointments/${appointment.id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newScheduledAt: newScheduledDateTime.toISOString()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reschedule appointment')
      }

      onSuccess()
      onClose()
      // Reset form
      setSelectedDate('')
      setSelectedTime('')

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
            Reschedule Appointment
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Appointment Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Current Appointment</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(appointment.scheduled_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Date *
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
                Select New Time *
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
                {isLoading ? 'Rescheduling...' : 'Reschedule Appointment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}