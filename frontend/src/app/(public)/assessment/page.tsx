'use client'

import { useRouter } from 'next/navigation'
import NavbarLandingPage from '@/components/NavbarLandingPage'
import Footer from '@/components/Footer'
import QuickAssessment from '@/components/QuickAssessment'

export default function AssessmentPage() {
  const router = useRouter()

  const handleAssessmentComplete = (data: any) => {
    console.log('Assessment completed:', data)
    // Navigate to search coaches page with the assessment data
    router.push('/clients/search-coaches')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Quick Assessment Section */}
      <div className="flex-1 py-12">
        <div className="w-full max-w-3xl mx-auto px-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
              alt="ACT Coaching For Life Logo"
              className="h-16 w-auto"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Quick Assessment
            </h1>
            <p className="text-gray-600 text-base">
              Help us understand your needs to find the perfect match
            </p>
          </div>

          <QuickAssessment onComplete={handleAssessmentComplete} />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
