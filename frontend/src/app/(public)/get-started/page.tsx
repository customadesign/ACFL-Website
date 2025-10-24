'use client'

import { motion } from 'framer-motion'
import NavbarLandingPage from '@/components/NavbarLandingPage'
import Footer from '@/components/Footer'
import { Users, Calendar, MessageSquare, ArrowRight, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function GetStartedPage() {
  const router = useRouter()

  const handleStartAssessment = () => {
    // Navigate to the dedicated assessment page
    router.push('/assessment')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold text-ink-dark dark:text-white mb-6 leading-tight">
                Find the Perfect Coach for Meaningful Change
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Professional ACT coaching that helps you overcome challenges, build resilience, and create meaningful life changes. Get matched with qualified coaches in 24 hours.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={handleStartAssessment}
                  className="inline-flex items-center justify-center gap-2 bg-ink-dark dark:bg-brand-teal hover:bg-ink-dark/90 dark:hover:bg-brand-teal/90 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Get Started Today
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:border-brand-teal dark:hover:border-brand-teal text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition-all duration-200">
                  Watch video
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/coaching-hero.png"
                  alt="Professional ACT coaching session"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose ACT Coaching Section */}
      <section className="py-16 bg-gradient-to-br from-teal-50/30 via-cyan-50/20 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-ink-dark dark:text-white mb-4">
              Why choose ACT coaching
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Proven strategies for personal and professional growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 - Evidence-based approach */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-64">
                <img
                  src="/images/why-coaching-1.png"
                  alt="Evidence-based ACT coaching approach"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">
                    Personalized Matching
                  </h3>
                  <p className="text-sm text-gray-200">
                    Our advanced algorithm considers your goals, personality, and preferences to match you with the perfect coach.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2 - Flexible Scheduling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-64">
                <img
                  src="/images/why-coaching-2.png"
                  alt="Flexible coaching session scheduling"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">
                    Flexible Scheduling
                  </h3>
                  <p className="text-sm text-gray-200">
                    Book sessions that fit your schedule. Morning, evening, or weekend - we have coaches available when you need them.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 3 - Qualified Professionals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-64">
                <img
                  src="/images/why-coaching-3.png"
                  alt="Qualified professional ACT coaches"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">
                    Qualified Professionals
                  </h3>
                  <p className="text-sm text-gray-200">
                    Our coaches are carefully vetted, trained in ACT methodology, and committed to helping you achieve your goals.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 4 - Ongoing Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-64">
                <img
                  src="/images/why-coaching-4.png"
                  alt="Ongoing support between coaching sessions"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">
                    Ongoing Support
                  </h3>
                  <p className="text-sm text-gray-200">
                    Get continuous support between sessions with messaging, resources, and check-ins from your coach.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 5 - Proven Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-64">
                <img
                  src="/images/why-coaching-5.png"
                  alt="Proven results from ACT coaching"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">
                    Proven Results
                  </h3>
                  <p className="text-sm text-gray-200">
                    Our clients report 85% improvement in their mental well-being within 3 months of starting coaching.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 6 - Multiple Formats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-64">
                <img
                  src="/images/why-coaching-6.png"
                  alt="Multiple coaching formats available"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">
                    Multiple Formats
                  </h3>
                  <p className="text-sm text-gray-200">
                    Choose from video calls, phone sessions, or text-based coaching to match your communication preference.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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

      {/* Coaching by the Numbers Section */}
      <section className="py-16 bg-gradient-to-br from-cyan-50/30 via-blue-50/20 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-ink-dark dark:text-white mb-4">
              Our Coaching by the Numbers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Transformative results across personal and professional domains
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[auto_1fr] gap-12 items-center">
            {/* Left side - Stats */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md"
              >
                <div className="text-4xl md:text-5xl font-bold text-ink-dark dark:text-white mb-2">
                  3,000+
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Active clients
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md"
              >
                <div className="text-4xl md:text-5xl font-bold text-ink-dark dark:text-white mb-2">
                  500+
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Professional coaches
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md"
              >
                <div className="text-4xl md:text-5xl font-bold text-ink-dark dark:text-white mb-2">
                  4.8/5
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Client rating
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md"
              >
                <div className="text-4xl md:text-5xl font-bold text-ink-dark dark:text-white mb-2">
                  24hr
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Match guarantee
                </p>
              </motion.div>
            </div>

            {/* Right side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative max-w-md mx-auto lg:mx-0"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/coaching-numbers.png"
                  alt="ACT Coaching by the numbers"
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Client Stories Section */}
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
              Client stories
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real people, real transformations through ACT coaching
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 - Sarah Martinez */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                My coach helped me work through anxiety that was holding me back for years. The ACT approach really clicked with me, and I finally feel like I'm living authentically. Highly recommend!
              </p>

              {/* Reviewer Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-ink-dark dark:text-white">Sarah Martinez</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Local Guide • 47 reviews
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Google • 3 months ago
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 - Michael Rodriguez */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                The matching process was incredible - they found me a coach who understood my specific challenges. Three months later, I feel more confident and focused than ever. Worth every penny.
              </p>

              {/* Reviewer Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">MR</span>
                </div>
                <div>
                  <div className="font-semibold text-ink-dark dark:text-white">Michael Rodriguez</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Local Guide • 29 reviews
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Google • 2 months ago
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 - Jennifer Lee */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                I was skeptical about online coaching, but the platform made it so easy to connect with my coach. The flexibility to message between sessions has been a game-changer. Amazing service!
              </p>

              {/* Reviewer Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">JL</span>
                </div>
                <div>
                  <div className="font-semibold text-ink-dark dark:text-white">Jennifer Lee</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Local Guide • 63 reviews
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Google • 1 month ago
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
