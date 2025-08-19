'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Video, Mic, TestTube } from 'lucide-react'
import dynamic from 'next/dynamic'

const PreCall = dynamic(
  () => import('@/components/PreCall'),
  { ssr: false }
)

export default function TestPreCallPage() {
  const [showPreCall, setShowPreCall] = useState(false)
  const [lastConfig, setLastConfig] = useState<{ mic: boolean; camera: boolean } | null>(null)

  const handleJoinMeeting = (config: { mic: boolean; camera: boolean }) => {
    setLastConfig(config)
    setShowPreCall(false)
    console.log('Meeting joined with config:', config)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PreCall Component Test</h1>
          <p className="text-lg text-gray-600">Test the pre-call functionality without needing an actual appointment</p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Test PreCall Modal</h2>
              <p className="text-gray-600 mb-4">
                Click the button below to open the PreCall modal and test your camera and microphone settings.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setShowPreCall(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Video className="mr-2 h-5 w-5" />
                Open PreCall Test
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  // Test with sample meeting data
                  setShowPreCall(true)
                }}
                size="lg"
              >
                <TestTube className="mr-2 h-5 w-5" />
                Test with Sample Data
              </Button>
            </div>

            {lastConfig && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Last Test Result:</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-blue-700">
                    <span className="font-medium">Microphone:</span> {lastConfig.mic ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-blue-700">
                    <span className="font-medium">Camera:</span> {lastConfig.camera ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-blue-600 text-xs mt-2">
                    In a real scenario, the meeting would open with these settings
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">What to Test:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Camera preview and permissions
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Microphone audio level visualization
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Toggle camera and microphone on/off
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Device selection (if multiple devices available)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Settings panel for device configuration
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Error handling for permission denial
                </li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Quick Device Check:</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                      stream.getTracks().forEach(track => track.stop())
                      alert('✅ Camera is accessible!')
                    } catch (error) {
                      alert('❌ Camera access denied or not available')
                    }
                  }}
                  className="p-3 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center mb-1">
                    <Video className="mr-2 h-4 w-4" />
                    <span className="font-medium">Test Camera Access</span>
                  </div>
                  <p className="text-xs text-gray-500">Quick check without opening modal</p>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                      stream.getTracks().forEach(track => track.stop())
                      alert('✅ Microphone is accessible!')
                    } catch (error) {
                      alert('❌ Microphone access denied or not available')
                    }
                  }}
                  className="p-3 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center mb-1">
                    <Mic className="mr-2 h-4 w-4" />
                    <span className="font-medium">Test Microphone Access</span>
                  </div>
                  <p className="text-xs text-gray-500">Quick check without opening modal</p>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* PreCall Modal */}
        {showPreCall && (
          <PreCall
            onJoinMeeting={handleJoinMeeting}
            onCancel={() => {
              setShowPreCall(false)
              console.log('PreCall cancelled')
            }}
            meetingTitle="Test Session"
            coachName="Test Coach"
          />
        )}
      </div>
    </div>
  )
}