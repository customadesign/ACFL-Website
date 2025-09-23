'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  MeetingConsumer
} from '@videosdk.live/react-sdk'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Users,
  MessageSquare,
  Share2,
  Settings,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react'
import MeetingChat from '@/components/MeetingChat'
import { updateParticipantStatus } from '@/services/videoMeeting'

interface VideoMeetingProps {
  meetingId: string
  token: string
  participantName: string
  isHost: boolean
  appointmentId: string
  onMeetingEnd: () => void
  initialMicOn?: boolean
  initialWebcamOn?: boolean
}

// Connection State Display Component
function ConnectionStatus({ connectionStatus }: { connectionStatus: string }) {
  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'CONNECTING':
        return {
          icon: <Loader2 className="animate-spin" size={16} />,
          text: 'Connecting...',
          color: 'text-yellow-600'
        }
      case 'CONNECTED':
        return {
          icon: <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />,
          text: 'Connected',
          color: 'text-green-600'
        }
      case 'FAILED':
        return {
          icon: <AlertCircle size={16} />,
          text: 'Connection Failed',
          color: 'text-red-600'
        }
      case 'DISCONNECTED':
        return {
          icon: <UserX size={16} />,
          text: 'Disconnected',
          color: 'text-gray-600'
        }
      case 'CLOSING':
        return {
          icon: <Loader2 className="animate-spin" size={16} />,
          text: 'Closing...',
          color: 'text-orange-600'
        }
      case 'CLOSED':
        return {
          icon: <PhoneOff size={16} />,
          text: 'Meeting Ended',
          color: 'text-gray-600'
        }
      default:
        return {
          icon: null,
          text: connectionStatus,
          color: 'text-gray-600'
        }
    }
  }

  const status = getStatusDisplay()

  return (
    <div className={`flex items-center gap-2 ${status.color}`}>
      {status.icon}
      <span className="text-sm font-medium">{status.text}</span>
    </div>
  )
}

