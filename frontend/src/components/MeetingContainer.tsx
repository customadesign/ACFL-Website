'use client'

import { useState, useEffect } from 'react'
import PreCall from '@/components/PreCall'
import VideoMeeting from '@/components/VideoMeeting'
import { createOrGetMeeting, leaveMeeting } from '@/services/videoMeeting'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMeeting } from '@/contexts/MeetingContext'

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
  const { canJoinMeeting, isInMeeting, currentMeetingId, setMeetingState } = useMeeting()
  const [stage, setStage] = useState<'precall' | 'loading' | 'meeting' | 'ended' | 'blocked'>('precall')
  const [meetingConfig, setMeetingConfig] = useState<{
    meetingId: string
    token: string
    micEnabled: boolean
    webcamEnabled: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [meetingIdToCheck, setMeetingIdToCheck] = useState<string | null>(null)

  const participantName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.email || 'Participant'

  // Check meeting access on mount and immediately reserve this meeting
  useEffect(() => {
    let hasRun = false; // Prevent multiple executions
    
    const checkMeetingAccess = async () => {
      if (hasRun) return; // Only run once
      hasRun = true;
      
      try {
        console.log('🔍 DEBUG: MeetingContainer attempting to join:', {
          appointmentId,
          isHost,
          user: user?.email,
          currentMeetingId,
          isInMeeting
        })

        // First check if user can even attempt to join a meeting (with current state)
        const currentIsInMeeting = isInMeeting;
        const currentMeetingIdState = currentMeetingId;
        
        if (currentIsInMeeting && currentMeetingIdState) {
          console.log('❌ User already in meeting - blocking access immediately')
          setStage('blocked')
          return
        }

        console.log('🔍 DEBUG: Calling createOrGetMeeting with appointmentId:', appointmentId)
        const { meetingId } = await createOrGetMeeting(appointmentId, isHost)
        setMeetingIdToCheck(meetingId)
        
        // Double-check with fresh meeting ID
        if (!canJoinMeeting(meetingId)) {
          console.log('❌ Cannot join meeting - user already in another meeting')
          setStage('blocked')
          return
        }
        
        // Store the meeting ID but don't mark as in meeting yet
        // We'll do that when the user actually clicks join
        console.log('✅ Meeting ready to join:', meetingId)
        
      } catch (error: any) {
        console.error('Failed to check meeting access:', error)
        
        // Check if this is a backend conflict error
        if (error.status === 409 && error.conflictType === 'ALREADY_IN_MEETING') {
          console.log('❌ Backend detected user already in meeting')
          setStage('blocked')
          return
        }
        
        setError('Failed to check meeting access')
      }
    }
    
    checkMeetingAccess()
    
    // Cleanup function to release meeting when component unmounts
    return () => {
      // Only release if we actually joined the meeting
      if (meetingIdToCheck) {
        const currentIsInMeeting = isInMeeting;
        const currentMeetingIdState = currentMeetingId;
        if (currentIsInMeeting && currentMeetingIdState === meetingIdToCheck) {
          console.log('🔓 Releasing meeting access on unmount:', meetingIdToCheck)
          leaveMeeting(meetingIdToCheck).catch(console.error)
          setMeetingState(false, null)
        }
      }
    }
  }, [appointmentId, isHost]) // Removed meeting state dependencies to prevent re-runs

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

      console.log('🔒 Meeting credentials ready:', meetingId)
      // Don't set meeting state here - let VideoMeeting component handle it after successful join

      setMeetingConfig({
        meetingId,
        token,
        micEnabled: config.mic,
        webcamEnabled: config.camera
      })

      setStage('meeting')
    } catch (error: any) {
      console.error('Failed to join meeting:', error)
      
      // Release meeting state if we failed to join
      setMeetingState(false, null)
      
      // Check if this is a conflict error (user already in another meeting)
      if (error.status === 409 && error.conflictType === 'ALREADY_IN_MEETING') {
        console.log('User already in meeting, showing blocked state')
        setStage('blocked')
        setIsJoining(false)
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to join meeting: ${errorMessage}`)
      setStage('precall')
    } finally {
      setIsJoining(false)
    }
  }

  const handleMeetingEnd = () => {
    setStage('ended')
    
    // Call backend to clean up meeting tracking
    if (meetingConfig?.meetingId) {
      leaveMeeting(meetingConfig.meetingId).catch(console.error)
    }
    
    setMeetingConfig(null)
    
    // Release the meeting when it ends
    console.log('🔓 Meeting ended, releasing access:', meetingIdToCheck)
    setMeetingState(false, null)
    
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

  // Blocked state - user is already in another meeting
  if (stage === 'blocked') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Cannot Join Meeting</p>
          <p className="text-sm text-gray-600 mb-4">
            You are already in another meeting session. Please leave your current meeting before joining this one.
          </p>
          {isInMeeting && currentMeetingId && (
            <p className="text-xs text-orange-600 bg-orange-50 rounded px-3 py-2 mb-4">
              Current meeting: {currentMeetingId}
            </p>
          )}
          <button
            onClick={() => {
              if (meetingIdToCheck) {
                console.log('🔓 User closed blocked meeting, releasing access:', meetingIdToCheck)
                leaveMeeting(meetingIdToCheck).catch(console.error)
                setMeetingState(false, null)
              }
              onClose()
            }}
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