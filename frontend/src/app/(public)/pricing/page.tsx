"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import GradientText from "@/components/GradientText"
import CountUp from "@/components/CountUp"
import SpotlightCard from "@/components/SpotlightCard"
import ShinyText from "@/components/ShinyText"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import Footer from "@/components/Footer"
import contactUsPhoto from "@/app/(public)/images/contactUs.png"
import {
  CheckCircle,
  Star,
  Clock,
  Calendar,
  Users,
  Shield,
  MessageSquare,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
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
  const [isYearly, setIsYearly] = useState(false)
  const [activeTab, setActiveTab] = useState('qualified')

  // Calculate yearly prices (assuming 10% discount for yearly)
  const getPrice = (monthlyPrice: number) => {
    if (isYearly) {
      return (monthlyPrice * 12 * 0.9).toFixed(2) // 10% discount for yearly
    }
    return monthlyPrice.toFixed(2)
  }

  const getPriceLabel = () => isYearly ? '/year' : '/month'

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="relative py-32 md:py-40 lg:py-48 bg-[url('/images/pricing-hero.png')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Choose your coaching plan
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Professional ACT coaching designed to transform your life. Experienced coaches deliver personalized support through flexible, evidence-based sessions that meet you where you are.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/assessment">
                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-4 text-lg font-medium">
                  Start assessment
                </Button>
              </a>
              <Button className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-4 text-lg font-medium">
                Learn more
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coaching Plans Section with Toggle */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Invest</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Coaching plans
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Transform your life with personalized ACT coaching
            </p>

            {/* Toggle Tabs */}
            <div className="inline-flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden mb-12">
              <motion.button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                  !isYearly
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: isYearly ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                Monthly
              </motion.button>
              <motion.button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 text-sm font-medium transition-colors duration-200 border-l border-gray-300 dark:border-gray-600 ${
                  isYearly
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: !isYearly ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                Yearly
              </motion.button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Sessions Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-2 border-gray-900 dark:border-white rounded-none p-10 bg-white dark:bg-gray-800 flex flex-col cursor-pointer"
            >
              <div className="text-center mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Monthly sessions</h3>
                <div className="flex items-baseline justify-center mb-8">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    ${isYearly ? getPrice(plans.monthly.price).split('.')[0] : Math.floor(plans.monthly.price)}
                  </span>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    .{isYearly ? getPrice(plans.monthly.price).split('.')[1] : String(plans.monthly.price).split('.')[1]}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Qualified ACT coach matching</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Unlimited messaging support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Flexible session scheduling</span>
                </li>
              </ul>

              <a href="/assessment" className="block mt-auto">
                <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 py-4 text-sm font-medium rounded-none">
                  Start monthly plan
                </Button>
              </a>
            </motion.div>

            {/* Weekly Sessions Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-2 border-gray-900 dark:border-white rounded-none p-10 bg-white dark:bg-gray-800 flex flex-col cursor-pointer"
            >
              <div className="text-center mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Weekly sessions</h3>
                <div className="flex items-baseline justify-center mb-8">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    ${isYearly ? getPrice(plans.weekly.price).split('.')[0] : Math.floor(plans.weekly.price)}
                  </span>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    .{isYearly ? getPrice(plans.weekly.price).split('.')[1] : String(plans.weekly.price).split('.')[1]}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Priority coach matching</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Unlimited messaging support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Flexible session scheduling</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Advanced progress tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Priority support and booking</span>
                </li>
              </ul>

              <a href="/assessment" className="block mt-auto">
                <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 py-4 text-sm font-medium rounded-none">
                  Start weekly plan
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Everything Included Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Benefits</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything included in both plans
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Our comprehensive coaching approach ensures you receive holistic support across every session.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button
                onClick={() => setActiveTab('qualified')}
                className={`${activeTab === 'qualified' || activeTab === 'messaging' || activeTab === 'scheduling' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'} px-8 py-3 text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-100`}
              >
                Learn more
              </Button>
              <Button
                onClick={() => setActiveTab('explore')}
                className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-8 py-3 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                Explore
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Three Clickable Items */}
            <div className="flex flex-wrap justify-center gap-10 mb-12">
              <button
                onClick={() => setActiveTab('qualified')}
                className={`text-base md:text-lg font-medium transition-colors ${activeTab === 'qualified' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-2' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Qualified professionals
              </button>
              <button
                onClick={() => setActiveTab('messaging')}
                className={`text-base md:text-lg font-medium transition-colors ${activeTab === 'messaging' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-2' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                24/7 messaging
              </button>
              <button
                onClick={() => setActiveTab('scheduling')}
                className={`text-base md:text-lg font-medium transition-colors ${activeTab === 'scheduling' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-2' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Flexible scheduling
              </button>
            </div>
          </motion.div>

          {/* Content Box */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="border-2 border-gray-900 dark:border-white rounded-none overflow-hidden"
          >
            <div className="grid md:grid-cols-2">
              {/* Left Content */}
              <div className="p-12 md:p-16 lg:p-20 bg-white dark:bg-gray-800 flex items-center min-h-[400px] md:min-h-[500px]">
                {activeTab === 'qualified' && (
                  <div className="max-w-lg space-y-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Expert coaches</p>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      Vetted ACT practitioners
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                      Each coach undergoes rigorous certification and continuous professional development to ensure highest quality support.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Button className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-white px-6 py-2.5 text-xs font-semibold hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all rounded-none">
                        Details
                      </Button>
                      <button className="text-gray-900 dark:text-white font-semibold text-xs flex items-center gap-2 hover:gap-4 transition-all px-2">
                        Discover
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'messaging' && (
                  <div className="max-w-lg space-y-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Always available</p>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      24/7 messaging support
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                      Connect with your coach anytime through our secure messaging platform for continuous support between sessions.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Button className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-white px-6 py-2.5 text-xs font-semibold hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all rounded-none">
                        Details
                      </Button>
                      <button className="text-gray-900 dark:text-white font-semibold text-xs flex items-center gap-2 hover:gap-4 transition-all px-2">
                        Discover
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'scheduling' && (
                  <div className="max-w-lg space-y-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Your schedule</p>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      Flexible scheduling
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                      Book and reschedule sessions at times that work for you with our easy-to-use scheduling system.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Button className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-white px-6 py-2.5 text-xs font-semibold hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all rounded-none">
                        Details
                      </Button>
                      <button className="text-gray-900 dark:text-white font-semibold text-xs flex items-center gap-2 hover:gap-4 transition-all px-2">
                        Discover
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Image */}
              <div className="relative min-h-[400px] md:min-h-[500px] overflow-hidden">
                {activeTab === 'qualified' && (
                  <img
                    src="/images/pricing-vetted.png"
                    alt="Vetted ACT practitioners"
                    className="w-full h-full object-cover"
                  />
                )}
                {activeTab === 'messaging' && (
                  <img
                    src="/images/pricing-247.png"
                    alt="24/7 messaging support"
                    className="w-full h-full object-cover"
                  />
                )}
                {activeTab === 'scheduling' && (
                  <img
                    src="/images/pricing-flex.png"
                    alt="Flexible scheduling"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Ready to transform */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  Ready to transform your team's potential
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl mb-8 leading-relaxed">
                  Discover personalized group coaching solutions designed to unlock collective growth and performance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-3 text-base font-medium">
                    Start now
                  </Button>
                  <Button className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-white hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-3 text-base font-medium">
                    Learn more
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-lg overflow-hidden aspect-[4/3]"
            >
              <img
                src="/images/pricing-potential.png"
                alt="Ready to transform your team's potential"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Client Stories Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Testimonial 1 - Sarah Martinez */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 p-6 shadow-md border border-gray-200 dark:border-gray-700"
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
              className="bg-white dark:bg-gray-800 p-6 shadow-md border border-gray-200 dark:border-gray-700"
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
              className="bg-white dark:bg-gray-800 p-6 shadow-md border border-gray-200 dark:border-gray-700"
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

      {/* Contact Us Section */}
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Header Section */}
            <div className="mb-12">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Connect</p>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Contact us</h1>
              <p className="text-gray-600 dark:text-gray-300">
                We're here to support your journey towards personal and professional growth
              </p>
            </div>

            {/* Contact Info Section */}
            <div className="mb-16">
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="text-gray-700 dark:text-gray-300 mt-1" />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Email</h2>
                    <p className="text-gray-600 dark:text-gray-300">support@actcoaching.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="text-gray-700 dark:text-gray-300 mt-1" />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Phone</h2>
                    <p className="text-gray-600 dark:text-gray-300">+1 (888) 234-5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-gray-700 dark:text-gray-300 mt-1" />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Office</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Level 5, 123 Business Street, Sydney NSW 2000
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="overflow-hidden shadow-sm">
            <img
              src={contactUsPhoto.src}
              alt="Sydney Opera House"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
