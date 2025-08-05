// VideoSDK Integration Component for ACT Coaching Sessions
// This shows how VideoSDK would be integrated for secure, professional coaching sessions

'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Video, Mic, MicOff, VideoOff, Phone, Settings, Users } from "lucide-react"

interface VideoSDKMeetingProps {
  meetingId: string
  coachName: string
  sessionType: string
  onEndCall?: () => void
}

// Mock VideoSDK integration - in real implementation, this would use @videosdk.live/react-sdk
export default function VideoSDKMeeting({ 
  meetingId, 
  coachName, 
  sessionType, 
  onEndCall 
}: VideoSDKMeetingProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [participantCount, setParticipantCount] = useState(1)

  useEffect(() => {
    // Simulate connection process
    const timer = setTimeout(() => {
      setIsConnected(true)
      setParticipantCount(2) // Coach joins
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleEndCall = () => {
    if (onEndCall) {
      onEndCall()
    }
  }

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse">
          <Video className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Connecting to {coachName}...</h3>
          <p className="text-gray-600 mb-4">Setting up secure video session</p>
          <div className="text-sm text-gray-500">
            Session ID: {meetingId}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-50 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{sessionType}</h2>
          <p className="text-sm text-gray-300">with {coachName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 mr-1" />
            {participantCount}
          </div>
          <div className="text-xs text-green-400">• SECURE CONNECTION</div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Main Video (Coach) */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-blue-600 rounded-lg p-8 text-white text-center">
            <Video className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">{coachName}</h3>
            <p className="text-blue-200">Coach Video Feed</p>
          </div>
        </div>

        {/* Picture-in-Picture (You) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg border-2 border-gray-600 flex items-center justify-center">
          {isVideoOn ? (
            <div className="text-white text-center">
              <Video className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">You</p>
            </div>
          ) : (
            <div className="text-gray-400 text-center">
              <VideoOff className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Video Off</p>
            </div>
          )}
        </div>

        {/* Session Info Overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <div className="text-xs space-y-1">
            <div>📹 HD Quality • 150ms Latency</div>
            <div>🔒 End-to-End Encrypted</div>
            <div>⏱️ Session Recording: ON</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-80 p-4">
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => setIsAudioOn(!isAudioOn)}
            className={`rounded-full p-3 ${
              isAudioOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`rounded-full p-3 ${
              isVideoOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            className="rounded-full p-3 bg-gray-700 hover:bg-gray-600 text-white"
          >
            <Settings className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleEndCall}
            className="rounded-full p-3 bg-red-600 hover:bg-red-700 text-white"
          >
            <Phone className="w-5 h-5" />
          </Button>
        </div>

        <div className="text-center mt-3">
          <div className="text-xs text-gray-400">
            Powered by VideoSDK • Meeting ID: {meetingId}
          </div>
        </div>
      </div>
    </div>
  )
} 