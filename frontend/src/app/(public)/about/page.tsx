"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Logo from "@/components/Logo"
import GradientText from "@/components/GradientText"
import CountUp from "@/components/CountUp"
import SpotlightCard from "@/components/SpotlightCard"
import ShinyText from "@/components/ShinyText"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import Footer from "@/components/Footer"
import { getApiUrl } from "@/lib/api"
import {
  Heart,
  Users,
  Target,
  Shield,
  Award,
  Lightbulb,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  Star,
  Brain,
  Compass,
  Zap
} from "lucide-react"

interface ContentData {
  id: string
  title: string
  content: string
  slug: string
  meta_description?: string
}

export default function AboutPage() {
  const [aboutContent, setAboutContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutContent()
  }, [])

  const fetchAboutContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=about`)
      console.log('About content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('About content data:', data)
        setAboutContent(data)
      } else {
        console.log('Failed to fetch about content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching about content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!aboutContent?.content) return null

    try {
      const parsed = JSON.parse(aboutContent.content)
      console.log('Parsed about content:', parsed)
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
      // If CMS has custom title, check if it contains "ACT" or "Coaching" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('act coaching')) {
        const parts = title.split(/act coaching/i)
        const match = title.match(/act coaching/i)
        if (parts.length === 2 && match) {
          return (
            <>
              {parts[0]}
              <GradientText className="inline-block">{match[0]}</GradientText>
              {parts[1]}
            </>
          )
        }
      } else if (title.toLowerCase().includes('act')) {
        const parts = title.split(/act/i)
        const match = title.match(/act/i)
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
    return <>About <GradientText className="inline-block">ACT Coaching</GradientText> for Life</>
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
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
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-ink-dark mb-8 tracking-tight">
              {renderTitle()}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed">
              {heroContent.description || aboutContent?.meta_description ||
                "We're transforming lives through evidence-based Acceptance and Commitment Therapy coaching, helping people create meaningful change and live authentically."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
                {cmsContent?.mission?.title || "Our Mission"}
              </h2>
              <div className="prose prose-lg text-gray-600 mb-8">
                {cmsContent?.mission?.content ? (
                  <div dangerouslySetInnerHTML={{ __html: cmsContent.mission.content }} />
                ) : (
                  <>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      At ACT Coaching for Life, we believe everyone deserves to live a life aligned with their values.
                      Our mission is to make professional, evidence-based coaching accessible to anyone seeking
                      meaningful change.
                    </p>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                      Through our innovative matching platform, we connect you with qualified ACT coaches who
                      understand your unique challenges and can guide you toward psychological flexibility,
                      resilience, and authentic living.
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <Heart className="w-8 h-8 text-brand-coral" />
                </motion.div>
                <span className="text-lg font-semibold text-ink-dark">
                  {cmsContent?.mission?.tagline || "Compassionate, evidence-based care"}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard className="p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-teal/30 bg-gradient-to-br from-white to-gray-50/50">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-teal mb-2">
                      <CountUp to={cmsContent?.stats?.livesChanged || 3000} duration={2.5} separator="," />+
                    </div>
                    <div className="text-gray-600">Lives Changed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-orange mb-2">
                      <CountUp to={cmsContent?.stats?.certifiedCoaches || 150} duration={2.5} separator="," />+
                    </div>
                    <div className="text-gray-600">Certified Coaches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-purple mb-2">
                      <CountUp to={cmsContent?.stats?.satisfaction || 98} duration={2.5} />%
                    </div>
                    <div className="text-gray-600">Satisfaction Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-coral mb-2">
                      <CountUp to={cmsContent?.stats?.countries || 25} duration={2.5} />+
                    </div>
                    <div className="text-gray-600">Countries</div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              {cmsContent?.values?.title || "Our Core Values"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.values?.subtitle || "These principles guide everything we do"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(cmsContent?.values?.items || [
              {
                icon: Brain,
                title: "Evidence-Based",
                description: "Rooted in psychological science and research"
              },
              {
                icon: Heart,
                title: "Compassionate",
                description: "Creating a safe, non-judgmental space for growth"
              },
              {
                icon: Users,
                title: "Accessible",
                description: "Making quality coaching available to everyone"
              },
              {
                icon: Target,
                title: "Action-Oriented",
                description: "Focusing on practical steps toward your goals"
              }
            ]).map((value: any, index: number) => {
              const iconMap: { [key: string]: any } = { Brain, Heart, Users, Target, Shield, Award, Lightbulb, Compass, Zap }
              const IconComponent = value.iconName ?
                iconMap[value.iconName] || Brain
                : value.icon

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-teal/30 group cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                      >
                        <IconComponent className="w-12 h-12 text-brand-teal mx-auto mb-4 group-hover:text-brand-orange transition-colors duration-300" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-ink-dark mb-2">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-8 text-center">
              {cmsContent?.story?.title || "Our Story"}
            </h2>

            <div className="prose prose-lg text-gray-600 mx-auto">
              {cmsContent?.story?.content ? (
                <div dangerouslySetInnerHTML={{ __html: cmsContent.story.content }} />
              ) : (
                <>
                  <p className="mb-6">
                    ACT Coaching for Life was founded with a simple yet powerful vision: to bridge the gap
                    between those seeking personal growth and qualified ACT practitioners who could guide them.
                  </p>
                  <p className="mb-6">
                    We recognized that while Acceptance and Commitment Therapy has helped millions worldwide,
                    finding the right coach remained a challenge. Our platform was created to solve this problem
                    by using intelligent matching technology to connect you with coaches who truly understand
                    your unique needs.
                  </p>
                  <p>
                    Today, we're proud to be the leading platform for ACT coaching, with a growing community
                    of certified coaches and thousands of success stories from people who've transformed their
                    lives through our service.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              {cmsContent?.team?.title || "Meet Our Leadership"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.team?.subtitle || "Dedicated professionals committed to your growth"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {(cmsContent?.team?.members || [
              {
                name: "Dr. Sarah Chen",
                role: "Founder & CEO",
                description: "Clinical psychologist with 15+ years in ACT therapy"
              },
              {
                name: "Michael Rodriguez",
                role: "Head of Coaching",
                description: "Certified ACT trainer and master coach"
              },
              {
                name: "Emily Thompson",
                role: "Chief Technology Officer",
                description: "Building technology that connects and empowers"
              }
            ]).map((member: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 text-center h-full shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-teal/30 bg-gradient-to-br from-white to-gray-50/50">
                  <div className="w-24 h-24 bg-gradient-to-br from-brand-teal to-brand-orange rounded-full mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-ink-dark mb-1">{member.name}</h3>
                  <p className="text-brand-teal font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.description}</p>
                </SpotlightCard>
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
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
              Join thousands who've discovered a more meaningful life through ACT coaching.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-white text-brand-teal hover:bg-gray-50 text-lg px-10 py-6 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  Find Your Coach
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-6 font-semibold shadow-lg transition-all duration-300"
                >
                  Become a Coach
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}