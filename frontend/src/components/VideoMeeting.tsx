'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MeetingProvider, MeetingConsumer, useMeeting, useParticipant } from '@videosdk.live/react-sdk'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Monitor,
  MonitorStop,
  MessageSquare,
  Volume2,
  Loader2,
  WifiOff,
  X
} from 'lucide-react'
import MeetingChatComponent from './MeetingChatComponent'
import { useMeeting as useGlobalMeeting } from '@/contexts/MeetingContext'

// Screen sharing diagnostics utility
const screenSharingDiagnostics = {
  checkSupport(): { supported: boolean; issues: string[] } {
    const issues: string[] = []
    let supported = true

    // Check secure context
    if (!window.isSecureContext && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('Screen sharing requires HTTPS or localhost')
      supported = false
    }

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      issues.push('Browser does not support screen sharing')
      supported = false
    }

    // Check if running in iframe
    if (window !== window.top) {
      issues.push('Screen sharing may not work in iframes')
    }

    // Check user agent for known issues
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      if (parseInt(userAgent.split('version/')[1]) < 13) {
        issues.push('Safari version may not support screen sharing')
      }
    }

    return { supported, issues }
  },

  async testPermissions(): Promise<{ granted: boolean; error?: string }> {
    // Don't actually test permissions here as it consumes the user gesture
    // Just return true and let the actual screen sharing handle permissions
    return { granted: true }
  }
}

interface VideoMeetingProps {
  meetingId: string
  token: string
  participantName: string
  isHost: boolean
  appointmentId?: string
  onMeetingEnd: () => void
  initialMicOn?: boolean
  initialWebcamOn?: boolean
}

