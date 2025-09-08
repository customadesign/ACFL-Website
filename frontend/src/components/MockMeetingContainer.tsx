'use client'

import { useState, useEffect } from 'react'
import { useMeeting } from '@/contexts/MeetingContext'
import { leaveMeeting } from '@/services/videoMeeting'
import { Loader2, AlertTriangle, Video, PhoneOff } from 'lucide-react'

interface MockMeetingContainerProps {
  appointmentId: string
  appointmentData: {
    coach_name?: string
    client_name?: string
    starts_at: string
    ends_at: string
  }
  isHost: boolean
  onClose: () => void
}

/**
 * Mock meeting container for testing restrictions without VideoSDK backend calls
 * Remove in production
 */
export default function MockMeetingContainer({
  appointmentId,
  appointmentData,
  isHost,
  onClose
}: MockMeetingContainerProps) {
  const { canJoinMeeting, isInMeeting, currentMeetingId, setMeetingState } = useMeeting()
  const [stage, setStage] = useState<'precall' | 'loading' | 'meeting' | 'ended' | 'blocked'>('precall')
  const [meetingId] = useState(`mock_meeting_${Date.now()}`)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    // Check if user can join this meeting
    if (isInMeeting && !canJoinMeeting(meetingId)) {
      console.log('❌ Mock: Cannot join meeting - user already in another meeting')
      setStage('blocked')
      return
    }

    console.log('✅ Mock: Meeting ready to join:', meetingId)
  }, [meetingId, canJoinMeeting, isInMeeting])

  const handleJoinMeeting = async () => {
    if (isJoining || stage !== 'precall') return

    setIsJoining(true)
    setStage('loading')

    // Simulate loading time
    setTimeout(() => {
      // Now that user is actually joining, mark them as in meeting
      console.log('🔒 Mock: User joining meeting:', meetingId)
      setMeetingState(true, meetingId)
      setStage('meeting')
      setIsJoining(false)
    }, 1000)
  }

  const handleEndMeeting = () => {
    console.log('🔓 Mock: Ending meeting:', meetingId)
    setMeetingState(false, null)
    setStage('ended')
    
    setTimeout(() => {
      onClose()
    }, 1000)
  }

  // Loading state
  if (stage === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-lg font-medium">Connecting to mock meeting...</p>
          <p className="text-sm text-gray-600 mt-2">Testing meeting restrictions</p>
        </div>
      </div>
    )
  }

  // Meeting ended state
  if (stage === 'ended') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium">Mock Meeting Ended</p>
          <p className="text-sm text-gray-600 mt-2">Testing complete</p>
        </div>
      </div>
    )
  }

  // Blocked state
  if (stage === 'blocked') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Cannot Join Mock Meeting</p>
          <p className="text-sm text-gray-600 mb-4">
            You are already in another meeting session. The restriction system is working correctly!
          </p>
          {isInMeeting && currentMeetingId && (
            <p className="text-xs text-orange-600 bg-orange-50 rounded px-3 py-2 mb-4">
              Current meeting: {currentMeetingId}
            </p>
          )}
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // PreCall stage
  if (stage === 'precall') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Mock Video Session</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ready to join mock meeting with {isHost ? appointmentData.client_name : appointmentData.coach_name}
          </p>
          <p className="text-xs text-purple-600 bg-purple-50 rounded px-3 py-2 mb-4">
            🧪 This is a test meeting for restriction testing
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinMeeting}
              disabled={isJoining}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Mock Meeting'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mock meeting interface
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">Mock Video Session</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            🧪 TEST MODE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isHost && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
              HOST
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">Mock Meeting Active</h3>
          <p className="text-gray-300 mb-4">Meeting ID: {meetingId}</p>
          <p className="text-gray-400 text-sm mb-8">
            Try navigating to other pages to test the restriction system!
          </p>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-4 flex justify-center">
        <button
          onClick={handleEndMeeting}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full flex items-center gap-2 font-medium"
        >
          <PhoneOff size={20} />
          End Mock Meeting
        </button>
      </div>
    </div>
  )
}