// Waiting Lobby Component
function WaitingLobby({ 
  participantName, 
  onLeave 
}: { 
  participantName: string
  onLeave: () => void 
}) {
  const [waitTime, setWaitTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 text-center">
        <div className="mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Clock className="text-blue-600" size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Waiting for Host</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Hi {participantName}, you're in the waiting room
          </p>
        </div>

        <div className="mb-4 sm:mb-6">
          <p className="text-sm text-gray-500 mb-2">Waiting time</p>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-gray-800">
            {formatTime(waitTime)}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            The host will let you in soon. Please wait...
          </p>
          <Button
            variant="outline"
            onClick={onLeave}
            className="w-full"
            size="sm"
          >
            Leave Waiting Room
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Participant Video Component with Speaking Indicators
function ParticipantView({ participantId }: { participantId: string }) {
  const micRef = useRef<HTMLAudioElement>(null)
  const { 
    webcamStream, 
    micStream, 
    webcamOn, 
    micOn, 
    isLocal, 
    displayName
  } = useParticipant(participantId)
  
  // Simple speaking detection based on audio stream activity
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  useEffect(() => {
    if (micStream && micOn) {
      // Create a proper MediaStream from the micStream track
      const mediaStream = new MediaStream()
      if (micStream.track) {
        mediaStream.addTrack(micStream.track)
      } else {
        // If micStream doesn't have a track property, it might already be a MediaStream
        console.warn('micStream format unexpected, skipping audio visualization')
        setIsSpeaking(false)
        return
      }
      
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(mediaStream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
        // Use different thresholds for local vs remote participants
        const threshold = isLocal ? 15 : 25 // Lower threshold for local user
        setIsSpeaking(average > threshold)
        
        requestAnimationFrame(checkAudioLevel)
      }
      
      checkAudioLevel()
      
      return () => {
        audioContext.close()
      }
    } else {
      setIsSpeaking(false)
    }
  }, [micStream, micOn, isLocal])

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (webcamOn && webcamStream && videoRef.current) {
      // Check if track is still live before using it
      if (webcamStream.track && webcamStream.track.readyState === 'live') {
        // Just detach existing stream without stopping tracks
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject = null
        }
        
        const mediaStream = new MediaStream([webcamStream.track])
        videoRef.current.srcObject = mediaStream
        
        // Only play if the element is not already playing
        if (videoRef.current.paused) {
          videoRef.current.play().catch(error => {
            // Ignore interruption errors
            if (error.name !== 'AbortError') {
              console.error("video play error", error)
            }
          })
        }
      } else {
        console.warn("Webcam track already ended or not available")
      }
    }
    
    return () => {
      // Just detach stream, don't stop tracks - let VideoSDK manage them
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null
      }
    }
  }, [webcamStream, webcamOn])

  useEffect(() => {
    if (micOn && micStream && micRef.current) {
      // Check if track is still live before using it
      if (micStream.track && micStream.track.readyState === 'live') {
        // Just detach existing stream without stopping tracks
        if (micRef.current.srcObject) {
          micRef.current.srcObject = null
        }
        
        const mediaStream = new MediaStream([micStream.track])
        micRef.current.srcObject = mediaStream
        
        // Only play if the element is not already playing
        if (micRef.current.paused) {
          micRef.current.play().catch(error => {
            // Ignore interruption errors
            if (error.name !== 'AbortError') {
              console.error("audio play error", error)
            }
          })
        }
      } else {
        console.warn("Mic track already ended or not available")
      }
    }
    
    return () => {
      // Just detach stream, don't stop tracks - let VideoSDK manage them
      if (micRef.current && micRef.current.srcObject) {
        micRef.current.srcObject = null
      }
    }
  }, [micStream, micOn])

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden aspect-video transition-all duration-200 ${
      isSpeaking ? 'ring-2 sm:ring-4 ring-green-500 ring-opacity-75' : ''
    }`}>
      <audio ref={micRef} autoPlay muted={isLocal} />
      {webcamOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
          style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 transition-all duration-200 ${
              isSpeaking ? 'ring-2 ring-green-400 ring-opacity-75' : ''
            }`}>
              <VideoOff className="text-gray-400" size={24} />
            </div>
            <p className="text-white font-medium text-xs sm:text-sm truncate px-2">{displayName}</p>
          </div>
        </div>
      )}

      {/* Speaking indicator overlay */}
      {isSpeaking && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <div className="bg-green-500 rounded-full px-1 sm:px-2 py-1 flex items-center gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium hidden sm:inline">Speaking</span>
          </div>
        </div>
      )}

      {/* Name and status overlay */}
      <div className="absolute bottom-1 left-1 right-1 sm:bottom-2 sm:left-2 sm:right-2 flex items-center justify-between">
        <div className={`bg-black/60 rounded px-1 sm:px-2 py-1 flex items-center gap-1 sm:gap-2 transition-all duration-200 max-w-[70%] ${
          isSpeaking ? 'bg-green-900/60' : ''
        }`}>
          <span className="text-white text-xs sm:text-sm truncate">{displayName}</span>
          {isLocal && <span className="text-xs text-blue-400 hidden sm:inline">(You)</span>}
          {isLocal && <span className="text-xs text-blue-400 sm:hidden">You</span>}
          {isSpeaking && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {!micOn && (
            <div className="bg-red-600 rounded p-0.5 sm:p-1">
              <MicOff size={10} className="text-white sm:size-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Meeting Controls Component
function MeetingControls({ isHost, onChatToggle }: { isHost: boolean; onChatToggle?: () => void }) {
  const {
    leave,
    end,
    toggleMic,
    toggleWebcam,
    toggleScreenShare,
    muteMic,
    unmuteMic,
    localMicOn,
    localWebcamOn,
    presenterId,
    localParticipant
  } = useMeeting()

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [micToggling, setMicToggling] = useState(false)
  const micStreamRef = useRef<MediaStream | null>(null)

  // Check if current user is presenting
  const isPresenting = presenterId === localParticipant?.id

  const handleLeaveMeeting = () => {
    leave()
  }

  const handleEndMeeting = () => {
    if (isHost) {
      setShowEndConfirm(true)
    } else {
      leave()
    }
  }

  const confirmEndMeeting = () => {
    end()
    setShowEndConfirm(false)
  }

  const handleScreenShare = async () => {
    try {
      setIsScreenSharing(true)
      await toggleScreenShare()
      setIsScreenSharing(false)
    } catch (error) {
      console.error('Screen share toggle failed:', error)
      setIsScreenSharing(false)
    }
  }

  const handleMicToggle = async () => {
    if (micToggling) return
    
    setMicToggling(true)
    try {
      if (localMicOn) {
        // Mute the microphone using VideoSDK's proper method
        await muteMic()
      } else {
        // Unmute the microphone using VideoSDK's proper method
        await unmuteMic()
      }
      
    } catch (error: any) {
      console.error('VideoSDK microphone toggle failed:', error)
      
      // Handle InvalidStateError (track ended) by reacquiring mic
      if (error.name === 'InvalidStateError' || error.message?.includes('track ended')) {
        try {
          console.log('Attempting to reacquire microphone due to track ended error')
          
          // Force re-acquire mic permission
          const newStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          })
          
          const [newTrack] = newStream.getAudioTracks()
          if (newTrack && newTrack.readyState === 'live') {
            console.log('Successfully reacquired microphone, retrying toggle')
            
            // Clean up old stream reference
            if (micStreamRef.current) {
              micStreamRef.current.getTracks().forEach(track => {
                if (track.readyState === 'ended') {
                  track.stop()
                }
              })
            }
            micStreamRef.current = newStream
            
            // Retry the toggle after a brief delay
            await new Promise(resolve => setTimeout(resolve, 200))
            await toggleMic()
            
            console.log('Successfully recovered microphone functionality')
          }
        } catch (getUserMediaError) {
          console.error('Failed to reacquire microphone:', getUserMediaError)
          alert('Microphone access was lost and could not be restored. Please refresh the page or check your microphone permissions.')
        }
      } else {
        // For other errors, try fallback toggle
        try {
          await toggleMic()
        } catch (fallbackError) {
          console.error('Fallback microphone toggle also failed:', fallbackError)
          alert('Microphone toggle failed. Please refresh the page to continue.')
        }
      }
    } finally {
      setTimeout(() => setMicToggling(false), 300)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-3 sm:gap-9 p-3 sm:p-6 bg-white border-t shadow-lg backdrop-blur-sm">
        {/* Microphone Control */}
        <Button
          variant={localMicOn ? "outline" : "destructive"}
          size="sm"
          onClick={handleMicToggle}
          disabled={micToggling}
          className="rounded-full shadow-md flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12"
          title={localMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micToggling ? (
            <Loader2 size={16} className="animate-spin sm:size-5" />
          ) : localMicOn ? (
            <Mic size={16} className="sm:size-5" />
          ) : (
            <MicOff size={16} className="sm:size-5" />
          )}
        </Button>

        {/* Camera Control */}
        <Button
          variant={localWebcamOn ? "outline" : "destructive"}
          size="sm"
          onClick={() => toggleWebcam()}
          className="rounded-full shadow-md flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12"
          title={localWebcamOn ? "Turn off camera" : "Turn on camera"}
        >
          {localWebcamOn ? <Video size={16} className="sm:size-5" /> : <VideoOff size={16} className="sm:size-5" />}
        </Button>

        <Button
          variant={isPresenting ? "default" : "outline"}
          size="sm"
          onClick={handleScreenShare}
          disabled={isScreenSharing}
          className={`rounded-full shadow-md flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 xs:flex ${isPresenting ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
          title={isPresenting ? "Stop sharing screen" : "Share screen"}
        >
          {isScreenSharing ? (
            <Loader2 size={16} className="animate-spin sm:size-5" />
          ) : (
            <Share2 size={16} className="sm:size-5" />
          )}
        </Button>

        {onChatToggle && (
          <Button
            variant="outline"
            size="sm"
            onClick={onChatToggle}
            className="rounded-full shadow-md flex-shrink-0 h-10 w-10 sm:h-12 hidden sm:w-12 xs:flex"
            title="Toggle chat"
          >
            <MessageSquare size={16} className="sm:size-5" />
          </Button>
        )}

        {/* End/Leave Meeting */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEndMeeting}
          className="rounded-full px-3 sm:px-6 shadow-md flex-shrink-0 h-10 sm:h-12"
          title={isHost ? "End meeting for all" : "Leave meeting"}
        >
          <PhoneOff size={16} className="mr-1 sm:mr-2 sm:size-5" />
          <span className="text-xs sm:text-sm">{isHost ? 'End' : 'Leave'}</span>
        </Button>
      </div>

      {/* Status Indicators - Hidden on small screens to save space */}
      <div className="bg-gray-50/95 px-2 sm:px-4 py-2 border-t backdrop-blur-sm hidden sm:flex items-center justify-center gap-2 sm:gap-4 text-xs text-gray-600 overflow-x-auto">
        {localMicOn && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="hidden md:inline">Mic on</span>
          </div>
        )}
        {localWebcamOn && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="hidden md:inline">Camera on</span>
          </div>
        )}
        {isPresenting && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="hidden md:inline">You're sharing your screen</span>
          </div>
        )}
        {presenterId && !isPresenting && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="hidden md:inline">Someone is sharing screen</span>
          </div>
        )}
      </div>

      {/* End Meeting Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-2">End meeting for all?</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              This will end the meeting for all participants. Are you sure?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 text-sm"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleLeaveMeeting}
                className="flex-1 text-sm"
                size="sm"
              >
                Leave Only
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEndMeeting}
                className="flex-1 text-sm"
                size="sm"
              >
                End for All
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

// Screen Share View Component
function ScreenShareView({ participantId }: { participantId: string }) {
  const { screenShareStream, displayName } = useParticipant(participantId)
  const screenRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (screenShareStream && screenRef.current) {
      // Check if track is still live before using it
      if (screenShareStream.track && screenShareStream.track.readyState === 'live') {
        // Just detach existing stream without stopping tracks
        if (screenRef.current.srcObject) {
          screenRef.current.srcObject = null
        }
        
        const mediaStream = new MediaStream([screenShareStream.track])
        screenRef.current.srcObject = mediaStream
        
        // Only play if the element is not already playing
        if (screenRef.current.paused) {
          screenRef.current.play().catch(error => {
            // Ignore interruption errors
            if (error.name !== 'AbortError') {
              console.error("screen share play error", error)
            }
          })
        }
      } else {
        console.warn("Screen share track already ended or not available")
      }
    }
    
    return () => {
      // Just detach stream, don't stop tracks - let VideoSDK manage them
      if (screenRef.current && screenRef.current.srcObject) {
        screenRef.current.srcObject = null
      }
    }
  }, [screenShareStream])

  return (
    <div className="relative bg-black rounded-lg overflow-hidden w-full h-full">
      <video
        ref={screenRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
        <div className="bg-blue-600 rounded px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1 sm:gap-2">
          <Share2 size={12} className="text-white sm:size-3.5" />
          <span className="text-white text-xs sm:text-sm font-medium truncate max-w-32 sm:max-w-none">
            <span className="hidden sm:inline">{displayName} is sharing</span>
            <span className="sm:hidden">{displayName}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// Main Meeting View Component
function MeetingView({ 
  isHost, 
  onMeetingEnd,
  meetingId,
  participantName
}: { 
  isHost: boolean
  onMeetingEnd: () => void
  meetingId: string
  participantName: string
}) {
  const [hasJoined, setHasJoined] = useState(false)
  const [hasLeft, setHasLeft] = useState(false)
  const [connectionState, setConnectionState] = useState('CONNECTING')
  const [showChat, setShowChat] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200)

  const {
    participants,
    localParticipant,
    presenterId
  } = useMeeting({
    onMeetingJoined: () => {
      if (!hasJoined) {
        console.log("Meeting Joined")
        updateParticipantStatus(meetingId, 'joined')
        setHasJoined(true)
        setConnectionState('CONNECTED')
      }
    },
    onMeetingLeft: () => {
      if (!hasLeft) {
        console.log("Meeting Left")
        updateParticipantStatus(meetingId, 'left')
        setHasLeft(true)
        setConnectionState('CLOSED')
        onMeetingEnd()
      }
    },
    onPresenterChanged: (presenterId) => {
      console.log("Presenter changed:", presenterId)
    }
  })

  const participantIds = [...participants.keys()]
  const presenterParticipant = presenterId ? participants.get(presenterId) : null

  // Handle window resize for responsive grid
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWindowWidth(window.innerWidth)
      }
    }

    // Initial set
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
    }

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Calculate optimal grid layout
  const getGridLayout = (participantCount: number, screenWidth: number) => {
    if (participantCount === 0) return { cols: 1, rows: 1 }
    if (participantCount === 1) return { cols: 1, rows: 1 }
    if (participantCount === 2) return { cols: screenWidth < 640 ? 1 : 2, rows: screenWidth < 640 ? 2 : 1 }

    // For 3+ participants, calculate optimal grid based on screen size and participant count
    const maxCols = screenWidth < 640 ? 2 : screenWidth < 1024 ? 3 : 4
    const optimalCols = Math.min(Math.ceil(Math.sqrt(participantCount)), maxCols)
    const rows = Math.ceil(participantCount / optimalCols)

    return { cols: optimalCols, rows }
  }

  const gridLayout = getGridLayout(participantIds.length, windowWidth)

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h2 className="font-semibold text-sm sm:text-base truncate">Video Session</h2>
          <div className="hidden sm:block">
            <ConnectionStatus connectionStatus={connectionState} />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Users size={14} className="sm:size-4" />
            <span className="hidden xs:inline">{participantIds.length}</span>
            <span className="xs:hidden">{participantIds.length}</span>
          </div>
          {presenterId && (
            <span className="px-1 sm:px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
              <Share2 size={10} className="sm:size-3" />
              <span className="hidden sm:inline">Screen Sharing</span>
            </span>
          )}
          {isHost && (
            <span className="px-1 sm:px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
              <span>HOST</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area - adjusted to account for fixed controls */}
      <div className={`flex-1 flex ${presenterId ? 'pb-32 sm:pb-20 md:pb-24' : 'pb-16 sm:pb-20 md:pb-24'}`}>
        <div className="flex-1 p-2 sm:p-4 overflow-hidden">
          {presenterId ? (
            <ScreenShareView participantId={presenterId} />
          ) : (
            <div className="h-full w-full overflow-y-auto">
              <div
                className="grid gap-2 sm:gap-4 min-h-full w-full"
                style={{
                  gridTemplateColumns: `repeat(${gridLayout.cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridLayout.rows}, minmax(0, 1fr))`
                }}
                key={`grid-${participantIds.length}-${gridLayout.cols}x${gridLayout.rows}`}
              >
                {participantIds.map((participantId, index) => (
                  <ParticipantView
                    key={`participant-${participantId}-${index}`}
                    participantId={participantId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with participant videos when screen sharing - Mobile: bottom overlay, Desktop: sidebar */}
        {presenterId && (
          <>
            <div className="fixed bottom-16 left-0 right-0 bg-gray-800/95 backdrop-blur-sm p-2 border-t border-gray-700 md:hidden z-40">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-white" />
                <span className="text-white text-xs font-medium">{participantIds.length} participants</span>
              </div>
              <div className="overflow-x-auto pb-2">
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${participantIds.length}, minmax(80px, 80px))`,
                    gridTemplateRows: '64px',
                    width: `${participantIds.length * 88}px`
                  }}
                  key={`mobile-grid-${participantIds.length}`}
                >
                  {participantIds.map((participantId, index) => (
                    <div key={`mobile-participant-${participantId}-${index}`} className="rounded-lg overflow-hidden">
                      <ParticipantView participantId={participantId} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Traditional sidebar */}
            <div className="hidden md:block w-72 md:w-80 bg-gray-800 p-2 sm:p-4 border-l border-gray-700 overflow-hidden flex flex-col">
              <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2 flex-shrink-0">
                <Users size={14} />
                <span>Participants ({participantIds.length})</span>
              </h3>
              <div className="flex-1 overflow-y-auto">
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${participantIds.length === 1 ? 1 : windowWidth < 1280 ? 1 : 2}, minmax(0, 1fr))`,
                    gridAutoRows: 'minmax(120px, auto)'
                  }}
                  key={`desktop-grid-${participantIds.length}-${windowWidth < 1280 ? 1 : 2}`}
                >
                  {participantIds.map((participantId, index) => (
                    <div key={`desktop-participant-${participantId}-${index}`} className="aspect-video">
                      <ParticipantView participantId={participantId} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed Controls at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <MeetingControls isHost={isHost} onChatToggle={() => setShowChat(!showChat)} />
      </div>
      
      {/* Meeting Chat */}
      <MeetingChat
        meetingId={meetingId}
        participantName={participantName}
        isVisible={showChat}
        onToggle={() => setShowChat(!showChat)}
        isScreenSharing={!!presenterId}
      />
    </div>
  )
}

// Main Component with MeetingProvider
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
  return (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: initialMicOn,
        webcamEnabled: initialWebcamOn,
        name: participantName,
        mode: 'CONFERENCE',
        multiStream: true,
        debugMode: process.env.NODE_ENV === 'development',
        // Video quality settings
        maxResolution: 'hd'
      }}
      token={token}
      joinWithoutUserInteraction={true}
    >
      <MeetingConsumer>
        {() => (
          <MeetingView
            isHost={isHost}
            onMeetingEnd={onMeetingEnd}
            meetingId={meetingId}
            participantName={participantName}
          />
        )}
      </MeetingConsumer>
    </MeetingProvider>
  )
}