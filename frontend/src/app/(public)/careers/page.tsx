"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Briefcase, Heart, Users, Trophy, Clock, MapPin, ChevronRight } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"

const openPositions = [
  {
    title: "Senior ACT Coach",
    location: "Remote",
    type: "Full-time",
    department: "Coaching",
    description: "Lead individual and group coaching sessions using ACT methodology."
  },
  {
    title: "Clinical Psychologist",
    location: "Remote / Hybrid",
    type: "Full-time",
    department: "Clinical",
    description: "Provide expert psychological guidance and support our coaching framework."
  },
  {
    title: "Customer Success Manager",
    location: "Remote",
    type: "Full-time",
    department: "Operations",
    description: "Ensure client satisfaction and successful coaching outcomes."
  },
  {
    title: "Content Marketing Specialist",
    location: "Remote",
    type: "Contract",
    department: "Marketing",
    description: "Create engaging content about ACT therapy and personal growth."
  }
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Logo size={32} />
              <span className="text-xl font-bold text-ink-dark">ACT Coaching For Life</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-brand-teal transition-colors">Home</Link>
              <Link href="/about" className="text-gray-700 hover:text-brand-teal transition-colors">About</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-brand-teal transition-colors">Pricing</Link>
              <Link href="/careers" className="text-brand-teal font-semibold">Careers</Link>
              <Link href="/#quick-assessment">
                <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                  Find a Coach
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link 
              href="/" 
              className="inline-flex items-center text-brand-teal hover:text-brand-teal/80 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl lg:text-6xl font-bold text-ink-dark mb-6">
              Join Our <GradientText className="inline-block">Mission</GradientText>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Help us transform lives through evidence-based ACT coaching. We're looking for passionate 
              professionals who believe in the power of psychological flexibility and meaningful change.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Why Join ACT Coaching For Life?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Be part of a team that's revolutionizing mental health support through innovative coaching.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Heart className="w-12 h-12 text-brand-coral mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Mission-Driven</h3>
              <p className="text-gray-600 text-sm">
                Make a real difference in people's lives every single day.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <Users className="w-12 h-12 text-brand-teal mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Collaborative Culture</h3>
              <p className="text-gray-600 text-sm">
                Work with passionate professionals who support each other's growth.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <Trophy className="w-12 h-12 text-brand-orange mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Professional Growth</h3>
              <p className="text-gray-600 text-sm">
                Continuous learning opportunities and career development paths.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <Clock className="w-12 h-12 text-brand-leaf mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Work-Life Balance</h3>
              <p className="text-gray-600 text-sm">
                Flexible schedules and remote work options to support your wellbeing.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find your perfect role and start making an impact today.
            </p>
          </motion.div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-xl font-semibold text-ink-dark mb-2">{position.title}</h3>
                      <p className="text-gray-600 mb-3">{position.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {position.location}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {position.type}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {position.department}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                    >
                      Apply Now
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Benefits & Perks
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We take care of our team so they can take care of our clients.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Health & Wellness", items: ["Comprehensive health insurance", "Mental health support", "Gym membership reimbursement"] },
              { title: "Time Off", items: ["Unlimited PTO", "Paid parental leave", "Sabbatical opportunities"] },
              { title: "Professional Development", items: ["Annual learning budget", "Conference attendance", "ACT certification support"] },
              { title: "Financial Benefits", items: ["Competitive salary", "Equity options", "401(k) matching"] },
              { title: "Work Flexibility", items: ["Remote work options", "Flexible hours", "Work from anywhere days"] },
              { title: "Team Culture", items: ["Monthly team events", "Annual retreats", "Employee resource groups"] }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="h-full p-6">
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">{benefit.title}</h3>
                  <ul className="space-y-2">
                    {benefit.items.map((item, idx) => (
                      <li key={idx} className="flex items-start text-gray-600">
                        <span className="text-brand-teal mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join our team and help create a world where everyone has access to transformative coaching.
            </p>
            <Button className="bg-white text-brand-teal hover:bg-gray-50 px-8 py-4 text-lg">
              View All Openings
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}