'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Video, Calendar, Clock, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function TestVideoSDKBookingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [booking, setBooking] = useState(false)
  const [appointmentCreated, setAppointmentCreated] = useState<any>(null)

  const createTestAppointment = async () => {
    setBooking(true)
    
    try {
      // Create a mock appointment with VideoSDK meeting
      const now = new Date()
      const startTime = new Date(now.getTime() + 10 * 60 * 1000) // Start in 10 minutes
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour after start time
      
      const testAppointment = {
        id: `test-${Date.now()}`,
        client_id: user?.id || 'test-client',
        coach_id: '8b2e5710-e8c8-4010-ab8c-0eba0fd1f0ed',
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString(),
        status: 'confirmed',
        notes: 'VideoSDK test appointment',
        meeting_id: `meeting_${Math.random().toString(36).substring(2, 15)}`,
        session_type: 'session',
        duration: 60,
        created_at: new Date().toISOString(),
        // For client view
        coaches: {
          id: '8b2e5710-e8c8-4010-ab8c-0eba0fd1f0ed',
          first_name: 'Test',
          last_name: 'Coach',
          specialties: ['ACT', 'Mindfulness'],
          users: {
            email: 'test.coach@example.com'
          }
        },
        // For coach view
        clients: {
          first_name: 'Test',
          last_name: 'Client',
          phone: '+1234567890',
          email: user?.email || 'test.client@example.com',
          users: {
            email: user?.email || 'test.client@example.com'
          }
        }
      }

      // Store in localStorage for testing
      const existingAppointments = JSON.parse(localStorage.getItem('testAppointments') || '[]')
      existingAppointments.push(testAppointment)
      localStorage.setItem('testAppointments', JSON.stringify(existingAppointments))
      
      setAppointmentCreated(testAppointment)
      // Show success message and offer navigation
      if (confirm('Test appointment created! Would you like to go to your appointments page?')) {
        router.push('/clients/appointments')
      }
      
    } catch (error) {
      console.error('Error creating test appointment:', error)
      alert('Failed to create test appointment')
    } finally {
      setBooking(false)
    }
  }

  const clearTestAppointments = () => {
    localStorage.removeItem('testAppointments')
    setAppointmentCreated(null)
    alert('Test appointments cleared!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VideoSDK Booking Test</h1>
          <p className="text-lg text-gray-600">
            Create test appointments with VideoSDK meeting integration
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Test Appointment */}
          <Card className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold mb-2">Create VideoSDK Test Appointment</h2>
              <p className="text-gray-600 mb-6">
                Creates an appointment with VideoSDK meeting that starts in 1 minute
              </p>
              
              <Button
                onClick={createTestAppointment}
                disabled={booking}
                className="w-full bg-green-600 hover:bg-green-700 text-white mb-4"
                size="lg"
              >
                {booking ? 'Creating...' : '📹 Create Test Appointment'}
              </Button>

              <Button
                onClick={clearTestAppointments}
                variant="outline"
                className="w-full"
              >
                Clear Test Appointments
              </Button>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Create Test Appointment</p>
                  <p className="text-sm text-gray-600">Click the button to create an appointment with VideoSDK meeting ID</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Go to Appointments</p>
                  <p className="text-sm text-gray-600">Navigate to /clients/appointments to see your test appointment</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Test Video Meeting</p>
                  <p className="text-sm text-gray-600">Click "Join Session" to test the complete VideoSDK flow</p>
                </div>
              </div>
            </div>

            {appointmentCreated && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">✅ Test Appointment Created</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>ID:</strong> {appointmentCreated.id}</p>
                  <p><strong>Meeting ID:</strong> {appointmentCreated.meeting_id}</p>
                  <p><strong>Start Time:</strong> In 1 minute</p>
                  <p><strong>Duration:</strong> 60 minutes</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">🔧 Technical Implementation</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">VideoSDK Integration Changes:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Appointments now support <code>meeting_id</code></li>
                <li>• BookingModal creates VideoSDK meetings</li>
                <li>• MeetingContainer uses VideoSDK API</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Meeting Flow:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PreCall: Device setup and permissions</li>
                <li>• VideoSDK: Token generation and meeting join</li>
                <li>• Meeting: Full video controls and features</li>
                <li>• End: Proper cleanup and state management</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This test creates mock appointments for testing. 
              In production, these would be created through the booking API with proper VideoSDK meeting generation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}