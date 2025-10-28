"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Building, Users, TrendingUp, Award, CheckCircle, ChevronRight } from "lucide-react"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import Footer from "@/components/Footer"
import Testimonial from "../component/testimonial"
import Contact from "../component/contactUs"

// Static benefits data
const defaultBenefits = [
  {
    icon: TrendingUp,
    title: "Increased Productivity",
    description: "Employees who participate in ACT coaching show 23% improvement in work performance"
  },
  {
    icon: Users,
    title: "Better Team Dynamics",
    description: "Enhanced communication and collaboration through psychological flexibility"
  },
  {
    icon: Award,
    title: "Reduced Burnout",
    description: "45% reduction in employee stress and burnout rates across participating companies"
  },
  {
    icon: Building,
    title: "Lower Turnover",
    description: "Companies see 35% reduction in employee turnover after implementing ACT programs"
  }
]

const defaultPrograms = [
  {
    title: "Leadership Development",
    description: "Develop psychologically flexible leaders who can adapt to change and inspire their teams",
    features: ["Executive coaching sessions", "Leadership assessment tools", "Team building workshops", "360-degree feedback"],
    duration: "3-6 months"
  },
  {
    title: "Employee Wellness",
    description: "Comprehensive mental health support for your entire workforce",
    features: ["Individual coaching access", "Group wellness sessions", "Stress management training", "24/7 support platform"],
    duration: "Ongoing"
  },
  {
    title: "Change Management",
    description: "Help your organization navigate transitions with resilience and adaptability",
    features: ["Change readiness assessment", "Transition coaching", "Communication strategies", "Progress monitoring"],
    duration: "2-4 months"
  },
  {
    title: "Team Performance",
    description: "Boost team cohesion and performance through ACT-based team coaching",
    features: ["Team dynamics assessment", "Group coaching sessions", "Conflict resolution training", "Performance metrics"],
    duration: "1-3 months"
  }
]

