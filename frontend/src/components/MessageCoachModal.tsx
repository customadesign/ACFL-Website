'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Send, MessageCircle } from 'lucide-react'

interface MessageCoachModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onSuccess: () => void
}

const messageTemplates = [
  {
    subject: "Question about upcoming session",
    message: "Hi! I have a question about our upcoming session. Could you please let me know..."
  },
  {
    subject: "Session preparation",
    message: "Hi! I wanted to check if there's anything specific I should prepare for our session..."
  },
  {
    subject: "Follow-up from last session",
    message: "Hi! I wanted to follow up on something we discussed in our last session..."
  },
  {
    subject: "Schedule-related inquiry",
    message: "Hi! I wanted to discuss something about our session schedule..."
  }
]

export default function MessageCoachModal({ isOpen, onClose, appointment, onSuccess }: MessageCoachModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleTemplateSelect = (template: typeof messageTemplates[0]) => {
    setSubject(template.subject)
    setMessage(template.message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!subject.trim() || !message.trim()) {
        throw new Error('Please provide both subject and message')
      }

      const response = await fetch('/api/client/message-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coachId: appointment.coach_id,
          subject: subject.trim(),
          message: message.trim(),
          appointmentId: appointment.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
        // Reset form
        setSubject('')
        setMessage('')
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const coachName = appointment.coaches 
    ? `${appointment.coaches.first_name} ${appointment.coaches.last_name}` 
    : 'your coach'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Message {coachName}
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
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Message Sent Successfully!
              </h3>
              <p className="text-gray-600">
                Your coach will receive your message and respond soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Appointment Context */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">About Your Appointment</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Date:</strong> {new Date(appointment.scheduled_at).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Type:</strong> {appointment.session_type || 'Coaching Session'}</p>
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {messageTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className="p-3 text-left border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{template.subject}</div>
                      <div className="text-xs text-gray-600 mt-1 truncate">{template.message}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this message about?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {subject.length}/100 characters
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                  maxLength={1000}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length}/1000 characters
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
                  disabled={isLoading || !subject.trim() || !message.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}