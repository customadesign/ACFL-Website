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

// Participant Video Component
function ParticipantView({ participantId }: { participantId: string }) {
  const micRef = useRef<HTMLAudioElement>(null)
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } = useParticipant(participantId)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (webcamOn && webcamStream && videoRef.current) {
      const mediaStream = new MediaStream()
      mediaStream.addTrack(webcamStream.track)
      videoRef.current.srcObject = mediaStream
      videoRef.current.play().catch(error => console.error("video play error", error))
    }
  }, [webcamStream, webcamOn])

  useEffect(() => {
    if (micOn && micStream && micRef.current) {
      const mediaStream = new MediaStream()
      mediaStream.addTrack(micStream.track)
      micRef.current.srcObject = mediaStream
      micRef.current.play().catch(error => console.error("audio play error", error))
    }
  }, [micStream, micOn])

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
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
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <VideoOff className="text-gray-400" size={32} />
            </div>
            <p className="text-white font-medium">{displayName}</p>
          </div>
        </div>
      )}
      
      {/* Name and status overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="bg-black/60 rounded px-2 py-1 flex items-center gap-2">
          <span className="text-white text-sm">{displayName}</span>
          {isLocal && <span className="text-xs text-blue-400">(You)</span>}
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
function MeetingControls({ isHost }: { isHost: boolean }) {
  const {
    leave,
    end,
    toggleMic,
    toggleWebcam,
    toggleScreenShare,
    localMicOn,
    localWebcamOn,
    presenterId
  } = useMeeting()

  const [showEndConfirm, setShowEndConfirm] = useState(false)

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

  return (
    <>
      <div className="flex items-center justify-center gap-3 p-4 bg-gray-100 border-t">
        <Button
          variant={localMicOn ? "outline" : "destructive"}
          size="lg"
          onClick={() => toggleMic()}
          className="rounded-full"
        >
          {localMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </Button>

        <Button
          variant={localWebcamOn ? "outline" : "destructive"}
          size="lg"
          onClick={() => toggleWebcam()}
          className="rounded-full"
        >
          {localWebcamOn ? <Video size={20} /> : <VideoOff size={20} />}
        </Button>

        <Button
          variant={presenterId ? "default" : "outline"}
          size="lg"
          onClick={() => toggleScreenShare()}
          className="rounded-full"
        >
          <Share2 size={20} />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={handleEndMeeting}
          className="rounded-full px-6"
        >
          <PhoneOff size={20} className="mr-2" />
          {isHost ? 'End' : 'Leave'}
        </Button>
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

// Main Meeting View Component
function MeetingView({ 
  isHost, 
  onMeetingEnd,
  meetingId
}: { 
  isHost: boolean
  onMeetingEnd: () => void
  meetingId: string
}) {
  const [hasJoined, setHasJoined] = useState(false)
  const [hasLeft, setHasLeft] = useState(false)
  const [connectionState, setConnectionState] = useState('CONNECTING')

  const {
    participants,
    localParticipant
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
    }
  })

  const participantIds = [...participants.keys()]

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
          {isHost && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              HOST
            </span>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
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
      </div>

      {/* Controls */}
      <MeetingControls isHost={isHost} />
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
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(!isHost)

  return (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: initialMicOn,
        webcamEnabled: initialWebcamOn,
        name: participantName,
        mode: 'CONFERENCE',
        multiStream: true,
        debugMode: process.env.NODE_ENV === 'development'
      }}
      token={token}
      joinWithoutUserInteraction={true}
    >
      <MeetingConsumer>
        {() => (
          <>
            {isInWaitingRoom && !isHost ? (
              <WaitingLobby
                participantName={participantName}
                onLeave={onMeetingEnd}
              />
            ) : (
              <MeetingView
                isHost={isHost}
                onMeetingEnd={onMeetingEnd}
                meetingId={meetingId}
              />
            )}
          </>
        )}
      </MeetingConsumer>
    </MeetingProvider>
  )
}