"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import Footer from "@/components/Footer"
import contactUsPhoto from "@/app/(public)/images/contactUs.png"
import {
  FileText,
  Users,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Calendar,
  BookOpen,
  Heart,
  ChevronRight,
  Mail,
  Phone,
  MapPin
} from "lucide-react"

export default function IndividualCoachingPage() {
  const [activeTab, setActiveTab] = useState('video')

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section - Personal growth starts here */}
      <section className="relative py-32 md:py-40 lg:py-48 bg-[url('/images/indiv-hero.png')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm text-white/80 uppercase tracking-wider mb-6">Transform</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Personal growth starts here
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Personalized ACT coaching designed to help you break through barriers and live with purpose and clarity
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/assessment">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-10 py-4 text-lg font-medium transition-all shadow-md hover:shadow-lg">
                  Start assessment
                </Button>
              </a>
              <a href="/pricing">
                <Button className="border-2 border-white bg-transparent hover:bg-white/10 text-white rounded-lg px-10 py-4 text-lg font-medium transition-all shadow-sm">
                  View plans
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coaching that fits your life */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Flexible</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Coaching that fits your life
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              We understand that every person's journey is unique. Our coaching adapts to your schedule and preferred communication style.
            </p>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <button
                onClick={() => setActiveTab('video')}
                className={`text-sm font-medium transition-colors ${activeTab === 'video' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Video sessions
              </button>
              <button
                onClick={() => setActiveTab('phone')}
                className={`text-sm font-medium transition-colors ${activeTab === 'phone' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Phone calls
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`text-sm font-medium transition-colors ${activeTab === 'text' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Text support
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
              <div className="p-8 md:p-12 lg:p-16 bg-white dark:bg-gray-800 flex items-center min-h-[300px] md:min-h-[400px]">
                {activeTab === 'video' && (
                  <div className="max-w-lg space-y-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Video</p>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      Face-to-face connection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                      Engage with your coach through high-quality video platforms that feel personal and effective.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                        Explore video
                      </Button>
                      <button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                        Learn more
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'phone' && (
                  <div className="max-w-lg space-y-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Phone</p>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      Convenient audio sessions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                      Connect with your coach via phone for flexible, on-the-go coaching that fits your busy lifestyle.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                        Explore phone
                      </Button>
                      <button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                        Learn more
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'text' && (
                  <div className="max-w-lg space-y-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Text</p>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      Ongoing messaging support
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                      Stay connected with your coach between sessions through secure messaging for continuous guidance.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                        Explore text
                      </Button>
                      <button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                        Learn more
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Image */}
              <div className="relative min-h-[300px] md:min-h-[400px] overflow-hidden">
                {activeTab === 'video' && (
                  <img
                    src="/images/indiv-f2f.png"
                    alt="Face-to-face connection"
                    className="w-full h-full object-cover"
                  />
                )}
                {activeTab === 'phone' && (
                  <img
                    src="/images/indiv-audio.png"
                    alt="Convenient audio sessions"
                    className="w-full h-full object-cover"
                  />
                )}
                {activeTab === 'text' && (
                  <img
                    src="/images/indiv-chat.png"
                    alt="Ongoing messaging support"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coaching plans that adapt */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Flexible</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Coaching plans that adapt
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Choose the rhythm that matches your personal growth journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="border-2 border-gray-900 dark:border-white rounded-none overflow-hidden bg-white dark:bg-gray-800"
            >
              <div className="grid md:grid-rows-[1fr_auto]">
                {/* Top Image */}
                <div className="h-64 overflow-hidden">
                  <img
                    src="/images/indiv-monthly.png"
                    alt="Deep dive into personal transformation"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom Content */}
                <div className="p-8 bg-white dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium mb-4">Monthly</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    Deep dive into personal transformation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    Four intensive sessions to unlock complex challenges and create meaningful change.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a href="/pricing">
                      <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                        Select
                      </Button>
                    </a>
                    <button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                      Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Weekly Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="border-2 border-gray-900 dark:border-white rounded-none overflow-hidden bg-white dark:bg-gray-800"
            >
              <div className="grid md:grid-rows-[1fr_auto]">
                {/* Top Image */}
                <div className="h-64 overflow-hidden">
                  <img
                    src="/images/indiv-weekly.png"
                    alt="Consistent support for ongoing growth"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom Content */}
                <div className="p-8 bg-white dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium mb-4">Weekly</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    Consistent support for ongoing growth
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    Regular check-ins for sustained momentum and address emerging challenges in real time.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a href="/pricing">
                      <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                        Choose
                      </Button>
                    </a>
                    <button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                      Learn
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Your path to personal coaching */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Simple</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Your path to personal coaching
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Three straightforward steps connect you with the right coach. It's completely free, supportive, and personalized.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Take the assessment
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Your quick questionnaire reveals your unique needs and goals
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
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Get matched
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                We find your ideal coach based within 24 hours
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
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6">
                <ArrowRight className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Begin coaching
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Start transformative sessions tailored to your journey
              </p>
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            <a href="/assessment">
              <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                Start
              </Button>
            </a>
            <Button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
              Learn
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Science-backed personal growth */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Proven</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Science-backed personal growth
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Evidence-based approach rooted in psychological research
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Research Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="border-2 border-gray-900 dark:border-white rounded-none overflow-hidden bg-white dark:bg-gray-800"
            >
              <div className="grid md:grid-rows-[auto_1fr]">
                {/* Top Image */}
                <div className="h-64 overflow-hidden">
                  <img
                    src="/images/indiv-research.png"
                    alt="Acceptance and commitment therapy fundamentals"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom Content */}
                <div className="p-8 bg-white dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium mb-4">Research</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    Acceptance and commitment therapy fundamentals
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    Psychological techniques validated by decades of clinical research and practice
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                      Explore
                    </Button>
                    <button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                      Learn
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Support Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="border-2 border-gray-900 dark:border-white rounded-none overflow-hidden bg-white dark:bg-gray-800"
            >
              <div className="grid md:grid-rows-[auto_1fr]">
                {/* Top Image */}
                <div className="h-64 overflow-hidden">
                  <img
                    src="/images/indiv-support.png"
                    alt="Continuous guidance between sessions"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom Content */}
                <div className="p-8 bg-white dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium mb-4">Support</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    Continuous guidance between sessions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    Secure messaging platform provides support and quick check-ins
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                      Connect
                    </Button>
                    <button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                      Discover
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Your journey starts now - CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Your journey starts now
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Take the first step towards personal growth with our personalized coaching experience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a href="/assessment">
                <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                  Start assessment
                </Button>
              </a>
              <a href="/pricing">
                <Button className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3 font-medium transition-all shadow-sm">
                  View plans
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="rounded-lg aspect-[16/9] max-w-5xl mx-auto overflow-hidden"
          >
            <img
              src="/images/indiv-journey.png"
              alt="Your journey starts now"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              FAQs
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Find answers to common questions about our ACT coaching services
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* FAQ 1 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'faq-0' ? '' : 'faq-0')}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  How quickly will you respond to my message?
                </span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    activeTab === 'faq-0' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {activeTab === 'faq-0' && (
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  We typically reply within 6 few minutes during business hours. If you reach out after hours, our team will get back to you the next business day.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'faq-1' ? '' : 'faq-1')}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  Do you offer phone consultations?
                </span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    activeTab === 'faq-1' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {activeTab === 'faq-1' && (
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  Yes! We offer phone consultations as one of our coaching formats. You can choose between phone, video call, or text-based coaching—whatever helps you feel most comfortable.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'faq-2' ? '' : 'faq-2')}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  Can I schedule a session directly?
                </span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    activeTab === 'faq-2' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {activeTab === 'faq-2' && (
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  Absolutely! You can schedule a session directly through our booking page. Simply choose your preferred coach, session type, and time that works best for you. You'll receive a confirmation email right after booking.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'faq-3' ? '' : 'faq-3')}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  What information should I include in my message?
                </span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    activeTab === 'faq-3' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {activeTab === 'faq-3' && (
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  To help us assist you better, please share your name, preferred contact method (email or phone), and a brief description of what you'd like support with. If you're interested in coaching, you can also mention your goals or areas you'd like to focus on.
                </div>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'faq-4' ? '' : 'faq-4')}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  What if I'm not satisfied?
                </span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    activeTab === 'faq-4' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {activeTab === 'faq-4' && (
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  We offer a satisfaction guarantee. If you're not completely satisfied with your initial coaching experience, we'll help you find a different coach or a different format at no additional cost.
                </div>
              )}
            </div>
          </motion.div>

          {/* Need more information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Need more information?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our support team is ready to answer any additional questions
            </p>
            <a href="/contact">
              <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                Contact
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="bg-gray-50 dark:bg-gray-800 min-h-screen flex flex-col items-center justify-center px-4 py-16">
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
