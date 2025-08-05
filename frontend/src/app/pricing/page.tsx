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
  CheckCircle, 
  Star,
  Clock,
  Calendar,
  Users,
  Shield,
  MessageSquare,
  ChevronRight,
  ArrowLeft
} from "lucide-react"

export default function PricingPage() {
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
            
            <h1 className="text-4xl lg:text-6xl font-bold text-ink-dark mb-6 leading-tight">
              Choose Your <GradientText className="inline-block leading-normal">Coaching Plan</GradientText>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Professional ACT coaching tailored to your needs. All plans include qualified coaches, 
              flexible scheduling, and unlimited messaging support between sessions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 pt-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SpotlightCard className="h-full p-8 relative">
                <div className="text-center">
                  <div className="mb-6">
                    <Calendar className="w-12 h-12 text-brand-teal mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-ink-dark mb-2">Monthly Sessions</h3>
                    <p className="text-gray-600">Perfect for ongoing support</p>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-5xl font-bold text-brand-teal">
                        $<CountUp to={99} duration={2} />
                      </span>
                      <span className="text-2xl font-bold text-brand-teal">.95</span>
                      <span className="text-gray-500 ml-2">/month</span>
                    </div>
                    <p className="text-sm text-gray-500">2 coaching sessions per month</p>
                  </div>

                  <div className="space-y-4 mb-8 text-left">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">2 x 50-minute sessions monthly</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                                              <span className="text-gray-700">Qualified ACT coach matching</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Unlimited messaging support</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Flexible scheduling</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Progress tracking tools</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">24/7 platform access</span>
                    </div>
                  </div>

                  <a href="/#quick-assessment">
                    <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-3 text-lg">
                      <ShinyText text="Start Monthly Plan" speed={4} />
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </a>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Weekly Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard className="h-full p-8 relative border-2 border-brand-teal">
                {/* Popular Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-2xl animate-pulse transform rotate-12" 
                       style={{ 
                         boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2)' 
                       }}>
                    <Star className="w-3 h-3 mr-1 text-yellow-900" />
                    Most Popular
                  </div>
                </div>

                <div className="text-center">
                  <div className="mb-6 mt-4">
                    <Users className="w-12 h-12 text-brand-orange mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-ink-dark mb-2">Weekly Sessions</h3>
                    <p className="text-gray-600">Intensive transformation support</p>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-5xl font-bold text-brand-orange">
                        $<CountUp to={149} duration={2.2} />
                      </span>
                      <span className="text-2xl font-bold text-brand-orange">.95</span>
                      <span className="text-gray-500 ml-2">/month</span>
                    </div>
                    <p className="text-sm text-gray-500">4 coaching sessions per month</p>
                  </div>

                  <div className="space-y-4 mb-8 text-left">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">4 x 50-minute sessions monthly</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Priority coach matching</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Unlimited messaging support</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Flexible scheduling</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Advanced progress tracking</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                      <span className="text-gray-700">Priority support & booking</span>
                    </div>
                  </div>

                  <a href="/#quick-assessment">
                    <Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-3 text-lg">
                      <ShinyText text="Start Weekly Plan" speed={4} />
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </a>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              Everything Included in Both Plans
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              All our coaching plans come with comprehensive support and professional tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Shield className="w-12 h-12 text-brand-teal mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-ink-dark mb-3">Qualified Professionals</h3>
              <p className="text-gray-600">Our coaches are carefully vetted professionals with specialized ACT training and experience.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <MessageSquare className="w-12 h-12 text-brand-orange mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-ink-dark mb-3">24/7 Messaging</h3>
              <p className="text-gray-600">Send messages to your coach anytime between sessions for continuous support.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <Clock className="w-12 h-12 text-brand-leaf mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-ink-dark mb-3">Flexible Scheduling</h3>
              <p className="text-gray-600">Book sessions at times that work for you with easy rescheduling options.</p>
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
              Ready to Start Your Transformation?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Take our quick assessment to get matched with the perfect coach for your journey.
            </p>
            <div className="flex justify-center">
              <a href="/#quick-assessment">
                <Button 
                  size="lg" 
                  className="bg-white text-brand-teal hover:bg-gray-50 px-8 py-4 text-lg"
                >
                  <span className="text-brand-teal font-semibold">Start Your Assessment</span>
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