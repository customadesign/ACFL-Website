"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Building, Users, TrendingUp, Award, CheckCircle, ChevronRight, Mail, Phone, Calendar } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"
import CountUp from "@/components/CountUp"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import Footer from "@/components/Footer"
import { getApiUrl } from "@/lib/api"
import { CorporatePageSkeleton } from "@/components/skeletons/CorporatePageSkeleton"

interface ContentData {
  id: string
  title: string
  content: string
  slug: string
  meta_description?: string
}
// Default content - will be overridden by CMS if available
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
  const [corporateContent, setCorporateContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCorporateContent()
  }, [])

  const fetchCorporateContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=corporate-coaching`)
      console.log('Corporate coaching content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Corporate coaching content data:', data)
        setCorporateContent(data)
      } else {
        console.log('Failed to fetch corporate coaching content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching corporate coaching content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!corporateContent?.content) return null

    try {
      const parsed = JSON.parse(corporateContent.content)
      console.log('Parsed corporate coaching content:', parsed)
      return parsed
    } catch {
      return null
    }
  }

  const cmsContent = parseContent()

  // Parse hero content
  const getHeroContent = () => {
    if (!cmsContent) return { title: null, description: null }
    return {
      title: cmsContent.hero?.title || null,
      description: cmsContent.hero?.subtitle || null
    }
  }

  const heroContent = getHeroContent()

  // Smart title rendering that preserves styling
  const renderTitle = () => {
    if (heroContent.title) {
      // If CMS has custom title, check if it contains "Corporate" or "Wellness" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('corporate')) {
        const parts = title.split(/corporate/i)
        const match = title.match(/corporate/i)
        if (parts.length === 2 && match) {
          return (
            <>
              {parts[0]}
              <GradientText className="inline-block">{match[0]}</GradientText>
              {parts[1]}
            </>
          )
        }
      } else if (title.toLowerCase().includes('wellness')) {
        const parts = title.split(/wellness/i)
        const match = title.match(/wellness/i)
        if (parts.length === 2 && match) {
          return (
            <>
              {parts[0]}
              <GradientText className="inline-block">{match[0]}</GradientText>
              {parts[1]}
            </>
          )
        }
      }
      // Return CMS title as-is if no special formatting needed
      return title
    }
    // Fallback to default styled content
    return <>Corporate <GradientText className="inline-block">Wellness</GradientText> Programs</>
  }

  // Get data from CMS or use defaults
  const benefits = cmsContent?.benefits?.items || defaultBenefits
  const programs = cmsContent?.programs?.types || defaultPrograms
  const stats = cmsContent?.stats

  // Show skeleton while loading
  if (loading) {
    return (
      <>
        <nav>
          <NavbarLandingPage />
        </nav>
        <CorporatePageSkeleton />
        <Footer />
      </>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white ">
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
            transition={{ duration: 0.6 }}
            className="text-center"
          >

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-ink-dark mb-8 tracking-tight">
              {renderTitle()}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed">
              {heroContent.description || corporateContent?.meta_description ||
                "Transform your workplace culture with evidence-based ACT coaching programs designed to boost employee wellbeing, productivity, and organizational resilience."}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white px-10 py-6 text-lg font-semibold shadow-lg shadow-brand-teal/30 hover:shadow-xl hover:scale-105 transition-all duration-300">
                Schedule Demo
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" className="border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white px-10 py-6 text-lg font-semibold hover:scale-105 transition-all duration-300">
                Download Brochure
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 md:gap-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-teal to-brand-teal/70 bg-clip-text text-transparent mb-3">
                <CountUp to={stats?.companiesServed || 150} duration={2} />+
              </div>
              <div className="text-lg text-gray-600 font-medium">{stats?.companiesServedLabel || "Companies Served"}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-brand-orange mb-2">
                <CountUp to={stats?.employeesImpacted || 25000} duration={2.5} separator="," />+
              </div>
              <div className="text-gray-600">{stats?.employeesImpactedLabel || "Employees Impacted"}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-brand-leaf mb-2">
                <CountUp to={stats?.satisfactionRate || 87} duration={2.2} />%
              </div>
              <div className="text-gray-600">{stats?.satisfactionRateLabel || "Satisfaction Rate"}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-brand-coral mb-2">
                <CountUp to={stats?.reducedTurnover || 35} duration={2} />%
              </div>
              <div className="text-gray-600">{stats?.reducedTurnoverLabel || "Reduced Turnover"}</div>
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
              {cmsContent?.benefits?.title || "Why Companies Choose ACT Coaching"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.benefits?.subtitle || "Proven results that impact your bottom line and employee satisfaction"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <IconComponent className="w-12 h-12 text-brand-teal mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-ink-dark mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </motion.div>
              )
            })}
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
              {cmsContent?.programs?.title || "Our Corporate Programs"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.programs?.subtitle || "Tailored solutions for every organizational need"}
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
              {cmsContent?.process?.title || "Simple Implementation Process"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.process?.subtitle || "We make it easy to get started with your corporate wellness program"}
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
              {cmsContent?.cta?.title || "Ready to Transform Your Workplace?"}
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
              {cmsContent?.cta?.subtitle || "Let's discuss how ACT coaching can benefit your organization. Schedule a free consultation today."}
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
      <Footer />
    </div>
  )
}