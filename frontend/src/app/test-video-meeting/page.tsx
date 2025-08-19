'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Video, Users, UserCheck, Settings } from 'lucide-react'
import dynamic from 'next/dynamic'

const MeetingContainer = dynamic(
  () => import('@/components/MeetingContainer'),
  { ssr: false }
)

export default function TestVideoMeetingPage() {
  const [showMeeting, setShowMeeting] = useState(false)
  const [userRole, setUserRole] = useState<'host' | 'participant'>('participant')

  const mockAppointment = {
    id: 'test-appointment-123',
    coach_name: 'Dr. Jane Smith',
    client_name: 'John Doe',
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour later
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Meeting Test</h1>
          <p className="text-lg text-gray-600">
            Test the complete video meeting flow with PreCall, Waiting Lobby, and Meeting controls
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
            
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Your Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserRole('host')}
                    className={`p-3 border rounded-lg transition-colors ${
                      userRole === 'host' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <UserCheck className="mx-auto mb-2" size={24} />
                    <p className="font-medium">Host (Coach)</p>
                    <p className="text-xs mt-1">Can end meeting for all</p>
                  </button>
                  <button
                    onClick={() => setUserRole('participant')}
                    className={`p-3 border rounded-lg transition-colors ${
                      userRole === 'participant' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Users className="mx-auto mb-2" size={24} />
                    <p className="font-medium">Participant (Client)</p>
                    <p className="text-xs mt-1">Waits in lobby first</p>
                  </button>
                </div>
              </div>

              {/* Start Meeting Button */}
              <div className="pt-4">
                <Button
                  onClick={() => setShowMeeting(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Video className="mr-2" size={20} />
                  Start Video Meeting Test
                </Button>
              </div>

              {/* Meeting Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Test Meeting Details:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Coach:</span> {mockAppointment.coach_name}</p>
                  <p><span className="font-medium">Client:</span> {mockAppointment.client_name}</p>
                  <p><span className="font-medium">Your Role:</span> {userRole === 'host' ? 'Coach (Host)' : 'Client (Participant)'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature Checklist */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Features to Test</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">1</span>
                </div>
                <div>
                  <p className="font-medium">PreCall Setup</p>
                  <p className="text-sm text-gray-600">Test camera/mic, device selection</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">2</span>
                </div>
                <div>
                  <p className="font-medium">Waiting Lobby</p>
                  <p className="text-sm text-gray-600">Participants wait for host (client role)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">3</span>
                </div>
                <div>
                  <p className="font-medium">Meeting Controls</p>
                  <p className="text-sm text-gray-600">Mute/unmute, camera on/off, screen share</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">4</span>
                </div>
                <div>
                  <p className="font-medium">Connection States</p>
                  <p className="text-sm text-gray-600">Monitor connection status indicators</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">5</span>
                </div>
                <div>
                  <p className="font-medium">Leave/End Meeting</p>
                  <p className="text-sm text-gray-600">Host can end for all, participants can leave</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <Settings className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Note for Testing</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This uses mock tokens and meeting IDs. For production, you'll need to implement 
                    the backend API endpoints with real VideoSDK credentials.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">As Host (Coach):</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Select "Host (Coach)" role</li>
                <li>2. Click "Start Video Meeting Test"</li>
                <li>3. Configure camera/mic in PreCall</li>
                <li>4. Join meeting directly (no waiting)</li>
                <li>5. Test "End for All" option</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">As Participant (Client):</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Select "Participant (Client)" role</li>
                <li>2. Click "Start Video Meeting Test"</li>
                <li>3. Configure camera/mic in PreCall</li>
                <li>4. Experience waiting lobby</li>
                <li>5. Test "Leave" option</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Open this page in two different browsers to test both host and participant 
              experiences simultaneously.
            </p>
          </div>
        </Card>

        {/* Meeting Container */}
        {showMeeting && (
          <MeetingContainer
            appointmentId={mockAppointment.id}
            appointmentData={mockAppointment}
            isHost={userRole === 'host'}
            onClose={() => {
              setShowMeeting(false)
              console.log('Meeting closed')
            }}
          />
        )}
      </div>
    </div>
  )
}