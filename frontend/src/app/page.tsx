"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import ShinyText from "@/components/ShinyText"
import Footer from "@/components/Footer"
import Ballpit from "@/components/Ballpit"
import {
  Star,
  ChevronRight,
  ArrowRight
} from "lucide-react"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import AssessmentCompleteModal from "@/components/AssessmentCompleteModal"

export default function HomePage() {
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-white">
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
                <a href="/assessment">
                  <Button
                    size="lg"
                    className="bg-ink-dark dark:bg-brand-teal hover:bg-ink-dark/90 dark:hover:bg-brand-teal/90 text-white px-6 py-3 w-full sm:w-auto"
                  >
                    <ShinyText text="Get Started Today" speed={3} />
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:border-brand-teal dark:hover:border-brand-teal text-gray-700 dark:text-gray-300 px-6 py-3 w-full sm:w-auto"
                >
                  Watch video
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
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

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-ink-dark mb-3">
              How it works
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              Getting started with your coaching journey is simple and takes just a few minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-brand-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-ink-dark mb-2">Take Assessment</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Complete our quick 2-minute assessment to help us understand your goals, preferences, and coaching needs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-ink-dark mb-2">Get Matched</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Within 24 hours, we'll match you with 3-5 coaches who fit your needs. Review their profiles and choose your favorite.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-brand-leaf rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold text-ink-dark mb-2">Start Coaching</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Schedule your first session and begin your journey to positive change with ongoing support from your coach.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-8"
          >
            <a href="/get-started">
              <Button size="lg" className="bg-brand-teal hover:bg-brand-teal/90 text-white px-6 py-3 text-base">
                <ShinyText text="Start Your Journey Today" speed={4} />
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Why Choose ACT Coaching Section */}
      <section className="py-16 bg-gradient-to-br from-teal-50/30 via-cyan-50/20 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
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
            {/* Card 1 - Personalized Matching */}
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

          <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-center max-w-6xl mx-auto">
            {/* Left side - Stats */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm"
              >
                <div className="text-2xl md:text-3xl font-bold text-ink-dark dark:text-white mb-1">
                  3,000+
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Active clients
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm"
              >
                <div className="text-2xl md:text-3xl font-bold text-ink-dark dark:text-white mb-1">
                  500+
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Professional coaches
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm"
              >
                <div className="text-2xl md:text-3xl font-bold text-ink-dark dark:text-white mb-1">
                  4.8/5
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Client rating
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm"
              >
                <div className="text-2xl md:text-3xl font-bold text-ink-dark dark:text-white mb-1">
                  24hr
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
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
              className="relative"
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

      {/* CTA Section with Ballpit Background */}
      <section className="relative py-20 bg-brand-teal overflow-hidden">
        {/* Ballpit Background */}
        <div className="absolute inset-0 z-0">
          <Ballpit 
            count={50}
            colors={[0xFFFFFF, 0x25A7B8, 0xF7931D]}
            gravity={0.3}
            friction={0.998}
            followCursor={true}
            materialParams={{
              metalness: 0.8,
              roughness: 0.2,
              clearcoat: 1,
              clearcoatRoughness: 0.1,
              transmission: 0.1,
              opacity: 0.9
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to start your transformation?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of people who have found their perfect coach match and are living more fulfilling lives.
            </p>
            <div className="flex justify-center">
              <a href="/get-started">
                <Button 
                  size="lg" 
                  className="bg-white text-brand-teal hover:bg-gray-50 px-8 py-4 text-lg shadow-2xl"
                >
                  <span className="text-brand-teal font-semibold">Find Your Coach</span>
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              </div>
          </motion.div>
    </div>
      </section>

     <Footer />
     
     {/* Assessment Complete Modal */}
     <AssessmentCompleteModal 
       isOpen={showAssessmentModal}
       onClose={() => setShowAssessmentModal(false)}
     />
  </div>
  )
}