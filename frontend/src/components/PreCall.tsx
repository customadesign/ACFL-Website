'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings,
  Volume2,
  Loader2
} from 'lucide-react'

interface PreCallProps {
  onJoinMeeting: (config: { mic: boolean; camera: boolean }) => void
  onCancel: () => void
  meetingTitle?: string
  coachName?: string
  isJoining?: boolean
}

export default function PreCall({ 
  onJoinMeeting, 
  onCancel, 
  meetingTitle = 'Session',
  coachName,
  isJoining = false
}: PreCallProps) {
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('')
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([])
  const [showSettings, setShowSettings] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  // Get available devices
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const mics = devices.filter(device => device.kind === 'audioinput')
      const cameras = devices.filter(device => device.kind === 'videoinput')
      const speakers = devices.filter(device => device.kind === 'audiooutput')
      
      setAudioDevices(mics)
      setVideoDevices(cameras)
      setSpeakerDevices(speakers)
      
      // Set default devices
      if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId)
      if (cameras.length > 0 && !selectedCamera) setSelectedCamera(cameras[0].deviceId)
      if (speakers.length > 0 && !selectedSpeaker) setSpeakerDevices(speakers)
    } catch (error) {
      console.error('Error getting devices:', error)
    }
  }

  // Initialize media stream
  const initializeMedia = async () => {
    try {
      setLoading(true)
      setPermissionError(null)
      
      // First get permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraEnabled ? {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined
        } : false,
        audio: micEnabled ? {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      })

      // Set video stream
      if (videoRef.current && cameraEnabled) {
        videoRef.current.srcObject = stream
      }

      // Setup audio visualization
      if (micEnabled) {
        setupAudioVisualization(stream)
      }

      // Store stream for cleanup
      micStreamRef.current = stream

      // Get devices after permissions granted
      await getDevices()
      
      setLoading(false)
    } catch (error: any) {
      console.error('Error accessing media devices:', error)
      setLoading(false)
      
      if (error.name === 'NotAllowedError') {
        setPermissionError('Please allow camera and microphone access to join the meeting')
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No camera or microphone found. Please check your devices.')
      } else {
        setPermissionError('Error accessing media devices. Please check your settings.')
      }
    }
  }

  // Setup audio level visualization
  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(stream)
    
    analyser.fftSize = 256
    microphone.connect(analyser)
    
    audioContextRef.current = audioContext
    analyserRef.current = analyser
    
    // Start visualization
    visualizeAudio()
  }

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setAudioLevel(Math.min(100, (average / 255) * 200))
    
    animationFrameRef.current = requestAnimationFrame(visualizeAudio)
  }

  // Toggle microphone
  const toggleMic = () => {
    setMicEnabled(!micEnabled)
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micEnabled
      })
    }
  }

  // Toggle camera
  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled)
    if (micStreamRef.current) {
      micStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !cameraEnabled
      })
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    initializeMedia()
    
    return () => {
      // Stop all tracks
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
      }
      
      // Stop audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Re-initialize when device selection changes
  useEffect(() => {
    if (selectedMic || selectedCamera) {
      // Stop current stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
      }
      // Re-initialize with new devices
      initializeMedia()
    }
  }, [selectedMic, selectedCamera])

  const handleJoinMeeting = () => {
    // Prevent multiple joins
    if (isJoining) {
      return
    }
    
    // Stop local preview streams before joining
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop())
    }
    onJoinMeeting({ mic: micEnabled, camera: cameraEnabled })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Ready to join?</h2>
          <p className="text-gray-600">
            {coachName ? `Session with ${coachName}` : meetingTitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Preview */}
          <div>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={40} />
                </div>
              ) : permissionError ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-white text-center">{permissionError}</p>
                </div>
              ) : cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <VideoOff className="text-white" size={60} />
                </div>
              )}
              
              {/* Audio Level Indicator */}
              {micEnabled && !loading && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-white" />
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Media Controls */}
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={toggleMic}
                className={!micEnabled ? 'bg-red-100 border-red-300' : ''}
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleCamera}
                className={!cameraEnabled ? 'bg-red-100 border-red-300' : ''}
              >
                {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings size={20} />
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          <div>
            {showSettings ? (
              <div className="space-y-4">
                <h3 className="font-semibold mb-3">Device Settings</h3>
                
                {/* Microphone Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Microphone
                  </label>
                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    {audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Camera Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Camera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    {videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speaker Selection (if supported) */}
                {speakerDevices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Speaker
                    </label>
                    <select
                      value={selectedSpeaker}
                      onChange={(e) => setSelectedSpeaker(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      {speakerDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold mb-3">Pre-call Checklist</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded-full ${!loading && !permissionError ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium">Device permissions granted</p>
                      <p className="text-sm text-gray-600">Camera and microphone access allowed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="font-medium">Camera {cameraEnabled ? 'enabled' : 'disabled'}</p>
                      <p className="text-sm text-gray-600">
                        {cameraEnabled ? 'Your video will be visible' : 'Your video is turned off'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="font-medium">Microphone {micEnabled ? 'enabled' : 'disabled'}</p>
                      <p className="text-sm text-gray-600">
                        {micEnabled ? 'Others will hear you' : 'You are muted'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinMeeting}
            disabled={loading || !!permissionError || isJoining}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isJoining ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Joining...
              </>
            ) : (
              'Join Session'
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}