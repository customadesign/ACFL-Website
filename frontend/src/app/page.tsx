"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Logo from "@/components/Logo"
// QuickAssessment moved to /get-started page
import AssessmentCompleteModal from "@/components/AssessmentCompleteModal"
import GradientText from "@/components/GradientText"
import CountUp from "@/components/CountUp"
import SpotlightCard from "@/components/SpotlightCard"
import ShinyText from "@/components/ShinyText"
import LottieAnimation from "@/components/LottieAnimation"
import Footer from "@/components/Footer"
import Ballpit from "@/components/Ballpit"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Heart,
  Clock,
  Shield,
  Star,
  ChevronRight,
  Play,
  Users,
  Award,
  MessageCircle,
  Calendar,
  MessageSquare,
  ArrowRight
} from "lucide-react"
import NavbarLandingPage from "@/components/NavbarLandingPage"

export default function HomePage() {
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)

  // Assessment handling moved to /get-started page
  const handleAssessmentComplete = (data: any) => {
    // This function is no longer used on landing page
    console.log('Assessment completed, data stored:', {
      areaOfConcern: data.areaOfConcern,
      location: data.location,
      availability: data.availability,
      priceRange: data.priceRange
    })
    
    // Show modal for user to choose login or register
    setShowAssessmentModal(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      {/* Hero Section */}
      <section id="quick-assessment" className="relative bg-gradient-to-br from-gray-lite via-white to-blue-50 pt-2 pb-8 lg:pt-4 lg:pb-12 overflow-hidden">
        {/* Background Lottie Animation */}
        <div className="absolute top-10 right-10 opacity-60 hidden md:block z-0">
          <LottieAnimation width={280} height={280} />
        </div>

        {/* Growing Plants Animation - Large Garden */}
        <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none z-0">
          {/* Left Large Plant */}
          <motion.div
            className="absolute bottom-0 left-4 lg:left-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 2.5, delay: 0.8, ease: "easeOut" }}
          >
            <svg width="300" height="600" viewBox="0 0 300 600" className="text-brand-leaf">
              {/* Main Stem */}
              <motion.line
                x1="150" y1="600" x2="150" y2="200"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1.2 }}
              />
              {/* Large Leaves */}
              <motion.path
                d="M150 300 Q100 225 50 250 Q100 275 150 300"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 2.5 }}
              />
              <motion.path
                d="M150 350 Q200 275 250 300 Q200 325 150 350"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 2.8 }}
              />
              <motion.path
                d="M150 250 Q75 175 25 200 Q75 225 150 250"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 3.1 }}
              />
              <motion.path
                d="M150 400 Q225 325 275 350 Q225 375 150 400"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 3.4 }}
              />
            </svg>
          </motion.div>

          {/* Center Left Plant */}
          <motion.div
            className="absolute bottom-0 left-1/4 transform -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.35 }}
            transition={{ duration: 2.2, delay: 1.2, ease: "easeOut" }}
          >
            <svg width="250" height="500" viewBox="0 0 250 500" className="text-brand-teal">
              {/* Stem */}
              <motion.line
                x1="125" y1="500" x2="125" y2="150"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, delay: 1.6 }}
              />
              {/* Elliptical Leaves */}
              <motion.ellipse
                cx="75" cy="250" rx="32" ry="60"
                fill="currentColor"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 2.8 }}
              />
              <motion.ellipse
                cx="175" cy="300" rx="24" ry="48"
                fill="currentColor"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 3.2 }}
              />
              <motion.ellipse
                cx="60" cy="180" rx="20" ry="40"
                fill="currentColor"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 3.6 }}
              />
              <motion.ellipse
                cx="190" cy="220" rx="18" ry="36"
                fill="currentColor"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 4 }}
              />
            </svg>
          </motion.div>

          {/* Center Plant */}
          <motion.div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 2, delay: 1.8, ease: "easeOut" }}
          >
            <svg width="200" height="400" viewBox="0 0 200 400" className="text-brand-orange">
              {/* Main stem */}
              <motion.line
                x1="100" y1="400" x2="100" y2="120"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 2.2 }}
              />
              {/* Circular leaves */}
              <motion.circle
                cx="60" cy="200" r="24"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 3.5 }}
              />
              <motion.circle
                cx="140" cy="240" r="20"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 3.8 }}
              />
              <motion.circle
                cx="70" cy="160" r="18"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 4.1 }}
              />
              <motion.circle
                cx="130" cy="180" r="16"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 4.4 }}
              />
            </svg>
          </motion.div>

          {/* Center Right Plant */}
          <motion.div
            className="absolute bottom-0 right-1/4 transform translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.35 }}
            transition={{ duration: 2.3, delay: 1.4, ease: "easeOut" }}
          >
            <svg width="220" height="440" viewBox="0 0 220 440" className="text-brand-coral">
              {/* Stem */}
              <motion.line
                x1="110" y1="440" x2="110" y2="140"
                stroke="currentColor"
                strokeWidth="9"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.7, delay: 1.8 }}
              />
              {/* Mixed leaf shapes */}
              <motion.path
                d="M110 220 Q80 195 60 210 Q80 225 110 220"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 3 }}
              />
              <motion.ellipse
                cx="150" cy="260" rx="20" ry="35"
                fill="currentColor"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 3.3 }}
              />
              <motion.circle
                cx="75" cy="190" r="16"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 3.6 }}
              />
              <motion.path
                d="M110 290 Q140 265 160 280 Q140 295 110 290"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 3.9 }}
              />
            </svg>
          </motion.div>

          {/* Right Large Plant */}
          <motion.div
            className="absolute bottom-0 right-4 lg:right-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 2.4, delay: 1, ease: "easeOut" }}
          >
            <svg width="280" height="560" viewBox="0 0 280 560" className="text-brand-leaf">
              {/* Main Stem */}
              <motion.line
                x1="140" y1="560" x2="140" y2="180"
                stroke="currentColor"
                strokeWidth="11"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.1, delay: 1.4 }}
              />
              {/* Large organic leaves */}
              <motion.path
                d="M140 280 Q190 205 240 230 Q190 255 140 280"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.3, delay: 2.7 }}
              />
              <motion.path
                d="M140 330 Q90 255 40 280 Q90 305 140 330"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.3, delay: 3 }}
              />
              <motion.path
                d="M140 230 Q210 155 260 180 Q210 205 140 230"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.3, delay: 3.3 }}
              />
              <motion.path
                d="M140 380 Q70 305 20 330 Q70 355 140 380"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.3, delay: 3.6 }}
              />
            </svg>
          </motion.div>

          {/* Small sprouts scattered around */}
          <motion.div
            className="absolute bottom-0 left-16"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.25 }}
            transition={{ duration: 1.5, delay: 2.5 }}
          >
            <svg width="80" height="160" viewBox="0 0 80 160" className="text-brand-orange">
              <motion.line x1="40" y1="160" x2="40" y2="120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" 
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 2.8 }} />
              <motion.circle cx="25" cy="130" r="8" fill="currentColor" 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 3.5 }} />
              <motion.circle cx="55" cy="135" r="6" fill="currentColor" 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 3.8 }} />
            </svg>
          </motion.div>

          <motion.div
            className="absolute bottom-0 right-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.25 }}
            transition={{ duration: 1.5, delay: 3 }}
          >
            <svg width="90" height="180" viewBox="0 0 90 180" className="text-brand-teal">
              <motion.line x1="45" y1="180" x2="45" y2="130" stroke="currentColor" strokeWidth="4" strokeLinecap="round" 
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 3.3 }} />
              <motion.ellipse cx="25" cy="145" rx="8" ry="12" fill="currentColor" 
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: 4 }} />
              <motion.ellipse cx="65" cy="150" rx="6" ry="10" fill="currentColor" 
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: 4.3 }} />
            </svg>
          </motion.div>

          <motion.div
            className="absolute bottom-0 left-1/3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 1.5, delay: 3.5 }}
          >
            <svg width="70" height="140" viewBox="0 0 70 140" className="text-brand-coral">
              <motion.line x1="35" y1="140" x2="35" y2="110" stroke="currentColor" strokeWidth="3" strokeLinecap="round" 
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 3.8 }} />
              <motion.circle cx="22" cy="120" r="6" fill="currentColor" 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 4.5 }} />
              <motion.circle cx="48" cy="125" r="5" fill="currentColor" 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 4.8 }} />
            </svg>
          </motion.div>
                  </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left -mt-4 lg:-mt-6"
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-ink-dark mb-6 leading-tight">
                Find the perfect coach for meaningful change
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-snug">
                Professional ACT coaching that helps you overcome challenges, build resilience, 
                and create meaningful life changes. Get matched with qualified coaches in 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="/get-started">
                  <Button
                    size="lg"
                    className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-4 text-lg w-full sm:w-auto"
                  >
                    <ShinyText text="Get Started Today" speed={3} />
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-300 bg-white hover:border-brand-teal text-gray-700 px-8 py-4 text-lg w-full sm:w-auto"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
                </div>
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-brand-leaf mr-2" />
                  Qualified professionals
              </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-brand-leaf mr-2" />
                  24/7 support
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-brand-leaf mr-2" />
                  Insurance accepted
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-20 hidden lg:block"
            >
              {/* Hero Image or Animation Placeholder */}
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-teal/10 to-brand-leaf/10 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Users className="w-24 h-24 text-brand-teal mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">Connect with certified ACT coaches</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold text-brand-teal mb-2">
                <CountUp to={3000} duration={2.5} separator="," />+
                  </div>
              <div className="text-gray-600">Active clients</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold text-brand-orange mb-2">
                <CountUp to={500} duration={2} />+
                </div>
              <div className="text-gray-600">Professional coaches</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold text-brand-leaf mb-2">
                <CountUp to={4.8} duration={2.2} from={0} />/<CountUp to={5} duration={1.8} />
              </div>
              <div className="text-gray-600">Client rating</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold text-brand-coral mb-2">
                <CountUp to={24} duration={1.5} />hr
              </div>
              <div className="text-gray-600">Match guarantee</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-lite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              Why choose ACT Coaching For Life?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine proven ACT methodology with personalized matching to help you achieve lasting change.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-lg flex items-center justify-center mb-6">
                    <Heart className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">Personalized Matching</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our advanced algorithm considers your goals, personality, and preferences to match you with the perfect coach.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-lg flex items-center justify-center mb-6">
                    <Clock className="w-6 h-6 text-brand-orange" />
                          </div>
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">Flexible Scheduling</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Book sessions that fit your schedule. Morning, evening, or weekend - we have coaches available when you need them.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-brand-leaf/10 rounded-lg flex items-center justify-center mb-6">
                    <Shield className="w-6 h-6 text-brand-leaf" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">Qualified Professionals</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our coaches are carefully vetted, trained in ACT methodology, and committed to helping you achieve your goals.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="h-full border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-brand-coral/10 rounded-lg flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-brand-coral" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">Ongoing Support</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Get continuous support between sessions with messaging, resources, and check-ins from your coach.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="h-full border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-lg flex items-center justify-center mb-6">
                    <Award className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">Proven Results</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our clients report 85% improvement in their mental well-being within 3 months of starting coaching.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="h-full border-0  bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-lg flex items-center justify-center mb-6">
                    <MessageCircle className="w-6 h-6 text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">Multiple Formats</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Choose from video calls, phone sessions, or text-based coaching to match your communication preference.
                  </p>
                </CardContent>
              </Card>
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