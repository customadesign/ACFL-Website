"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Briefcase, Heart, Users, Trophy, Clock, MapPin, ChevronRight } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"
import Footer from "@/components/Footer"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import { getApiUrl } from "@/lib/api"

interface ContentData {
  id: string
  title: string
  content: string
  slug: string
  meta_description?: string
}

export default function CareersPage() {
  const [careersContent, setCareersContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCareersContent()
  }, [])

  const fetchCareersContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=careers`)
      console.log('Careers content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Careers content data:', data)
        setCareersContent(data)
      } else {
        console.log('Failed to fetch careers content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching careers content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!careersContent?.content) return null

    try {
      const parsed = JSON.parse(careersContent.content)
      console.log('Parsed careers content:', parsed)
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
      // If CMS has custom title, check if it contains "Mission" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('mission')) {
        const parts = title.split(/mission/i)
        const match = title.match(/mission/i)
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
    return <>Join Our <GradientText className="inline-block">Mission</GradientText></>
  }

  // Default positions if CMS content is not available
  const defaultPositions = [
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

  const openPositions = cmsContent?.positions || defaultPositions

  // Default benefits if CMS content is not available
  const defaultBenefits = [
    {
      icon: Heart,
      iconName: "Heart",
      title: "Mission-Driven",
      description: "Make a real difference in people's lives every single day."
    },
    {
      icon: Users,
      iconName: "Users",
      title: "Collaborative Culture",
      description: "Work with passionate professionals who support each other's growth."
    },
    {
      icon: Trophy,
      iconName: "Trophy",
      title: "Professional Growth",
      description: "Continuous learning opportunities and career development paths."
    },
    {
      icon: Clock,
      iconName: "Clock",
      title: "Work-Life Balance",
      description: "Flexible schedules and remote work options to support your wellbeing."
    }
  ]

  const benefits = cmsContent?.benefits || defaultBenefits

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
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
              {renderTitle()}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              {heroContent.description || careersContent?.meta_description ||
                "Help us transform lives through evidence-based ACT coaching. We're looking for passionate professionals who believe in the power of psychological flexibility and meaningful change."}
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
              {cmsContent?.whyJoinUs?.title || "Why Join ACT Coaching For Life?"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.whyJoinUs?.subtitle ||
                "Be part of a team that's revolutionizing mental health support through innovative coaching."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.iconName ?
                { Heart, Users, Trophy, Clock, Briefcase }[benefit.iconName] || Heart
                : benefit.icon

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <IconComponent className="w-12 h-12 text-brand-coral mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-ink-dark mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.openPositions?.title || "Open Positions"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.openPositions?.subtitle || "Find your perfect role and join our growing team"}
            </p>
          </motion.div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {openPositions.length > 0 ? (
              openPositions.map((position, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <SpotlightCard className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 mb-4 md:mb-0">
                        <h3 className="text-xl font-semibold text-ink-dark mb-2">{position.title}</h3>
                        <p className="text-gray-600 mb-3">{position.description}</p>
                        <div className="flex flex-wrap gap-3">
                          <span className="inline-flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {position.location}
                          </span>
                          <span className="inline-flex items-center text-sm text-gray-500">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {position.department}
                          </span>
                          <span className="px-3 py-1 bg-brand-teal/10 text-brand-teal text-sm rounded-full">
                            {position.type}
                          </span>
                        </div>
                      </div>
                      <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                        Apply Now
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  {cmsContent?.noPositions?.message ||
                    "No open positions at the moment. Please check back later or send us your resume."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.benefitsSection?.title || "Benefits & Perks"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.benefitsSection?.subtitle ||
                "We take care of our team so they can take care of our clients"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {(cmsContent?.benefitsSection?.items || [
              "Competitive salary and equity packages",
              "Comprehensive health, dental, and vision insurance",
              "Flexible PTO and mental health days",
              "Professional development budget",
              "Remote work flexibility",
              "Team retreats and wellness programs"
            ]).map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-teal/20 flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-brand-teal" />
                </div>
                <p className="ml-4 text-gray-700">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {cmsContent?.cta?.title || "Don't See Your Role?"}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {cmsContent?.cta?.subtitle ||
                "We're always looking for talented individuals who share our passion for mental health and coaching."}
            </p>
            <Button
              size="lg"
              className="bg-white text-brand-teal hover:bg-gray-50 text-lg px-8"
            >
              Send Us Your Resume
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}