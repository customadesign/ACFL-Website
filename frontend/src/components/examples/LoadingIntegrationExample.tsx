import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { LoadingOverlay, LoadingSpinner } from '@/components/ui/loading'
import { useLoading, useAsyncLoading } from '@/hooks/useLoading'

// Example: Enhanced Booking Modal with Loading States
export function BookingModalExample() {
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [selectedTime, setSelectedTime] = React.useState<string>('')

  // Simulate booking API call
  const handleBooking = async () => {
    startLoading()
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Handle success
      console.log('Booking successful!')
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      stopLoading()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Book Your Session</CardTitle>
        <CardDescription>
          Select a date and time for your coaching session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date/Time Selection (simplified for example) */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedDate('2024-01-15')}
            className={selectedDate ? 'border-primary' : ''}
          >
            Jan 15
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedTime('10:00 AM')}
            className={selectedTime ? 'border-primary' : ''}
          >
            10:00 AM
          </Button>
        </div>

        {/* Loading Button */}
        <LoadingButton
          loading={isLoading}
          loadingText="Booking your session..."
          loadingVariant="breathe"
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime}
          className="w-full"
        >
          Book Free Consultation
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

// Example: Payment Processing with Different Loading States
export function PaymentProcessingExample() {
  const { execute: processPayment, isLoading, error } = useAsyncLoading(
    async (amount: number) => {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      if (Math.random() > 0.7) throw new Error('Payment failed')
      return { success: true, transactionId: 'tx_123' }
    }
  )

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Processing</CardTitle>
        <CardDescription>
          Secure payment with loading feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold">$99.00</p>
          <p className="text-sm text-muted-foreground">One-time session fee</p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        <LoadingButton
          loading={isLoading}
          loadingText="Processing payment..."
          loadingVariant="pulse"
          onClick={() => processPayment(99)}
          className="w-full"
        >
          Pay Now
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

// Example: Dashboard Loading State
export function DashboardLoadingExample() {
  const [isInitialLoading, setIsInitialLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate dashboard data loading
    setTimeout(() => setIsInitialLoading(false), 2500)
  }, [])

  if (isInitialLoading) {
    return (
      <LoadingOverlay
        variant="orbit"
        size="xl"
        text="Loading your dashboard..."
      />
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You have 2 sessions this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p>80% goal completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p>3 new messages</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Example: Form Submission with Contextual Loading
export function ContactFormExample() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: ''
  })
  const { execute: submitForm, isLoading, error } = useAsyncLoading(
    async (data: typeof formData) => {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log('Form submitted:', data)
      return { success: true }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitForm(formData)
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>
          Send us a message and we'll get back to you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border rounded-md"
              disabled={isLoading}
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-3 border rounded-md"
              disabled={isLoading}
            />
          </div>

          <div>
            <textarea
              placeholder="Your message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full p-3 border rounded-md h-24"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          <LoadingButton
            type="submit"
            loading={isLoading}
            loadingText="Sending message..."
            loadingVariant="wave"
            className="w-full"
          >
            Send Message
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  )
}

// Example: List Loading with Skeleton States
export function DataListExample() {
  const [data, setData] = React.useState<any[]>([])
  const { isLoading, startLoading, stopLoading } = useLoading(true)

  React.useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setData([
        { id: 1, name: 'Session 1', date: '2024-01-15' },
        { id: 2, name: 'Session 2', date: '2024-01-16' },
        { id: 3, name: 'Session 3', date: '2024-01-17' },
      ])
      stopLoading()
    }, 2000)
  }, [stopLoading])

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Upcoming Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner
                variant="spin"
                text="Loading your sessions..."
                size="lg"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.id} className="p-3 border rounded-md">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main demo component
export default function LoadingIntegrationExamples() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Loading Integration Examples</h1>
        <p className="text-muted-foreground">
          Real-world examples of ACT coaching loading states
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BookingModalExample />
        <PaymentProcessingExample />
        <ContactFormExample />
        <DataListExample />
      </div>
    </div>
  )
}