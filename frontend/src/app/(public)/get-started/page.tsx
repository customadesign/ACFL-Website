'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import NavbarLandingPage from '@/components/NavbarLandingPage'
import Footer from '@/components/Footer'
import QuickAssessment from '@/components/QuickAssessment'
import { CheckCircle, Users, Calendar, MessageSquare, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function GetStartedPage() {
  const router = useRouter()
  const [assessmentStarted, setAssessmentStarted] = useState(false)

  const handleAssessmentComplete = (data: any) => {
    console.log('Assessment completed:', data)
    // Navigate to search coaches page with the assessment data
    router.push('/clients/search-coaches')
  }

  const handleStartAssessment = () => {
    setAssessmentStarted(true)
    // Scroll to assessment
    setTimeout(() => {
      const assessmentElement = document.getElementById('assessment-section')
      if (assessmentElement) {
        assessmentElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-dark dark:text-white mb-6 tracking-tight">
              Find Your Perfect <span className="text-brand-teal">ACT Coach</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Take our quick assessment to get matched with certified ACT coaches who align with your goals, preferences, and needs.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-12">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-leaf" />
                <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">Certified ACT Coaches</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-leaf" />
                <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">Personalized Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-leaf" />
                <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">100% Confidential</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      {!assessmentStarted && (
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-ink-dark dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Three simple steps to connect with your ideal coach
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-brand-teal" />
                </div>
                <div className="mb-4">
                  <span className="inline-block w-8 h-8 bg-brand-teal text-white rounded-full font-bold flex items-center justify-center mb-3">
                    1
                  </span>
                  <h3 className="text-xl font-semibold text-ink-dark dark:text-white mb-2">
                    Answer Questions
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Share your preferences, goals, and what you're looking for in a coach. Takes less than 2 minutes.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-brand-orange/10 dark:bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-brand-orange" />
                </div>
                <div className="mb-4">
                  <span className="inline-block w-8 h-8 bg-brand-orange text-white rounded-full font-bold flex items-center justify-center mb-3">
                    2
                  </span>
                  <h3 className="text-xl font-semibold text-ink-dark dark:text-white mb-2">
                    Get Matched
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Our algorithm matches you with certified coaches who align with your specific needs and preferences.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-brand-leaf/10 dark:bg-brand-leaf/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-brand-leaf" />
                </div>
                <div className="mb-4">
                  <span className="inline-block w-8 h-8 bg-brand-leaf text-white rounded-full font-bold flex items-center justify-center mb-3">
                    3
                  </span>
                  <h3 className="text-xl font-semibold text-ink-dark dark:text-white mb-2">
                    Book Your Session
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Review your matches, choose your coach, and schedule your first session at a time that works for you.
                </p>
              </motion.div>
            </div>

            {/* CTA to start assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <button
                onClick={handleStartAssessment}
                className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Start Your Assessment
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No credit card required • 100% free
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Quick Assessment Section */}
      <section id="assessment-section" className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!assessmentStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-ink-dark dark:text-white mb-4">
                Quick Assessment
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Help us understand your needs to find the perfect match
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <QuickAssessment onComplete={handleAssessmentComplete} />
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-ink-dark dark:text-white mb-8">
              Why Choose ACT Coaching For Life?
            </h3>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-teal mb-2">100+</div>
                <p className="text-gray-600 dark:text-gray-300">Certified Coaches</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-orange mb-2">95%</div>
                <p className="text-gray-600 dark:text-gray-300">Client Satisfaction</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-leaf mb-2">24/7</div>
                <p className="text-gray-600 dark:text-gray-300">Support Available</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