// Main meeting view component
function MeetingView({
  meetingId,
  participantName,
  onMeetingEnd,
  appointmentId,
  initialMicOn,
  initialWebcamOn
}: {
  meetingId: string
  participantName: string
  onMeetingEnd: () => void
  appointmentId?: string
  initialMicOn?: boolean
  initialWebcamOn?: boolean
}) {
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isMeetingJoined, setIsMeetingJoined] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('good')
  const [localMicOn, setLocalMicOn] = useState(false)
  const [localWebcamOn, setLocalWebcamOn] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [dominantSpeaker, setDominantSpeaker] = useState<string | null>(null)
  const [screenShareError, setScreenShareError] = useState<string | null>(null)
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false)
  const [isEnablingMic, setIsEnablingMic] = useState(false)
  const [isEnablingWebcam, setIsEnablingWebcam] = useState(false)
  const hasJoinedRef = useRef(false)
  const hasSetInitialStateRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const micEnableAttempts = useRef(0)
  const webcamEnableAttempts = useRef(0)
  const sdkMicStateRef = useRef<boolean>(false)
  const sdkWebcamStateRef = useRef<boolean>(false)

  // Global meeting state management
  const { setMeetingState } = useGlobalMeeting()

  // Check if screen sharing is supported on component mount
  useEffect(() => {
    const checkScreenShareSupport = () => {
      const diagnostics = screenSharingDiagnostics.checkSupport()
      setIsScreenShareSupported(diagnostics.supported)

      if (!diagnostics.supported) {
        console.warn('Screen sharing not supported:', diagnostics.issues)
        setScreenShareError(`Screen sharing unavailable: ${diagnostics.issues.join(', ')}`)
        // Clear error after 5 seconds to avoid permanent display
        setTimeout(() => setScreenShareError(null), 5000)
      } else if (diagnostics.issues.length > 0) {
        console.warn('Screen sharing warnings:', diagnostics.issues)
      }
    }

    checkScreenShareSupport()
  }, [])

  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    toggleScreenShare,
    participants,
    presenterId,
    localMicOn: sdkLocalMicOn,
    localWebcamOn: sdkLocalWebcamOn
  } = useMeeting({
    onMeetingJoined: async () => {
      console.log('🎉 Meeting joined successfully!')
      hasJoinedRef.current = true
      setConnectionQuality('good')

      // Update global meeting state now that we're actually joined
      setMeetingState(true, meetingId)
      console.log('✅ Global meeting state updated - user is now in meeting:', meetingId)

      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      // Apply initial device state BEFORE showing UI
      if (!hasSetInitialStateRef.current) {
        hasSetInitialStateRef.current = true

        console.log('🔧 User wanted when joining:', {
          wantedMicOn: initialMicOn,
          wantedCameraOn: initialWebcamOn
        })
        console.log('📊 VideoSDK ALWAYS starts with devices ON (required for toggle functionality)')

        // Wait for VideoSDK to fully initialize with devices ON (brief moment)
        await new Promise(resolve => setTimeout(resolve, 500))

        // IMPORTANT: We KNOW devices are ON because we set micEnabled:true, webcamEnabled:true
        // So we ONLY toggle if user wanted them OFF

        if (initialMicOn === false) {
          // User wanted mic OFF, but it's currently ON, so toggle it
          console.log('🔇 User wanted mic OFF - toggling mic to turn it OFF...')
          if (toggleMic) {
            toggleMic()
            await new Promise(resolve => setTimeout(resolve, 400))
            console.log('✅ Mic toggled OFF')
          }
        } else {
          // User wanted mic ON, it's already ON, do nothing
          console.log('🎤 User wanted mic ON - keeping it ON (no toggle needed)')
        }

        if (initialWebcamOn === false) {
          // User wanted camera OFF, but it's currently ON, so toggle it
          console.log('📴 User wanted camera OFF - toggling camera to turn it OFF...')
          if (toggleWebcam) {
            toggleWebcam()
            await new Promise(resolve => setTimeout(resolve, 400))
            console.log('✅ Camera toggled OFF')
          }
        } else {
          // User wanted camera ON, it's already ON, do nothing
          console.log('📹 User wanted camera ON - keeping it ON (no toggle needed)')
        }

        // Additional wait to ensure state is synced
        await new Promise(resolve => setTimeout(resolve, 300))
        console.log('🎬 Devices should now match user preferences:', {
          userWantedMic: initialMicOn,
          userWantedCamera: initialWebcamOn
        })
      }

      // NOW show the meeting UI
      setIsMeetingJoined(true)
      setIsConnecting(false)
      console.log('✅ Meeting UI visible - user can now see the session')
    },
    onMeetingLeft: () => {
      console.log('👋 Meeting left')
      setIsMeetingJoined(false)
      setIsConnecting(false)
      hasJoinedRef.current = false
      hasSetInitialStateRef.current = false

      // Reset device states
      setLocalMicOn(false)
      setLocalWebcamOn(false)
      setIsEnablingMic(false)
      setIsEnablingWebcam(false)

      // Reset attempt counters
      micEnableAttempts.current = 0
      webcamEnableAttempts.current = 0

      // Clear global meeting state
      setMeetingState(false, null)
      console.log('✅ Global meeting state cleared - user left meeting')

      onMeetingEnd()
    },
    onParticipantJoined: (participant: any) => {
      console.log('Participant joined:', participant)
      setParticipantCount(prev => prev + 1)
    },
    onParticipantLeft: (participant: any) => {
      console.log('Participant left:', participant)
      setParticipantCount(prev => Math.max(0, prev - 1))
    },
    onPresenterChanged: (presenterId: string | null) => {
      setIsScreenSharing(!!presenterId)
    },
    onSpeakerChanged: (activeSpeakerId: string | null) => {
      setDominantSpeaker(activeSpeakerId)
    },
    onError: (error: any) => {
      // Only log meaningful errors (skip empty objects and non-critical warnings)
      const hasErrorContent = error && (
        error.code ||
        error.message ||
        error.name ||
        (typeof error === 'string' && error.trim().length > 0) ||
        Object.keys(error || {}).length > 0
      )

      if (hasErrorContent) {
        console.error('Meeting error:', error)
        setConnectionQuality('poor')

        // Implement auto-reconnect logic for connection errors
        if (error?.code === 4001 || error?.message?.includes('connection')) {
          setConnectionQuality('disconnected')

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isMeetingJoined && hasJoinedRef.current === false) {
              console.log('Attempting to reconnect...')
              retryJoin()
            }
          }, 3000)
        }
      }
      // Silently ignore empty error objects
    }
  })

  const participantIds = [...participants.keys()]

  // Update local states based on SDK states with verification
  useEffect(() => {
    const newMicState = sdkLocalMicOn || false
    console.log('🎤 SDK Mic state changed:', newMicState)

    // Update ref immediately so async functions can read latest value
    sdkMicStateRef.current = newMicState

    // Only update if there's an actual change
    if (localMicOn !== newMicState) {
      console.log(`🔄 Updating local mic state: ${localMicOn} -> ${newMicState}`)
      setLocalMicOn(newMicState)
    }
  }, [sdkLocalMicOn, localMicOn])

  useEffect(() => {
    const newWebcamState = sdkLocalWebcamOn || false
    console.log('📹 SDK Webcam state changed:', newWebcamState)

    // Update ref immediately so async functions can read latest value
    sdkWebcamStateRef.current = newWebcamState

    // Only update if there's an actual change
    if (localWebcamOn !== newWebcamState) {
      console.log(`🔄 Updating local webcam state: ${localWebcamOn} -> ${newWebcamState}`)
      setLocalWebcamOn(newWebcamState)
    }
  }, [sdkLocalWebcamOn, localWebcamOn])

  // Periodic state verification to catch any desyncs (runs every 3 seconds while in meeting)
  useEffect(() => {
    if (!isMeetingJoined) return

    const verifyStateSync = () => {
      // Check if local state matches SDK state
      if (localMicOn !== (sdkLocalMicOn || false)) {
        console.warn(`⚠️ Mic state desync detected! Local: ${localMicOn}, SDK: ${sdkLocalMicOn}. Force syncing...`)
        setLocalMicOn(sdkLocalMicOn || false)
      }

      if (localWebcamOn !== (sdkLocalWebcamOn || false)) {
        console.warn(`⚠️ Webcam state desync detected! Local: ${localWebcamOn}, SDK: ${sdkLocalWebcamOn}. Force syncing...`)
        setLocalWebcamOn(sdkLocalWebcamOn || false)
      }
    }

    const intervalId = setInterval(verifyStateSync, 3000)
    return () => clearInterval(intervalId)
  }, [isMeetingJoined, localMicOn, localWebcamOn, sdkLocalMicOn, sdkLocalWebcamOn])

  // Update participant count
  useEffect(() => {
    setParticipantCount(participants.size)
  }, [participants])

  // Auto-join meeting with timeout and retry logic
  useEffect(() => {
    if (!meetingId || hasJoinedRef.current) {
      console.log('⏭️ Skipping join:', {
        hasMeetingId: !!meetingId,
        hasJoined: hasJoinedRef.current,
        isConnecting
      })
      return
    }

    console.log('🚀 Initiating meeting join process for:', meetingId)

    let timeoutId: NodeJS.Timeout
    let retryCount = 0
    const maxRetries = 2
    let mounted = true

    const attemptJoin = async () => {
      if (!mounted || hasJoinedRef.current) {
        console.log('🛑 Join cancelled - component unmounted or already joined')
        return
      }

      console.log(`📞 Attempting to join meeting (attempt ${retryCount + 1}/${maxRetries + 1})`)
      setIsConnecting(true)
      setConnectionQuality('good')

      try {
        // Give VideoSDK a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!mounted || hasJoinedRef.current) return

        console.log('🔄 Calling VideoSDK join()...')
        join()

        // Set a timeout to detect if join fails silently
        timeoutId = setTimeout(() => {
          if (!mounted) return

          if (!hasJoinedRef.current) {
            console.warn('⏰ Join attempt timed out')
            retryCount++

            if (retryCount <= maxRetries) {
              console.log(`🔄 Retrying join (${retryCount}/${maxRetries})...`)
              setIsConnecting(false)
              setTimeout(attemptJoin, 2000)
            } else {
              console.error('❌ Max join attempts reached')
              setIsConnecting(false)
              setConnectionQuality('disconnected')
            }
          }
        }, 15000) // 15 second timeout

      } catch (error) {
        console.error('💥 Join error:', error)

        if (!mounted) return

        setIsConnecting(false)
        setConnectionQuality('poor')

        if (retryCount < maxRetries) {
          retryCount++
          console.log(`🔄 Retrying after error (${retryCount}/${maxRetries})...`)
          setTimeout(attemptJoin, 3000)
        } else {
          console.error('❌ All join attempts failed')
          setConnectionQuality('disconnected')
        }
      }
    }

    // Start the join process after a brief delay to ensure component is fully mounted
    const initTimeout = setTimeout(attemptJoin, 500)

    return () => {
      mounted = false
      console.log('🧹 Cleaning up join effect')

      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (initTimeout) {
        clearTimeout(initTimeout)
      }
    }
  }, [meetingId]) // Only depend on meetingId

  // Handle component unmount
  useEffect(() => {
    return () => {
      if (hasJoinedRef.current) {
        // Don't call leave directly - just let VideoSDK handle cleanup
        hasJoinedRef.current = false
      }
    }
  }, [])

  // Toggle microphone - simplified (permissions already granted at join)
  const handleToggleMic = useCallback(async () => {
    if (isEnablingMic) {
      console.log('⏳ Already toggling mic...')
      return
    }

    try {
      setIsEnablingMic(true)

      const initialState = sdkMicStateRef.current
      console.log('🎤 Toggling microphone...', {
        currentLocalMicOn: localMicOn,
        currentSdkLocalMicOn: initialState,
        isMeetingJoined,
        hasToggleMic: !!toggleMic
      })

      if (!isMeetingJoined) {
        console.warn('⚠️ Meeting not joined yet')
        setIsEnablingMic(false)
        return
      }

      if (!toggleMic) {
        console.error('❌ VideoSDK toggleMic not available')
        setIsEnablingMic(false)
        return
      }

      // Call VideoSDK toggle
      console.log(`🔊 Calling VideoSDK toggleMic() - current state: ${initialState ? 'ON' : 'OFF'} -> expecting: ${!initialState ? 'ON' : 'OFF'}`)
      toggleMic()

      // Wait for SDK state to actually change (poll with timeout, reading from ref)
      const maxWaitTime = 2000 // 2 seconds max
      const pollInterval = 100 // Check every 100ms
      let waitedTime = 0
      let stateChanged = false

      while (waitedTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        waitedTime += pollInterval

        // Check if SDK state has changed by reading from ref
        const currentSdkState = sdkMicStateRef.current
        if (currentSdkState !== initialState) {
          stateChanged = true
          console.log(`✅ SDK mic state changed to: ${currentSdkState ? 'ON' : 'OFF'} (after ${waitedTime}ms)`)
          break
        }
      }

      const finalSdkState = sdkMicStateRef.current
      if (!stateChanged) {
        console.error(`⚠️ SDK mic state did not change after ${maxWaitTime}ms. Expected: ${!initialState}, Still: ${finalSdkState}`)
        // Force a UI update to reflect the SDK state
        setLocalMicOn(finalSdkState)
      } else {
        // Verify the UI state matches SDK state
        if (localMicOn !== finalSdkState) {
          console.log(`🔄 Syncing UI state to match SDK state: ${finalSdkState ? 'ON' : 'OFF'}`)
          setLocalMicOn(finalSdkState)
        }
      }

      console.log(`✅ Toggle complete - Final state: ${finalSdkState ? 'ON' : 'OFF'}`)

    } catch (error: any) {
      console.error('❌ Toggle mic error:', error)
      // On error, sync UI with SDK state
      setLocalMicOn(sdkMicStateRef.current)
    } finally {
      setIsEnablingMic(false)
    }
  }, [toggleMic, localMicOn, isEnablingMic, isMeetingJoined])

  const handleToggleWebcam = useCallback(async () => {
    if (isEnablingWebcam) {
      console.log('⏳ Already toggling camera...')
      return
    }

    try {
      setIsEnablingWebcam(true)

      const initialState = sdkWebcamStateRef.current
      console.log('📹 Toggling camera...', {
        currentLocalWebcamOn: localWebcamOn,
        currentSdkLocalWebcamOn: initialState,
        isMeetingJoined,
        hasToggleWebcam: !!toggleWebcam
      })

      if (!isMeetingJoined) {
        console.warn('⚠️ Meeting not joined yet')
        setIsEnablingWebcam(false)
        return
      }

      if (!toggleWebcam) {
        console.error('❌ VideoSDK toggleWebcam not available')
        setIsEnablingWebcam(false)
        return
      }

      // Call VideoSDK toggle
      console.log(`📹 Calling VideoSDK toggleWebcam() - current state: ${initialState ? 'ON' : 'OFF'} -> expecting: ${!initialState ? 'ON' : 'OFF'}`)
      toggleWebcam()

      // Wait for SDK state to actually change (poll with timeout, reading from ref)
      const maxWaitTime = 2000 // 2 seconds max
      const pollInterval = 100 // Check every 100ms
      let waitedTime = 0
      let stateChanged = false

      while (waitedTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        waitedTime += pollInterval

        // Check if SDK state has changed by reading from ref
        const currentSdkState = sdkWebcamStateRef.current
        if (currentSdkState !== initialState) {
          stateChanged = true
          console.log(`✅ SDK webcam state changed to: ${currentSdkState ? 'ON' : 'OFF'} (after ${waitedTime}ms)`)
          break
        }
      }

      const finalSdkState = sdkWebcamStateRef.current
      if (!stateChanged) {
        console.error(`⚠️ SDK webcam state did not change after ${maxWaitTime}ms. Expected: ${!initialState}, Still: ${finalSdkState}`)
        // Force a UI update to reflect the SDK state
        setLocalWebcamOn(finalSdkState)
      } else {
        // Verify the UI state matches SDK state
        if (localWebcamOn !== finalSdkState) {
          console.log(`🔄 Syncing UI state to match SDK state: ${finalSdkState ? 'ON' : 'OFF'}`)
          setLocalWebcamOn(finalSdkState)
        }
      }

      console.log(`✅ Toggle complete - Final state: ${finalSdkState ? 'ON' : 'OFF'}`)

    } catch (error: any) {
      console.error('❌ Toggle webcam error:', error)
      // On error, sync UI with SDK state
      setLocalWebcamOn(sdkWebcamStateRef.current)
    } finally {
      setIsEnablingWebcam(false)
    }
  }, [toggleWebcam, localWebcamOn, isEnablingWebcam, isMeetingJoined])

  const handleToggleScreenShare = useCallback(async () => {
    try {
      setScreenShareError(null)

      // Check if screen sharing is supported
      if (!isScreenShareSupported) {
        const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
        if (!isSecureContext) {
          setScreenShareError('Screen sharing requires HTTPS. Please use a secure connection.')
        } else {
          setScreenShareError('Screen sharing is not supported by your browser.')
        }
        return
      }

      // Check if already screen sharing
      if (presenterId) {
        // Stop screen sharing
        if (toggleScreenShare) {
          toggleScreenShare()
        }
        return
      }

      console.log('🖥️ Starting screen share process...')

      // Let VideoSDK handle the permission request directly
      // This ensures it's triggered by the user gesture
      try {
        if (toggleScreenShare) {
          console.log('🎬 Calling VideoSDK toggleScreenShare directly...')
          toggleScreenShare()
        }
      } catch (videoSdkError: any) {
        console.error('VideoSDK screen share error:', videoSdkError)

        // If VideoSDK fails, try manual permission request as fallback
        console.log('🔄 VideoSDK failed, trying manual permission request...')

        try {
          // Try with audio first, fallback to video only if it fails
          let stream
          try {
            stream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
                frameRate: { ideal: 15, max: 30 }
              },
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
            })
          } catch (audioError) {
            console.log('🔄 Audio capture failed, trying video only...')
            stream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
                frameRate: { ideal: 15, max: 30 }
              },
              audio: false
            })
          }

          console.log('✅ Manual screen sharing permissions granted')

          // Stop the manual stream - we just needed to get permission
          stream.getTracks().forEach(track => {
            track.stop()
          })

          // Try VideoSDK again now that permission is granted
          if (toggleScreenShare) {
            toggleScreenShare()
          }

        } catch (permissionError: any) {
          console.error('Manual screen sharing permission error:', permissionError)

          let errorMessage = 'Screen sharing failed'

          if (permissionError.name === 'NotAllowedError') {
            errorMessage = 'Permission denied. Please click "Share" when the browser asks for screen sharing permission.'
          } else if (permissionError.name === 'NotSupportedError') {
            errorMessage = 'Screen sharing is not supported by your browser.'
          } else if (permissionError.name === 'NotFoundError') {
            errorMessage = 'No screens available for sharing.'
          } else if (permissionError.name === 'AbortError') {
            errorMessage = 'Screen sharing was cancelled. Please try again and select a screen to share.'
          } else if (permissionError.name === 'InvalidStateError') {
            errorMessage = 'Screen sharing is already active or in an invalid state.'
          } else {
            errorMessage = `Screen sharing failed: ${permissionError.message || 'Unknown error'}`
          }

          setScreenShareError(errorMessage)

          // Show additional help for permission issues
          if (permissionError.name === 'NotAllowedError') {
            setTimeout(() => {
              setScreenShareError(
                'Screen sharing blocked. Try refreshing the page and clicking "Allow" when prompted, or check if your browser is blocking screen sharing permissions.'
              )
            }, 5000)
          }
        }
      }

    } catch (error: any) {
      console.error('General toggle screen share error:', error)
      setScreenShareError(`Screen sharing failed: ${error.message || 'Please try refreshing the page'}`)
    }
  }, [toggleScreenShare, presenterId, isScreenShareSupported])

  const handleLeaveMeeting = useCallback(() => {
    try {
      // Clear any reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (isMeetingJoined && leave) {
        leave()
      } else {
        onMeetingEnd()
      }
    } catch (error) {
      console.error('Leave meeting error:', error)
      // Force end meeting even if leave fails
      onMeetingEnd()
    }
  }, [isMeetingJoined, leave, onMeetingEnd])

  const handleToggleChat = useCallback(() => {
    setIsChatVisible(!isChatVisible)
  }, [isChatVisible])

  // Retry join function for manual retry
  const retryJoin = useCallback(() => {
    if (!isConnecting) {
      hasJoinedRef.current = false
      setIsConnecting(true)
      setConnectionQuality('good')

      try {
        join()
      } catch (error) {
        console.error('Manual retry error:', error)
        setIsConnecting(false)
        setConnectionQuality('poor')
      }
    }
  }, [join, isConnecting])

  // Loading screen with connection status
  if (isConnecting && !isMeetingJoined) {
    return (
      <div className="fixed inset-0 bg-gray-900 dark:bg-gray-950 flex items-center justify-center z-[20000]">
        <div className="text-center text-white max-w-md mx-auto px-6">
          {connectionQuality === 'disconnected' ? (
            // Connection failed state
            <>
              <WifiOff className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h2 className="text-xl font-semibold mb-2 text-red-400">Connection Failed</h2>
              <p className="text-gray-400 dark:text-gray-500 mb-6">
                Unable to join the meeting. Please check your internet connection and try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={retryJoin}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isConnecting}
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Try Again
                </Button>
                <Button
                  onClick={onMeetingEnd}
                  variant="outline"
                  className="text-white border-gray-600 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            // Connecting state
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
              <h2 className="text-xl font-semibold mb-2">Joining Meeting...</h2>
              <p className="text-gray-400 mb-2">Please wait while we connect you</p>
              <p className="text-sm text-gray-500 mb-6">Meeting ID: {meetingId}</p>

              {/* Connection quality indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${
                  connectionQuality === 'good' ? 'bg-green-500' :
                  connectionQuality === 'poor' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse'
                }`} />
                <span className="text-sm text-gray-400">
                  {connectionQuality === 'good' ? 'Connecting...' :
                   connectionQuality === 'poor' ? 'Poor connection, retrying...' : 'Connection failed'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={retryJoin}
                  variant="outline"
                  className="text-white border-gray-600 hover:bg-gray-800"
                  disabled={isConnecting}
                >
                  Retry Now
                </Button>
                <Button
                  onClick={onMeetingEnd}
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 dark:bg-gray-950 flex flex-col overflow-hidden z-[20000]">
      {/* Connection Status Bar */}
      <div className={`h-1 transition-colors duration-300 ${
        connectionQuality === 'good' ? 'bg-green-500' :
        connectionQuality === 'poor' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />

      {/* Top Bar - Meeting Info */}
      <div className="bg-gray-800/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-gray-700 dark:border-gray-600">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            connectionQuality === 'good' ? 'bg-green-500' :
            connectionQuality === 'poor' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse'
          }`} />
          <span className="text-white font-medium text-sm sm:text-base">
            Meeting ID: {meetingId.slice(-6)}
          </span>
          <div className="hidden sm:flex items-center gap-2 text-gray-300">
            <Users size={16} />
            <span className="text-sm">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionQuality === 'disconnected' && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <WifiOff size={16} />
              <span className="hidden sm:inline">Reconnecting...</span>
            </div>
          )}

          {/* Chat Toggle - Desktop */}
          <Button
            onClick={handleToggleChat}
            size="sm"
            variant={isChatVisible ? "default" : "ghost"}
            className={`hidden md:flex rounded-full h-9 w-9 p-0 ${
              isChatVisible
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
            }`}
          >
            <MessageSquare size={16} className="text-white" />
          </Button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 transition-all duration-300 ${
          isChatVisible && !isScreenSharing ? 'lg:mr-80' : ''
        }`}>
          {/* Screen Share Priority View */}
          {presenterId ? (
            <div className="h-full flex flex-col p-2 sm:p-4 gap-2 sm:gap-4">
              {/* Main Screen Share */}
              <div className="flex-1 min-h-0">
                <ScreenShareView presenterId={presenterId} />
              </div>

              {/* Participant Thumbnails */}
              <div className="h-20 sm:h-24 flex gap-2 overflow-x-auto pb-1">
                {participantIds.map((participantId) => (
                  <div key={participantId} className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                    <ParticipantView participantId={participantId} isScreenShareMode />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Regular Video Grid */
            <div className="h-full p-2 sm:p-4">
              <VideoGrid
                participantIds={participantIds}
                dominantSpeaker={dominantSpeaker}
              />
            </div>
          )}
        </div>

        {/* Desktop Chat Sidebar */}
        {isChatVisible && (
          <div className={`hidden lg:block ${
            isScreenSharing
              ? 'absolute right-4 top-20 w-96 h-[500px] z-[20002] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl'
              : 'w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-600'
          }`}>
            <MeetingChatComponent
              meetingId={meetingId}
              participantName={participantName}
              isVisible={true}
              onToggle={handleToggleChat}
              isScreenSharing={isScreenSharing}
              isEmbedded={true}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 sm:py-4 border-t border-gray-700 dark:border-gray-600">
        <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
          {/* Mic Control */}
          <Button
            onClick={handleToggleMic}
            size="sm"
            variant={localMicOn ? "default" : "destructive"}
            className={`rounded-full h-11 w-11 sm:h-12 sm:w-12 p-0 transition-all duration-200 hover:scale-110 ${
              localMicOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            disabled={isConnecting || isEnablingMic}
          >
            {isEnablingMic ? (
              <Loader2 size={18} className="sm:size-5 text-white animate-spin" />
            ) : localMicOn ? (
              <Mic size={18} className="sm:size-5 text-white" />
            ) : (
              <MicOff size={18} className="sm:size-5 text-white" />
            )}
          </Button>

          {/* Camera Control */}
          <Button
            onClick={handleToggleWebcam}
            size="sm"
            variant={localWebcamOn ? "default" : "destructive"}
            className={`rounded-full h-11 w-11 sm:h-12 sm:w-12 p-0 transition-all duration-200 hover:scale-110 ${
              localWebcamOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            disabled={isConnecting || isEnablingWebcam}
          >
            {isEnablingWebcam ? (
              <Loader2 size={18} className="sm:size-5 text-white animate-spin" />
            ) : localWebcamOn ? (
              <Video size={18} className="sm:size-5 text-white" />
            ) : (
              <VideoOff size={18} className="sm:size-5 text-white" />
            )}
          </Button>

          {/* Screen Share Control */}
          <Button
            onClick={handleToggleScreenShare}
            size="sm"
            variant={presenterId ? "default" : "ghost"}
            className={`rounded-full h-11 w-11 sm:h-12 sm:w-12 p-0 transition-all duration-200 hover:scale-110 ${
              !isScreenShareSupported ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              presenterId
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
            }`}
            disabled={isConnecting || !isScreenShareSupported}
            title={!isScreenShareSupported
              ? `Screen sharing unavailable: ${screenSharingDiagnostics.checkSupport().issues.join(', ')}`
              : presenterId
                ? 'Stop screen sharing'
                : 'Share your screen'
            }
          >
            {presenterId ? <MonitorStop size={18} className="sm:size-5 text-white" /> : <Monitor size={18} className="sm:size-5 text-white" />}
          </Button>

          {/* Chat Toggle */}
          <Button
            onClick={handleToggleChat}
            size="sm"
            variant={isChatVisible ? "default" : "ghost"}
            className={`rounded-full h-11 w-11 sm:h-12 sm:w-12 p-0 transition-all duration-200 hover:scale-110 ${
              isChatVisible
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
            }`}
          >
            <MessageSquare size={18} className="sm:size-5 text-white" />
          </Button>

          {/* Leave Meeting */}
          <Button
            onClick={handleLeaveMeeting}
            size="sm"
            variant="destructive"
            className="rounded-full h-11 w-11 sm:h-12 sm:w-12 p-0 transition-all duration-200 hover:scale-110 ml-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <PhoneOff size={18} className="sm:size-5 text-white" />
          </Button>
        </div>

        {/* Mobile Participant Count */}
        <div className="sm:hidden flex items-center justify-center gap-2 text-gray-400 text-xs mt-2">
          <Users size={14} />
          <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Screen Share Error Toast */}
      {screenShareError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[20001] max-w-md mx-auto">
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg border border-red-500 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <WifiOff size={16} className="text-red-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">Screen Sharing Error</p>
              <p className="text-sm text-red-100">{screenShareError}</p>
            </div>
            <button
              onClick={() => setScreenShareError(null)}
              className="flex-shrink-0 text-red-200 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Screen Sharing Status Indicator */}
      {presenterId && (
        <div className="absolute top-4 right-4 z-[20001]">
          <div className="bg-green-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <Monitor size={14} />
            <span className="text-sm font-medium">Screen Sharing Active</span>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Chat Overlay */}
      {isChatVisible && (
        <div className="lg:hidden">
          <MeetingChatComponent
            meetingId={meetingId}
            participantName={participantName}
            isVisible={true}
            onToggle={handleToggleChat}
            isScreenSharing={isScreenSharing}
            isEmbedded={false}
          />
        </div>
      )}
    </div>
  )
}

// Video Grid Component
function VideoGrid({ participantIds, dominantSpeaker }: {
  participantIds: string[]
  dominantSpeaker: string | null
}) {
  const getGridClass = () => {
    const count = participantIds.length
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-2 lg:grid-cols-2'
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3'
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }

  // Sort participants to show dominant speaker first
  const sortedParticipants = [...participantIds].sort((a, b) => {
    if (a === dominantSpeaker) return -1
    if (b === dominantSpeaker) return 1
    return 0
  })

  return (
    <div className={`h-full grid ${getGridClass()} gap-2 sm:gap-4 auto-rows-fr`}>
      {sortedParticipants.map((participantId, index) => (
        <ParticipantView
          key={participantId}
          participantId={participantId}
          isDominantSpeaker={participantId === dominantSpeaker}
          priority={index === 0}
        />
      ))}
    </div>
  )
}

// Participant video view
function ParticipantView({
  participantId,
  isDominantSpeaker,
  isScreenShareMode = false,
  priority = false
}: {
  participantId: string
  isDominantSpeaker?: boolean
  isScreenShareMode?: boolean
  priority?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed'>('connecting')

  const { webcamStream, micStream, webcamOn, micOn, displayName, isLocal } = useParticipant(participantId)

  useEffect(() => {
    if (webcamStream && videoRef.current) {
      const mediaStream = new MediaStream()
      mediaStream.addTrack(webcamStream.track)
      videoRef.current.srcObject = mediaStream

      videoRef.current.play()
        .then(() => {
          setIsVideoLoaded(true)
          setConnectionState('connected')
        })
        .catch((error) => {
          console.error('Video play error:', error)
          setConnectionState('failed')
        })

      // Handle video events
      const video = videoRef.current
      const handleLoadedMetadata = () => setIsVideoLoaded(true)
      const handleError = () => setConnectionState('failed')

      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('error', handleError)

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('error', handleError)
      }
    } else {
      setIsVideoLoaded(false)
    }
  }, [webcamStream])

  useEffect(() => {
    if (micStream && audioRef.current && !isLocal) {
      const mediaStream = new MediaStream()
      mediaStream.addTrack(micStream.track)
      audioRef.current.srcObject = mediaStream
      audioRef.current.play().catch(console.error)
    }
  }, [micStream, isLocal])

  const containerClasses = `
    relative overflow-hidden transition-all duration-200
    ${isScreenShareMode
      ? 'rounded-lg bg-gray-800 border border-gray-600'
      : `rounded-xl bg-gray-800 shadow-lg ${
          isDominantSpeaker ? 'ring-2 ring-blue-500 shadow-blue-500/20' : ''
        }`
    }
  `

  return (
    <div className={containerClasses}>
      {/* Video or Avatar */}
      <div className={`relative w-full ${
        isScreenShareMode ? 'aspect-video' : 'aspect-video'
      }`}>
        {webcamOn && connectionState !== 'failed' ? (
          <>
            {/* Loading State */}
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}

            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isLocal}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          /* Avatar/Placeholder */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <div className="text-center text-white">
              <div className={`${isScreenShareMode ? 'w-8 h-8' : 'w-12 h-12 sm:w-16 sm:h-16'} bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2`}>
                <Users size={isScreenShareMode ? 16 : 24} />
              </div>
              {!isScreenShareMode && (
                <p className="text-xs sm:text-sm font-medium truncate max-w-full px-2">
                  {displayName || 'Participant'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Audio element (hidden) */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Overlays */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        {/* Name and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <span className={`text-white font-medium truncate ${
              isScreenShareMode ? 'text-xs' : 'text-sm'
            }`}>
              {displayName || 'Participant'}
              {isLocal && ' (You)'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Mic Status */}
            {!micOn && (
              <div className="bg-red-500 rounded-full p-1">
                <MicOff size={isScreenShareMode ? 10 : 12} className="text-white" />
              </div>
            )}

            {/* Connection Status */}
            {connectionState === 'failed' && (
              <div className="bg-red-500 rounded-full p-1">
                <WifiOff size={isScreenShareMode ? 10 : 12} className="text-white" />
              </div>
            )}

            {/* Speaking Indicator */}
            {isDominantSpeaker && micOn && (
              <div className="bg-green-500 rounded-full p-1 animate-pulse">
                <Volume2 size={isScreenShareMode ? 10 : 12} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Screen share view
function ScreenShareView({ presenterId }: { presenterId: string }) {
  const screenRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { screenShareStream, displayName } = useParticipant(presenterId)

  const maxRetries = 3

  const loadScreenShare = useCallback(async () => {
    if (!screenShareStream || !screenRef.current) {
      setIsLoaded(false)
      setError(false)
      return
    }

    try {
      const mediaStream = new MediaStream()
      mediaStream.addTrack(screenShareStream.track)
      screenRef.current.srcObject = mediaStream

      // Add event listeners for better error handling
      const video = screenRef.current
      const handleLoadedMetadata = () => {
        console.log('✅ Screen share video loaded successfully')
        setIsLoaded(true)
        setError(false)
        setRetryCount(0)
      }

      const handleError = (e: any) => {
        console.error('❌ Screen share video error:', e)
        setError(true)
        setIsLoaded(false)
      }

      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('error', handleError)

      await video.play()

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('error', handleError)
      }
    } catch (playError) {
      console.error('Screen share video play error:', playError)
      setError(true)
      setIsLoaded(false)
    }
  }, [screenShareStream])

  useEffect(() => {
    loadScreenShare()
  }, [loadScreenShare])

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying screen share load (${retryCount + 1}/${maxRetries})`)
      setRetryCount(prev => prev + 1)
      setError(false)
      setIsLoaded(false)
      loadScreenShare()
    }
  }, [retryCount, maxRetries, loadScreenShare])

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading screen share...</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-300 mb-4">Screen share unavailable</p>
            {retryCount < maxRetries && (
              <Button
                onClick={handleRetry}
                size="sm"
                variant="outline"
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                <Loader2 className={`w-4 h-4 mr-2 ${retryCount > 0 ? 'animate-spin' : ''}`} />
                Try Again ({retryCount}/{maxRetries})
              </Button>
            )}
            {retryCount >= maxRetries && (
              <p className="text-xs text-gray-500">Maximum retry attempts reached</p>
            )}
          </div>
        </div>
      ) : (
        <video
          ref={screenRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Screen Share Info Overlay */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Monitor size={16} className="text-green-400" />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <span className="text-sm font-medium">
              {displayName || 'Someone'} is sharing their screen
            </span>
            {isLoaded && (
              <div className="text-xs text-green-300 mt-0.5">
                ● Live
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main VideoMeeting component with MeetingProvider
export default function VideoMeeting({
  meetingId,
  token,
  participantName,
  isHost,
  appointmentId,
  onMeetingEnd,
  initialMicOn = true,
  initialWebcamOn = true
}: VideoMeetingProps) {
  // Validate required props
  useEffect(() => {
    console.log('🔍 VideoSDK Config:', {
      meetingId: meetingId ? `${meetingId.slice(0, 8)}...` : 'MISSING',
      token: token ? `${token.slice(0, 20)}...` : 'MISSING',
      participantName,
      isHost
    })

    if (!meetingId) {
      console.error('❌ Missing meetingId')
    }
    if (!token) {
      console.error('❌ Missing token')
    }
    if (!participantName) {
      console.error('❌ Missing participantName')
    }
  }, [meetingId, token, participantName, isHost])

  // Show error if missing required props
  if (!meetingId || !token) {
    return (
      <div className="fixed inset-0 bg-gray-900 dark:bg-gray-950 flex items-center justify-center z-[20000]">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red-400">Meeting Setup Error</h2>
          <p className="text-gray-400 mb-6">
            {!meetingId && "Missing meeting ID. "}
            {!token && "Missing authentication token. "}
            Please try again.
          </p>
          <Button
            onClick={onMeetingEnd}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Request permissions before initializing VideoSDK
  // This ensures we have permissions even when starting with devices off
  const [permissionsGranted, setPermissionsGranted] = useState(false)

  useEffect(() => {
    const requestPermissions = async () => {
      console.log('🔐 Requesting device permissions before VideoSDK init...')

      try {
        // Request both audio and video permissions
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        })

        console.log('✅ Permissions granted, stopping test stream...')

        // Stop all tracks immediately
        stream.getTracks().forEach(track => {
          console.log(`🛑 Stopping ${track.kind} track`)
          track.stop()
        })

        // Wait a bit for streams to fully release
        await new Promise(resolve => setTimeout(resolve, 300))

        console.log('✅ Test streams stopped, ready to initialize VideoSDK')
        setPermissionsGranted(true)
      } catch (error: any) {
        console.error('❌ Permission request failed:', error)
        alert('Camera and microphone permissions are required for video meetings. Please allow access and try again.')
        onMeetingEnd()
      }
    }

    requestPermissions()
  }, [onMeetingEnd])

  const config = {
    meetingId,
    // IMPORTANT: Always enable devices during initialization to set up device access
    // We'll toggle them OFF in onMeetingJoined if user wanted them off
    micEnabled: true,
    webcamEnabled: true,
    name: participantName || 'Participant',
    mode: 'CONFERENCE' as const,
    multiStream: true,
    debugMode: true, // Enable debug mode to get more logs
    // Screen sharing configuration
    screenShareConfig: {
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 15, max: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    }
  }

  console.log('🎥 VideoMeeting config:', {
    micEnabled: initialMicOn,
    webcamEnabled: initialWebcamOn,
    permissionsGranted
  })

  // Wait for permissions before initializing VideoSDK
  if (!permissionsGranted) {
    return (
      <div className="fixed inset-0 bg-gray-900 dark:bg-gray-950 flex items-center justify-center z-[20000]">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold mb-2">Requesting Permissions...</h2>
          <p className="text-gray-400 mb-2">Please allow camera and microphone access</p>
        </div>
      </div>
    )
  }

  return (
    <MeetingProvider config={config} token={token}>
      <MeetingConsumer>
        {() => (
          <MeetingView
            meetingId={meetingId}
            participantName={participantName || 'Participant'}
            onMeetingEnd={onMeetingEnd}
            appointmentId={appointmentId}
            initialMicOn={initialMicOn}
            initialWebcamOn={initialWebcamOn}
          />
        )}
      </MeetingConsumer>
    </MeetingProvider>
  )
}