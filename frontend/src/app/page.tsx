"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Logo from "@/components/Logo"
import QuickAssessment from "@/components/QuickAssessment"
import GradientText from "@/components/GradientText"
import CountUp from "@/components/CountUp"
import SpotlightCard from "@/components/SpotlightCard"
import ShinyText from "@/components/ShinyText"
import LottieAnimation from "@/components/LottieAnimation"
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
  MessageCircle
} from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  const handleAssessmentComplete = (data: any) => {
    // Store the assessment data and redirect directly to results
    localStorage.setItem('formData', JSON.stringify({
      areaOfConcern: data.areaOfConcern || [],
      location: data.location || '',
      availability: data.availability || [],
      paymentMethod: data.paymentMethod || '',
      // Set default values for required fields not in quick assessment
      treatmentModality: [],
      genderIdentity: '',
      ethnicIdentity: '',
      religiousBackground: '',
      therapistGender: '',
      therapistEthnicity: '',
      therapistReligion: '',
      language: ''
    }))
    
    // For now, redirect to find-coach to complete the full form
    // Later this could trigger an API call to find matches directly
    router.push('/find-coach?from=assessment')
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size={32} />
              <span className="text-xl font-bold text-ink-dark">ACT Coaching For Life</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#quick-assessment" className="text-gray-600 hover:text-brand-teal transition-colors cursor-pointer">Find a Coach</a>
              <Link href="#how-it-works" className="text-gray-600 hover:text-brand-teal transition-colors">How it Works</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-brand-teal transition-colors">Pricing</Link>
              <Link href="/about" className="text-gray-600 hover:text-brand-teal transition-colors">About</Link>
              <Link href="/login">
                <Button variant="outline" className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
                  Login
                </Button>
            </Link>
              <a href="#quick-assessment">
                <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                  Get Started
                </Button>
              </a>
          </div>
        </div>
      </div>
      </nav>

      {/* Hero Section */}
      <section id="quick-assessment" className="relative bg-gradient-to-br from-gray-lite via-white to-blue-50 py-20 lg:py-28 overflow-hidden">
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
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-ink-dark mb-6">
                Find the perfect coach for meaningful change
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Professional ACT coaching that helps you overcome challenges, build resilience, 
                and create meaningful life changes. Get matched with qualified coaches in 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#quick-assessment">
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
                  className="border-2 border-gray-300 hover:border-brand-teal text-gray-700 px-8 py-4 text-lg w-full sm:w-auto"
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
              className="relative z-20"
            >
              <QuickAssessment onComplete={handleAssessmentComplete} />
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
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
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
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
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
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
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
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
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
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
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
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
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
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with your coaching journey is simple and takes just a few minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-brand-teal rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-ink-dark mb-4">Take Assessment</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete our quick 2-minute assessment to help us understand your goals, preferences, and coaching needs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-ink-dark mb-4">Get Matched</h3>
              <p className="text-gray-600 leading-relaxed">
                Within 24 hours, we'll match you with 3-5 coaches who fit your needs. Review their profiles and choose your favorite.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-brand-leaf rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-ink-dark mb-4">Start Coaching</h3>
              <p className="text-gray-600 leading-relaxed">
                Schedule your first session and begin your journey to positive change with ongoing support from your coach.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <a href="#quick-assessment">
              <Button size="lg" className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-4 text-lg">
                <ShinyText text="Start Your Journey Today" speed={4} />
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-lite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              What our clients say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real stories from people who have transformed their lives through ACT coaching.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SpotlightCard className="h-full p-6">
                  <div className="flex items-start space-x-4">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=96&h=96&fit=crop&crop=face&auto=format&q=80" 
                      alt="Sarah Martinez"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">Sarah Martinez</div>
                          <div className="text-sm text-gray-500">Local Guide • 47 reviews</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%234285f4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334a853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23fbbc05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23ea4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E" alt="Google" className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">3 months ago</span>
                          </div>
                      <p className="text-gray-700 leading-relaxed">
                        My coach helped me work through anxiety that was holding me back for years. The ACT approach really clicked with me, and I finally feel like I'm living authentically. Highly recommend!
                      </p>
                        </div>
                  </div>
              </SpotlightCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard className="h-full p-6">
                  <div className="flex items-start space-x-4">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face&auto=format&q=80" 
                      alt="Michael Rodriguez"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">Michael Rodriguez</div>
                          <div className="text-sm text-gray-500">Local Guide • 29 reviews</div>
                </div>
                        <div className="flex items-center space-x-1">
                          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%234285f4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334a853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23fbbc05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23ea4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E" alt="Google" className="w-4 h-4" />
              </div>
                      </div>
                      <div className="flex items-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">2 months ago</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        The matching process was incredible - they found me a coach who understood my specific challenges. Three months later, I feel more confident and focused than ever. Worth every penny.
                      </p>
                    </div>
                  </div>
              </SpotlightCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <SpotlightCard className="h-full p-6">
                  <div className="flex items-start space-x-4">
                    <img 
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face&auto=format&q=80" 
                      alt="Jennifer Lee"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">Jennifer Lee</div>
                          <div className="text-sm text-gray-500">Local Guide • 63 reviews</div>
                  </div>
                        <div className="flex items-center space-x-1">
                          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%234285f4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334a853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23fbbc05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23ea4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E" alt="Google" className="w-4 h-4" />
                </div>
                      </div>
                      <div className="flex items-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">1 month ago</span>
                </div>
                      <p className="text-gray-700 leading-relaxed">
                        I was skeptical about online coaching, but the platform made it so easy to connect with my coach. The flexibility to message between sessions has been a game-changer. Amazing service!
                      </p>
              </div>
                  </div>
              </SpotlightCard>
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
              <a href="#quick-assessment">
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

      {/* Footer */}
      <footer className="bg-ink-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Logo size={32} />
                <span className="text-xl font-bold">ACT Coaching For Life</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transforming lives through personalized ACT coaching and evidence-based practice.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/find-coach" className="hover:text-white transition-colors">Find a Coach</a></li>
                <li><a href="/group-coaching" className="hover:text-white transition-colors">Group Coaching</a></li>
                <li><a href="/corporate" className="hover:text-white transition-colors">Corporate Programs</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Resources</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="/press" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Download Our App</h3>
              <div className="space-y-3">
                {/* App Store Button */}
                <a href="#" className="block">
                  <div className="bg-black rounded-lg px-4 py-2 flex items-center space-x-3 hover:bg-gray-800 transition-colors w-fit">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">Download on the</div>
                      <div className="text-sm font-semibold text-white">App Store</div>
                    </div>
                  </div>
                </a>
                
                {/* Google Play Button */}
                <a href="#" className="block">
                  <div className="bg-black rounded-lg px-4 py-2 flex items-center space-x-3 hover:bg-gray-800 transition-colors w-fit">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">Get it on</div>
                      <div className="text-sm font-semibold text-white">Google Play</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ACT Coaching For Life. All rights reserved.</p>
          </div>
        </div>
      </footer>
  </div>
  )
}