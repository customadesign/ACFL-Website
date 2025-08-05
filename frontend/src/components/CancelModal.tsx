'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, AlertTriangle } from 'lucide-react'

interface CancelModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onSuccess: () => void
}

export default function CancelModal({ isOpen, onClose, appointment, onSuccess }: CancelModalProps) {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/client/appointments/${appointment.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: reason.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel appointment')
      }

      onSuccess()
      onClose()
      // Reset form
      setReason('')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-red-600">
            Cancel Appointment
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
            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 mb-1">
                    Are you sure you want to cancel this appointment?
                  </p>
                  <p className="text-red-700">
                    This action cannot be undone. Your coach will be notified of the cancellation.
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Appointment Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Date:</strong> {new Date(appointment.scheduled_at).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Type:</strong> {appointment.session_type || 'Coaching Session'}</p>
                {appointment.coaches && (
                  <p><strong>Coach:</strong> {appointment.coaches.first_name} {appointment.coaches.last_name}</p>
                )}
              </div>
            </div>

            {/* Cancellation Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please let your coach know why you're cancelling..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {reason.length}/500 characters
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
                Keep Appointment
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Cancelling...' : 'Cancel Appointment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}