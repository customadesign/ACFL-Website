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
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-blue-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
          <p className="text-gray-600">
            Hi {participantName}, you're in the waiting room
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Waiting time</p>
          <p className="text-3xl font-mono font-bold text-gray-800">
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
      // Stop any existing stream first
      if (videoRef.current.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream
        existingStream.getTracks().forEach(track => track.stop())
      }
      
      const mediaStream = new MediaStream()
      mediaStream.addTrack(webcamStream.track)
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
    }
    
    return () => {
      // Cleanup on unmount or when dependencies change
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [webcamStream, webcamOn])

  useEffect(() => {
    if (micOn && micStream && micRef.current) {
      // Stop any existing stream first
      if (micRef.current.srcObject) {
        const existingStream = micRef.current.srcObject as MediaStream
        existingStream.getTracks().forEach(track => track.stop())
      }
      
      const mediaStream = new MediaStream()
      mediaStream.addTrack(micStream.track)
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
    }
    
    return () => {
      // Cleanup on unmount or when dependencies change
      if (micRef.current && micRef.current.srcObject) {
        const stream = micRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        micRef.current.srcObject = null
      }
    }
  }, [micStream, micOn])

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden aspect-video transition-all duration-200 ${
      isSpeaking ? 'ring-4 ring-green-500 ring-opacity-75' : ''
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
            <div className={`w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-200 ${
              isSpeaking ? 'ring-2 ring-green-400 ring-opacity-75' : ''
            }`}>
              <VideoOff className="text-gray-400" size={32} />
            </div>
            <p className="text-white font-medium">{displayName}</p>
          </div>
        </div>
      )}
      
      {/* Speaking indicator overlay */}
      {isSpeaking && (
        <div className="absolute top-2 right-2">
          <div className="bg-green-500 rounded-full px-2 py-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">Speaking</span>
          </div>
        </div>
      )}
      
      {/* Name and status overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className={`bg-black/60 rounded px-2 py-1 flex items-center gap-2 transition-all duration-200 ${
          isSpeaking ? 'bg-green-900/60' : ''
        }`}>
          <span className="text-white text-sm">{displayName}</span>
          {isLocal && <span className="text-xs text-blue-400">(You)</span>}
          {isSpeaking && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
        </div>
        <div className="flex gap-1">
          {!micOn && (
            <div className="bg-red-600 rounded p-1">
              <MicOff size={14} className="text-white" />
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
      // First attempt: Use VideoSDK's built-in toggle
      await toggleMic()
      
    } catch (error) {
      console.error('VideoSDK microphone toggle failed:', error)
      
      // Second attempt: Handle track ended error by recreating stream
      if (error instanceof Error && (error.message?.includes('track ended') || error.name === 'InvalidStateError')) {
        try {
          console.log('Attempting to recover from track ended error')
          
          // If we're trying to unmute and the track ended, get new permission
          if (!localMicOn) {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              } 
            })
            
            // Clean up old stream
            if (micStreamRef.current) {
              micStreamRef.current.getTracks().forEach(track => track.stop())
            }
            
            micStreamRef.current = stream
            
            // Try toggle again after getting new stream
            await new Promise(resolve => setTimeout(resolve, 200))
            await toggleMic()
            
            console.log('Successfully recovered microphone')
          } else {
            // If we're trying to mute, just force disable the tracks
            if (micStreamRef.current) {
              micStreamRef.current.getTracks().forEach(track => {
                track.enabled = false
                track.stop()
              })
            }
          }
          
        } catch (recoveryError) {
          console.error('Microphone recovery failed:', recoveryError)
          // Show user-friendly error message
          alert('Microphone access lost. Please refresh the page to continue.')
        }
      }
    } finally {
      setTimeout(() => setMicToggling(false), 500)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-3 p-4 bg-white border-t shadow-lg backdrop-blur-sm">
        {/* Microphone Control */}
        <Button
          variant={localMicOn ? "outline" : "destructive"}
          size="lg"
          onClick={handleMicToggle}
          disabled={micToggling}
          className="rounded-full shadow-md"
          title={localMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micToggling ? (
            <Loader2 size={20} className="animate-spin" />
          ) : localMicOn ? (
            <Mic size={20} />
          ) : (
            <MicOff size={20} />
          )}
        </Button>

        {/* Camera Control */}
        <Button
          variant={localWebcamOn ? "outline" : "destructive"}
          size="lg"
          onClick={() => toggleWebcam()}
          className="rounded-full shadow-md"
          title={localWebcamOn ? "Turn off camera" : "Turn on camera"}
        >
          {localWebcamOn ? <Video size={20} /> : <VideoOff size={20} />}
        </Button>

        {/* Screen Share Control */}
        <Button
          variant={isPresenting ? "default" : "outline"}
          size="lg"
          onClick={handleScreenShare}
          disabled={isScreenSharing}
          className={`rounded-full shadow-md ${isPresenting ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
          title={isPresenting ? "Stop sharing screen" : "Share screen"}
        >
          {isScreenSharing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Share2 size={20} />
          )}
        </Button>

        {/* Chat Control */}
        {onChatToggle && (
          <Button
            variant="outline"
            size="lg"
            onClick={onChatToggle}
            className="rounded-full shadow-md"
            title="Toggle chat"
          >
            <MessageSquare size={20} />
          </Button>
        )}

        {/* End/Leave Meeting */}
        <Button
          variant="destructive"
          size="lg"
          onClick={handleEndMeeting}
          className="rounded-full px-6 shadow-md"
          title={isHost ? "End meeting for all" : "Leave meeting"}
        >
          <PhoneOff size={20} className="mr-2" />
          {isHost ? 'End' : 'Leave'}
        </Button>
      </div>

      {/* Status Indicators */}
      <div className="bg-gray-50/95 px-4 py-2 border-t backdrop-blur-sm flex items-center justify-center gap-4 text-xs text-gray-600">
        {localMicOn && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Mic on</span>
          </div>
        )}
        {localWebcamOn && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Camera on</span>
          </div>
        )}
        {isPresenting && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>You're sharing your screen</span>
          </div>
        )}
        {presenterId && !isPresenting && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Someone is sharing screen</span>
          </div>
        )}
      </div>

      {/* End Meeting Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">End meeting for all?</h3>
            <p className="text-gray-600 mb-4">
              This will end the meeting for all participants. Are you sure?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEndConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleLeaveMeeting}
                className="flex-1"
              >
                Leave Only
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEndMeeting}
                className="flex-1"
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
      // Stop any existing stream first
      if (screenRef.current.srcObject) {
        const existingStream = screenRef.current.srcObject as MediaStream
        existingStream.getTracks().forEach(track => track.stop())
      }
      
      const mediaStream = new MediaStream()
      mediaStream.addTrack(screenShareStream.track)
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
    }
    
    return () => {
      // Cleanup on unmount or when dependencies change
      if (screenRef.current && screenRef.current.srcObject) {
        const stream = screenRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
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
      <div className="absolute top-4 left-4">
        <div className="bg-blue-600 rounded px-3 py-1 flex items-center gap-2">
          <Share2 size={14} className="text-white" />
          <span className="text-white text-sm font-medium">{displayName} is sharing</span>
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

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">Video Session</h2>
          <ConnectionStatus connectionStatus={connectionState} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} />
            <span>{participantIds.length} participants</span>
          </div>
          {presenterId && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
              <Share2 size={12} />
              Screen Sharing
            </span>
          )}
          {isHost && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
              HOST
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area - adjusted to account for fixed controls */}
      <div className="flex-1 flex pb-24">
        {/* Screen Share or Main Video Area */}
        <div className="flex-1 p-4">
          {presenterId ? (
            <ScreenShareView participantId={presenterId} />
          ) : (
            <div className={`grid gap-4 h-full ${
              participantIds.length === 1 ? 'grid-cols-1' : 
              participantIds.length === 2 ? 'grid-cols-2' : 
              participantIds.length <= 4 ? 'grid-cols-2' : 
              'grid-cols-3'
            }`}>
              {participantIds.map((participantId) => (
                <ParticipantView key={participantId} participantId={participantId} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar with participant videos when screen sharing */}
        {presenterId && (
          <div className="w-72 bg-gray-800 p-4 border-l border-gray-700">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Users size={14} />
              Participants ({participantIds.length})
            </h3>
            <div className="space-y-3">
              {participantIds.map((participantId) => (
                <div key={participantId} className="h-32">
                  <ParticipantView participantId={participantId} />
                </div>
              ))}
            </div>
          </div>
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