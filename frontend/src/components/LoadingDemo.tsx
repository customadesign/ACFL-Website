import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loading,
  LoadingSpinner,
  LoadingPulse,
  LoadingBounce,
  LoadingBreathe,
  LoadingOrbit,
  LoadingWave,
  LoadingOverlay,
  LoadingButton
} from '@/components/ui/loading'

export default function LoadingDemo() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)

  const handleButtonClick = () => {
    setButtonLoading(true)
    setTimeout(() => setButtonLoading(false), 3000)
  }

  const handleOverlayToggle = () => {
    setShowOverlay(true)
    setTimeout(() => setShowOverlay(false), 3000)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ACT Coaching Loading Components</h1>
        <p className="text-muted-foreground">
          Various loading animations using the ACT coaching logo
        </p>
      </div>

      {/* Animation Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spin Animation</CardTitle>
            <CardDescription>Classic spinning loader</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingSpinner size="lg" text="Spinning..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pulse Animation</CardTitle>
            <CardDescription>Gentle pulsing effect</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingPulse size="lg" text="Pulsing..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bounce Animation</CardTitle>
            <CardDescription>Playful bouncing motion</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingBounce size="lg" text="Bouncing..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breathe Animation</CardTitle>
            <CardDescription>Calm breathing effect</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingBreathe size="lg" text="Breathing..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orbit Animation</CardTitle>
            <CardDescription>Smooth orbital rotation</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingOrbit size="lg" text="Orbiting..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wave Animation</CardTitle>
            <CardDescription>Gentle wave motion</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingWave size="lg" text="Waving..." />
          </CardContent>
        </Card>
      </div>

      {/* Size Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Size Variants</CardTitle>
          <CardDescription>Different sizes for various use cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around py-8">
            <div className="text-center space-y-2">
              <LoadingSpinner size="sm" showText={false} />
              <p className="text-xs text-muted-foreground">Small</p>
            </div>
            <div className="text-center space-y-2">
              <LoadingSpinner size="default" showText={false} />
              <p className="text-xs text-muted-foreground">Default</p>
            </div>
            <div className="text-center space-y-2">
              <LoadingSpinner size="lg" showText={false} />
              <p className="text-xs text-muted-foreground">Large</p>
            </div>
            <div className="text-center space-y-2">
              <LoadingSpinner size="xl" showText={false} />
              <p className="text-xs text-muted-foreground">Extra Large</p>
            </div>
            <div className="text-center space-y-2">
              <LoadingSpinner size="2xl" showText={false} />
              <p className="text-xs text-muted-foreground">2X Large</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practical Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Button Loading State</CardTitle>
            <CardDescription>Loading indicator in buttons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleButtonClick}
              disabled={buttonLoading}
              className="w-full"
            >
              {buttonLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingButton variant="spin" />
                  Processing...
                </div>
              ) : (
                'Click to Load'
              )}
            </Button>

            <Button variant="outline" disabled className="w-full">
              <LoadingButton variant="pulse" />
              <span className="ml-2">Saving Changes...</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full Screen Overlay</CardTitle>
            <CardDescription>Loading overlay for page transitions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleOverlayToggle} className="w-full">
              Show Loading Overlay
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Custom Text Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Loading Messages</CardTitle>
          <CardDescription>Contextual loading text for better UX</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
            <div className="text-center">
              <LoadingSpinner text="Connecting to coach..." />
            </div>
            <div className="text-center">
              <LoadingPulse text="Saving your progress..." />
            </div>
            <div className="text-center">
              <LoadingBreathe text="Processing payment..." />
            </div>
            <div className="text-center">
              <LoadingWave text="Scheduling session..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {showOverlay && (
        <LoadingOverlay
          variant="breathe"
          size="xl"
          text="Loading your dashboard..."
        />
      )}
    </div>
  )
}