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
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Quick Assessment Section */}
      <section className="py-16 flex-1 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-ink-dark dark:text-white mb-4">
              Quick Assessment
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Help us understand your needs to find the perfect match
            </p>
          </div>

          <QuickAssessment onComplete={handleAssessmentComplete} />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
