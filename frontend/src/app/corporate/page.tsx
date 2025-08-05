"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Building, Users, TrendingUp, Award, CheckCircle, ChevronRight, Mail, Phone, Calendar } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"
import CountUp from "@/components/CountUp"

const benefits = [
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

const programs = [
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
              <Link href="/corporate" className="text-brand-teal font-semibold">Corporate</Link>
              <Link href="/group-coaching" className="text-gray-700 hover:text-brand-teal transition-colors">Group Coaching</Link>
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
              Corporate <GradientText className="inline-block">Wellness</GradientText> Programs
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your workplace culture with evidence-based ACT coaching programs designed to boost 
              employee wellbeing, productivity, and organizational resilience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-4 text-lg">
                Schedule Demo
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white px-8 py-4 text-lg">
                Download Brochure
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-4xl font-bold text-brand-teal mb-2">
                <CountUp to={150} duration={2} />+
              </div>
              <div className="text-gray-600">Companies Served</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-brand-orange mb-2">
                <CountUp to={25000} duration={2.5} separator="," />+
              </div>
              <div className="text-gray-600">Employees Impacted</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-brand-leaf mb-2">
                <CountUp to={87} duration={2.2} />%
              </div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-brand-coral mb-2">
                <CountUp to={35} duration={2} />%
              </div>
              <div className="text-gray-600">Reduced Turnover</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Why Companies Choose ACT Coaching
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proven results that impact your bottom line and employee satisfaction
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <benefit.icon className="w-12 h-12 text-brand-teal mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-ink-dark mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Our Corporate Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored solutions for every organizational need
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="h-full p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold text-ink-dark mb-3">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <div className="mb-4">
                    <h4 className="font-semibold text-ink-dark mb-2">What's Included:</h4>
                    <ul className="space-y-1">
                      {program.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-brand-teal mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-sm text-gray-500">
                    Duration: {program.duration}
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Simple Implementation Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make it easy to get started with your corporate wellness program
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Discovery Call", description: "We learn about your organization's needs and challenges" },
              { step: "2", title: "Custom Proposal", description: "Receive a tailored program designed for your company" },
              { step: "3", title: "Launch & Training", description: "Seamless rollout with comprehensive team training" },
              { step: "4", title: "Ongoing Support", description: "Continuous coaching and program optimization" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-brand-teal rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-ink-dark mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Workplace?
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
              Let's discuss how ACT coaching can benefit your organization. Schedule a free consultation today.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Schedule Demo</h3>
                <p className="text-white/80 text-sm mb-4">See our platform in action</p>
                <Button className="bg-white text-brand-teal hover:bg-gray-50">
                  Book Call
                </Button>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
                <p className="text-white/80 text-sm mb-4">Get detailed information</p>
                <a href="mailto:corporate@actcoachingforlife.com" className="text-white underline hover:text-white/80">
                  corporate@actcoachingforlife.com
                </a>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Call Us</h3>
                <p className="text-white/80 text-sm mb-4">Speak with our team</p>
                <a href="tel:1-800-228-4357" className="text-white underline hover:text-white/80">
                  1-800-ACT-HELP
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}