export default function CorporateProgramsPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentOrgSlide, setCurrentOrgSlide] = useState(0)
  const slides = [
    '/images/corporate-group1.png',
    '/images/corporate-group2.png',
    '/images/corporate-group3.png',
    '/images/corporate-group4.png'
  ]
  const orgSlides = [
    '/images/corp-org1.png',
    '/images/corp-org2.png',
    '/images/corp-org3.png',
    '/images/corp-org4.png'
  ]

  // Auto-slide effect for group coaching
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 3000) // Change slide every 3 seconds

    return () => clearInterval(interval)
  }, [slides.length])

  // Auto-slide effect for organizational
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOrgSlide((prev) => (prev + 1) % orgSlides.length)
    }, 3000) // Change slide every 3 seconds

    return () => clearInterval(interval)
  }, [orgSlides.length])

  return (
    <div className="flex flex-col min-h-screen bg-white ">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-[url('/images/corporate-hero.png')] bg-cover bg-center bg-no-repeat">
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-white/80 uppercase tracking-wider mb-6">
              Transform
            </p>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Coaching for life
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Personalized ACT coaching solutions designed to help you navigate challenges and unlock your true potential
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a href="#personalized-coaching">
                  <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-300">
                    Explore
                  </Button>
                </a>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a href="/assessment">
                  <Button className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-6 text-lg font-semibold transition-all duration-300">
                    Assessment
                  </Button>
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Personalized Coaching Section */}
      <section id="personalized-coaching" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Services</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Personalized coaching for every stage
            </h2>
            <p className="text-gray-600 text-base max-w-2xl mx-auto">
              Tailored solutions designed to meet your unique personal and professional needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 - One-on-one coaching */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gray-50 rounded-none overflow-hidden"
            >
              <div className="bg-gray-200 h-56 flex items-center justify-center">
                <img
                  src="/images/one-on-one.png"
                  alt="One-on-one coaching"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Individual</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  One-on-one coaching
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Focused support for personal growth and targeted skill development
                </p>
                <button className="text-gray-900 font-medium text-sm flex items-center group">
                  Explore
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Card 2 - Collaborative learning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-50 rounded-none overflow-hidden"
            >
              <div className="bg-gray-200 h-56 flex items-center justify-center">
                <img
                  src="/images/collab-session.png"
                  alt="Collaborative learning"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Group</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Collaborative learning experiences
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Shared insights and collective growth in specialized workshop settings
                </p>
                <button className="text-gray-900 font-medium text-sm flex items-center group">
                  Explore
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Card 3 - Organizational wellness */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gray-50 rounded-none overflow-hidden"
            >
              <div className="bg-gray-200 h-56 flex items-center justify-center">
                <img
                  src="/images/organizational.png"
                  alt="Organizational wellness"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Corporate</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Organizational wellness and leadership development
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Enhance team performance and workplace culture
                </p>
                <button className="text-gray-900 font-medium text-sm flex items-center group">
                  Explore
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Individual Coaching Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Individual coaching designed for your unique path
              </h2>
              <p className="text-gray-600 text-base mb-8 leading-relaxed">
                Flexible monthly and weekly sessions tailored to your personal growth objectives. Work directly with a certified ACT coach who understands your specific challenges.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/assessment">
                  <Button className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-6 py-3">
                    Book session
                  </Button>
                </a>
                <button className="text-gray-900 font-medium text-sm flex items-center group">
                  Learn more
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src="/images/corporate-section3.png"
                  alt="Individual coaching session"
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Transformative Group Coaching Section */}
      <section className="py-32 bg-[#e8f4f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Image Carousel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gray-200 rounded-lg overflow-hidden h-96 relative">
                {/* Sliding cards */}
                {slides.map((slide, index) => (
                  <motion.div
                    key={index}
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{
                      opacity: currentSlide === index ? 1 : 0,
                      x: currentSlide === index ? 0 : currentSlide > index ? -100 : 100,
                      scale: currentSlide === index ? 1 : 0.95
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <img
                      src={slide}
                      alt={`Group coaching ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}

                {/* Slide indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentSlide === index
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Programs</p>

              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Transformative group coaching experiences
                </h2>
                <p className="text-gray-600 text-base leading-relaxed">
                  Collaborative learning environments that foster personal growth and collective understanding.
                </p>
                <div className="flex flex-wrap gap-4 mt-6">
                  <a href="/assessment">
                    <Button className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-3">
                      Join program
                    </Button>
                  </a>
                  <a href="/group-coaching">
                    <button className="text-gray-900 font-medium text-sm flex items-center group">
                      Learn more
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </a>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-300">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Relationship communication
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Improve interpersonal dynamics and develop deeper, more authentic connections.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Organizational Potential Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Corporate</p>

              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Elevate your organization's potential
                </h2>
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  Comprehensive coaching solutions designed to transform workplace dynamics and drive meaningful organizational growth.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-3">
                    Engage
                  </Button>
                  <button className="text-gray-900 font-medium text-sm flex items-center group">
                    Explore
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-300">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Team performance
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Enhance collaboration, communication, and collective effectiveness through integrated coaching approaches.
                </p>
              </div>
            </motion.div>

            {/* Right Image Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gray-200 rounded-lg overflow-hidden h-96 relative">
                {/* Sliding cards */}
                {orgSlides.map((slide, index) => (
                  <motion.div
                    key={index}
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{
                      opacity: currentOrgSlide === index ? 1 : 0,
                      x: currentOrgSlide === index ? 0 : currentOrgSlide > index ? -100 : 100,
                      scale: currentOrgSlide === index ? 1 : 0.95
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <img
                      src={slide}
                      alt={`Organizational coaching ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}

                {/* Slide indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {orgSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentOrgSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentOrgSlide === index
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Transformative Coaching Solutions Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Impact</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transformative coaching solutions
            </h2>
            <p className="text-gray-600 text-base max-w-2xl mx-auto">
              Personalized approaches that drive meaningful change across individual and organizational levels.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Card 1 - Individual growth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-none overflow-hidden"
            >
              <div className="bg-gray-200 h-56 flex items-center justify-center">
                <img
                  src="/images/corp-indiv.png"
                  alt="Individual growth"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Personal</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Individual growth
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Unlock your unique potential through targeted psychological strategies.
                </p>
                <button className="text-gray-900 font-medium text-sm flex items-center group">
                  Discover
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Card 2 - Career development */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-none overflow-hidden"
            >
              <div className="bg-gray-200 h-56 flex items-center justify-center">
                <img
                  src="/images/career-dev.png"
                  alt="Career development"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Professional</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Career development
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Accelerate professional advancement with strategic skill enhancement.
                </p>
                <button className="text-gray-900 font-medium text-sm flex items-center group">
                  Advance
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Card 3 - Comprehensive wellness */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-none overflow-hidden"
            >
              <div className="bg-gray-200 h-56 flex items-center justify-center">
                <img
                  src="/images/comp-wellness.png"
                  alt="Comprehensive wellness"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Organizational</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Comprehensive wellness and performance strategies
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Strategic solutions that integrate individual growth with organizational objectives.
                </p>
                <button className="text-gray-900 font-medium text-sm flex items-center group">
                  Transform
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proven Impact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Results</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Proven impact of ACT coaching
            </h2>
            <p className="text-gray-600 text-base max-w-3xl mx-auto">
              Measurable outcomes that demonstrate the transformative power of evidence-based psychological coaching.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-16 mb-12 max-w-5xl mx-auto">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-6xl md:text-7xl font-bold text-gray-900 mb-2">
                35%
              </div>
              <p className="text-gray-600 text-sm">
                Reduced workplace turnover
              </p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-6xl md:text-7xl font-bold text-gray-900 mb-2">
                23%
              </div>
              <p className="text-gray-600 text-sm">
                Enhanced team performance
              </p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-6xl md:text-7xl font-bold text-gray-900 mb-2">
                87%
              </div>
              <p className="text-gray-600 text-sm">
                Client satisfaction rate
              </p>
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-6 py-3">
              Explore
            </Button>
            <button className="text-gray-900 font-medium text-sm flex items-center group">
              Learn more
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Client Stories Section */}
      <Testimonial />

      {/* Your Journey Starts Here Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your journey starts here
            </h2>
            <p className="text-gray-600 text-base max-w-2xl mx-auto mb-8">
              Complete our quick two-minute assessment to find your perfect coaching match
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <Button className="bg-[#25a7b8] text-white hover:bg-[#1e8a98] px-6 py-3">
                Start assessment
              </Button>
              <Button className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-6 py-3">
                Learn more
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-gray-100 rounded-lg overflow-hidden max-w-5xl mx-auto"
          >
            <img
              src="/images/corp-journey1.png"
              alt="Your journey starts here"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Contact Us Section */}
      <Contact />

      <Footer />
    </div>
  )
}