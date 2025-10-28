"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import GradientText from "@/components/GradientText"
import CountUp from "@/components/CountUp"
import SpotlightCard from "@/components/SpotlightCard"
import ShinyText from "@/components/ShinyText"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import Footer from "@/components/Footer"
import {
  CheckCircle,
  Star,
  Clock,
  Calendar,
  Users,
  Shield,
  MessageSquare,
  ChevronRight,
} from "lucide-react"

// Static pricing plans
const plans = {
  monthly: {
    name: "Monthly Sessions",
    description: "Perfect for ongoing support",
    price: 99.95,
    sessions: 2,
    features: [
      "2 x 50-minute sessions monthly",
      "Qualified ACT coach matching",
      "Unlimited messaging support",
      "Flexible scheduling",
      "Progress tracking tools",
      "24/7 platform access"
    ]
  },
  weekly: {
    name: "Weekly Sessions",
    description: "Intensive transformation support",
    price: 149.95,
    sessions: 4,
    popular: true,
    features: [
      "4 x 50-minute sessions monthly",
      "Priority coach matching",
      "Unlimited messaging support",
      "Flexible scheduling",
      "Advanced progress tracking",
      "Priority support & booking"
    ]
  }
}

export default function PricingPage() {

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="py-24 md:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >


            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-ink-dark dark:text-white mb-8 tracking-tight">
              Choose Your <GradientText className="inline-block leading-normal">Coaching Plan</GradientText>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-16 max-w-4xl mx-auto leading-relaxed">
              Professional ACT coaching tailored to your needs. All plans include qualified coaches, flexible scheduling, and unlimited messaging support between sessions.
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
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.6 }}
            >
              <SpotlightCard className="h-full p-8 relative shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-teal/30 bg-gradient-to-br from-white to-gray-50/50 group">
                <div className="text-center">
                  <div className="mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <Calendar className="w-12 h-12 text-brand-teal mx-auto mb-4 group-hover:text-brand-orange transition-colors duration-300" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-ink-dark dark:text-white mb-2">{plans.monthly.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{plans.monthly.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-5xl font-bold text-brand-teal">
                        $<CountUp to={Math.floor(plans.monthly.price)} duration={2} />
                      </span>
                      <span className="text-2xl font-bold text-brand-teal">.{String(plans.monthly.price).split('.')[1]}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{plans.monthly.sessions} coaching sessions per month</p>
                  </div>

                  <div className="space-y-4 mb-8 text-left">
                    {plans.monthly.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <a href="/assessment">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-3 text-lg shadow-lg shadow-brand-teal/30 hover:shadow-xl transition-all duration-300 group">
                        <ShinyText text="Start Monthly Plan" speed={4} />
                        <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </motion.div>
                  </a>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Weekly Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard className={`h-full p-8 relative shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-brand-orange/30 bg-gradient-to-br from-white dark:from-gray-800 to-gray-50/50 dark:to-gray-900/50 group ${plans.weekly.popular ? 'border-2 border-brand-teal dark:border-brand-teal' : ''}`}>
                {/* Popular Badge */}
                {plans.weekly.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-2xl animate-pulse transform rotate-12"
                         style={{
                           boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2)'
                         }}>
                      <Star className="w-3 h-3 mr-1 text-yellow-900" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className={`mb-6 ${plans.weekly.popular ? 'mt-4' : ''}`}>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <Users className="w-12 h-12 text-brand-orange mx-auto mb-4 group-hover:text-brand-teal transition-colors duration-300" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-ink-dark dark:text-white mb-2">{plans.weekly.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{plans.weekly.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-5xl font-bold text-brand-orange">
                        $<CountUp to={Math.floor(plans.weekly.price)} duration={2.2} />
                      </span>
                      <span className="text-2xl font-bold text-brand-orange">.{String(plans.weekly.price).split('.')[1]}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{plans.weekly.sessions} coaching sessions per month</p>
                  </div>

                  <div className="space-y-4 mb-8 text-left">
                    {plans.weekly.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-leaf mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <a href="/assessment">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-3 text-lg shadow-lg shadow-brand-orange/30 hover:shadow-xl transition-all duration-300 group">
                        <ShinyText text="Start Weekly Plan" speed={4} />
                        <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </motion.div>
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
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark dark:text-white mb-4">
              Everything Included in Both Plans
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              All our coaching plans come with comprehensive support and professional tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6 }}
              className="text-center group cursor-pointer p-6 rounded-xl hover:bg-gradient-to-br hover:from-brand-teal/5 hover:to-transparent transition-colors duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <Shield className="w-12 h-12 text-brand-teal mx-auto mb-4 group-hover:text-brand-orange transition-colors duration-300" />
              </motion.div>
              <h3 className="text-xl font-semibold text-ink-dark dark:text-white mb-3">Qualified Professionals</h3>
              <p className="text-gray-600 dark:text-gray-400">Our coaches are carefully vetted professionals with specialized ACT training and experience.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center group cursor-pointer p-6 rounded-xl hover:bg-gradient-to-br hover:from-brand-orange/5 hover:to-transparent transition-colors duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <MessageSquare className="w-12 h-12 text-brand-orange mx-auto mb-4 group-hover:text-brand-leaf transition-colors duration-300" />
              </motion.div>
              <h3 className="text-xl font-semibold text-ink-dark dark:text-white mb-3">24/7 Messaging</h3>
              <p className="text-gray-600 dark:text-gray-400">Send messages to your coach anytime between sessions for continuous support.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center group cursor-pointer p-6 rounded-xl hover:bg-gradient-to-br hover:from-brand-leaf/5 hover:to-transparent transition-colors duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <Clock className="w-12 h-12 text-brand-leaf mx-auto mb-4 group-hover:text-brand-teal transition-colors duration-300" />
              </motion.div>
              <h3 className="text-xl font-semibold text-ink-dark dark:text-white mb-3">Flexible Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-400">Book sessions at times that work for you with easy rescheduling options.</p>
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
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="bg-white dark:bg-gray-900text-brand-teal hover:bg-gray-50 px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  >
                    <span className="text-brand-teal font-semibold">Start Your Assessment</span>
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </motion.div>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  )
}