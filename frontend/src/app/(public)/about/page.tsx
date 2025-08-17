"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Logo from "@/components/Logo"
import GradientText from "@/components/GradientText"
import CountUp from "@/components/CountUp"
import SpotlightCard from "@/components/SpotlightCard"
import ShinyText from "@/components/ShinyText"
import Navigation from "@/components/Navigation"
import { 
  Heart, 
  Users, 
  Target,
  Shield,
  Award,
  Lightbulb,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  Star,
  Brain,
  Compass,
  Zap
} from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Link href="/" className="inline-flex items-center text-brand-teal hover:text-brand-teal/80 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-ink-dark mb-6">
              About <GradientText className="inline-block">ACT Coaching</GradientText> for Life
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              We're transforming lives through evidence-based Acceptance and Commitment Therapy coaching, 
              helping people create meaningful change and live authentically.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At ACT Coaching for Life, we believe everyone deserves to live a life aligned with their values. 
                Our mission is to make professional, evidence-based coaching accessible to anyone seeking 
                meaningful change.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Through our innovative matching platform, we connect you with qualified ACT coaches who 
                understand your unique challenges and can guide you toward psychological flexibility, 
                resilience, and authentic living.
              </p>
              <div className="flex items-center space-x-4">
                <Heart className="w-8 h-8 text-brand-coral" />
                <span className="text-lg font-semibold text-ink-dark">Compassionate, evidence-based care</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard className="p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-teal mb-2">
                      <CountUp to={3000} duration={2.5} separator="," />+
                    </div>
                    <div className="text-gray-600">Lives Changed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-orange mb-2">
                      <CountUp to={500} duration={2} />+
                    </div>
                    <div className="text-gray-600">Professional Coaches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-leaf mb-2">
                      <CountUp to={4.8} duration={2.2} from={0} />/<CountUp to={5} duration={1.8} />
                    </div>
                    <div className="text-gray-600">Client Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-coral mb-2">
                      <CountUp to={24} duration={1.5} />hr
                    </div>
                    <div className="text-gray-600">Match Guarantee</div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What is ACT Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              What is <GradientText className="inline-block">ACT Coaching?</GradientText>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Acceptance and Commitment Therapy (ACT) is a proven therapeutic approach that helps you 
              develop psychological flexibility and live according to your values.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SpotlightCard className="h-full p-6 text-center">
                <Brain className="w-12 h-12 text-brand-teal mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-ink-dark mb-3">Psychological Flexibility</h3>
                <p className="text-gray-600">
                  Learn to adapt to challenges, stay present, and respond to situations with awareness rather than react automatically.
                </p>
              </SpotlightCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <SpotlightCard className="h-full p-6 text-center">
                <Compass className="w-12 h-12 text-brand-orange mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-ink-dark mb-3">Values-Based Living</h3>
                <p className="text-gray-600">
                  Identify what truly matters to you and make choices that align with your deepest values and aspirations.
                </p>
              </SpotlightCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard className="h-full p-6 text-center">
                <Zap className="w-12 h-12 text-brand-leaf mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-ink-dark mb-3">Mindful Action</h3>
                <p className="text-gray-600">
                  Take committed action toward your goals while staying present and engaged with the process.
                </p>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Why Choose ACT Coaching for Life?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another coaching platform. We're specialized in ACT approaches with proven results.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Shield className="w-12 h-12 text-brand-teal mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Qualified Professionals</h3>
              <p className="text-gray-600 text-sm">
                Our coaches are carefully vetted professionals with specialized ACT training and experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <Target className="w-12 h-12 text-brand-orange mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Personalized Matching</h3>
              <p className="text-gray-600 text-sm">
                Our algorithm matches you with coaches based on your specific needs and preferences.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <Award className="w-12 h-12 text-brand-leaf mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Evidence-Based</h3>
              <p className="text-gray-600 text-sm">
                ACT is backed by over 300 research studies showing its effectiveness.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <Lightbulb className="w-12 h-12 text-brand-coral mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Flexible & Accessible</h3>
              <p className="text-gray-600 text-sm">
                Online sessions, flexible scheduling, and 24/7 messaging support.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
                Our Approach
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-brand-teal mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-ink-dark mb-2">Comprehensive Assessment</h4>
                    <p className="text-gray-600">We start by understanding your unique situation, challenges, and goals.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-brand-orange mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-ink-dark mb-2">Perfect Coach Match</h4>
                    <p className="text-gray-600">Our matching system finds the ideal coach based on your preferences and needs.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-brand-leaf mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-ink-dark mb-2">Ongoing Support</h4>
                    <p className="text-gray-600">Regular sessions plus 24/7 messaging for continuous guidance and support.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-brand-coral mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-ink-dark mb-2">Measurable Progress</h4>
                    <p className="text-gray-600">Track your growth with our progress monitoring tools and regular check-ins.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard className="p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-ink-dark mb-4">Our Promise</h3>
                    <p className="text-gray-600 leading-relaxed">
                      We're committed to helping you create lasting, meaningful change in your life. 
                      If you're not satisfied with your coach match within the first two sessions, 
                      we'll find you a new coach at no additional cost.
                    </p>
                  </div>
                  <div className="text-center pt-4">
                    <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 italic">
                      "The best investment I've made in myself. My coach helped me transform my life in ways I never thought possible."
                    </p>
                    <p className="text-sm text-gray-700 font-semibold mt-2">- Sarah M., Client</p>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Take the first step toward meaningful change. Our quick assessment will help us find 
              the perfect coach for your unique needs.
            </p>
            <div className="flex justify-center">
              <a href="/#quick-assessment">
                <Button 
                  size="lg" 
                  className="bg-white text-brand-teal hover:bg-gray-50 px-8 py-4 text-lg font-semibold"
                >
                  Start Your Assessment
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}