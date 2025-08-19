'use client'

import { useState, useEffect } from 'react'
import PreCall from '@/components/PreCall'
import VideoMeeting from '@/components/VideoMeeting'
import { createOrGetMeeting } from '@/services/videoMeeting'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface MeetingContainerProps {
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

export default function MeetingContainer({
  appointmentId,
  appointmentData,
  isHost,
  onClose
}: MeetingContainerProps) {
  const { user } = useAuth()
  const [stage, setStage] = useState<'precall' | 'loading' | 'meeting' | 'ended'>('precall')
  const [meetingConfig, setMeetingConfig] = useState<{
    meetingId: string
    token: string
    micEnabled: boolean
    webcamEnabled: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  const participantName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'Participant'

  const handleJoinMeeting = async (config: { mic: boolean; camera: boolean }) => {
    // Prevent double-clicking and multiple join attempts
    if (isJoining || stage !== 'precall') {
      return
    }

    setIsJoining(true)
    setStage('loading')
    setError(null)

    try {
      // Create or get VideoSDK meeting
      const { meetingId, token } = await createOrGetMeeting(appointmentId, isHost)
      
      setMeetingConfig({
        meetingId,
        token,
        micEnabled: config.mic,
        webcamEnabled: config.camera
      })
      
      setStage('meeting')
    } catch (error) {
      console.error('Failed to join meeting:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to join meeting: ${errorMessage}`)
      setStage('precall')
    } finally {
      setIsJoining(false)
    }
  }

  const handleMeetingEnd = () => {
    setStage('ended')
    setMeetingConfig(null)
    // Small delay before closing to show transition
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
          <p className="text-lg font-medium">Connecting to meeting...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait while we set up your session</p>
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
          <p className="text-lg font-medium">Meeting Ended</p>
          <p className="text-sm text-gray-600 mt-2">Thank you for your session</p>
        </div>
      </div>
    )
  }

  // PreCall stage
  if (stage === 'precall') {
    return (
      <>
        <PreCall
          onJoinMeeting={handleJoinMeeting}
          onCancel={onClose}
          meetingTitle="Video Session"
          coachName={isHost ? appointmentData.client_name : appointmentData.coach_name}
          isJoining={isJoining}
        />
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
      </>
    )
  }

  // Meeting stage
  if (stage === 'meeting' && meetingConfig) {
    return (
      <VideoMeeting
        meetingId={meetingConfig.meetingId}
        token={meetingConfig.token}
        participantName={participantName}
        isHost={isHost}
        appointmentId={appointmentId}
        onMeetingEnd={handleMeetingEnd}
        initialMicOn={meetingConfig.micEnabled}
        initialWebcamOn={meetingConfig.webcamEnabled}
      />
    )
  }

  return null
}