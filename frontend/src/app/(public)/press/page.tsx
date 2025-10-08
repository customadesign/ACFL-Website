"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, ExternalLink, Calendar, Award, FileText, Mail } from "lucide-react"
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

export default function PressPage() {
  const [pressContent, setPressContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  // Default press releases if CMS content is not available
  const defaultPressReleases = [
    {
      date: "January 15, 2024",
      title: "ACT Coaching For Life Raises $10M Series A to Expand Access to Mental Health Coaching",
      excerpt: "Leading ACT-based coaching platform secures funding to democratize access to evidence-based mental health support.",
      link: "#"
    },
    {
      date: "December 1, 2023",
      title: "New Study Shows 87% Improvement in Client Outcomes Using ACT Methodology",
      excerpt: "Independent research validates the effectiveness of our personalized coaching approach.",
      link: "#"
    },
    {
      date: "October 20, 2023",
      title: "ACT Coaching For Life Partners with Major Corporations for Employee Wellness Programs",
      excerpt: "Fortune 500 companies adopt our platform to support employee mental health and wellbeing.",
      link: "#"
    }
  ]

  const defaultMediaKit = [
    { title: "Company Logos", description: "High-resolution logos in various formats", size: "2.3 MB" },
    { title: "Executive Bios", description: "Leadership team biographies and headshots", size: "1.8 MB" },
    { title: "Company Fact Sheet", description: "Key statistics and company information", size: "450 KB" },
    { title: "Product Screenshots", description: "Platform interface and feature highlights", size: "5.2 MB" }
  ]

  const defaultAwards = [
    { year: "2023", title: "Best Mental Health Platform", org: "Digital Health Awards" },
    { year: "2023", title: "Top Workplace Culture", org: "Remote Work Association" },
    { year: "2022", title: "Innovation in Therapy", org: "Psychology Today" },
    { year: "2022", title: "Fastest Growing Startup", org: "TechCrunch" }
  ]

  useEffect(() => {
    fetchPressContent()
  }, [])

  const fetchPressContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=press`)
      console.log('Press content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Press content data:', data)
        setPressContent(data)
      } else {
        console.log('Failed to fetch press content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching press content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!pressContent?.content) return null

    try {
      const parsed = JSON.parse(pressContent.content)
      console.log('Parsed press content:', parsed)
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
      // If CMS has custom title, check if it contains "Press" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('press')) {
        const parts = title.split(/press/i)
        const match = title.match(/press/i)
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
    return <><GradientText className="inline-block">Press</GradientText> Center</>
  }

  const pressReleases = cmsContent?.pressReleases?.releases || defaultPressReleases
  const mediaKit = cmsContent?.mediaKit?.items || defaultMediaKit
  const awards = cmsContent?.awards?.items || defaultAwards

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
              {heroContent.description || pressContent?.meta_description ||
                "Latest news, updates, and press releases from ACT Coaching for Life."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.pressReleases?.title || "Latest News"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay up to date with our latest announcements and developments
            </p>
          </motion.div>

          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        {release.date}
                      </div>
                      <h3 className="text-xl font-semibold text-ink-dark mb-2">{release.title}</h3>
                      <p className="text-gray-600">{release.excerpt}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                      asChild
                    >
                      <Link href={release.link}>
                        Read More
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.mediaKit?.title || "Media Kit"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.mediaKit?.description ||
                "Download our media kit for logos, bios, and company information"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mediaKit.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 text-center h-full hover:shadow-lg transition-shadow">
                  <FileText className="w-12 h-12 text-brand-teal mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-ink-dark mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <p className="text-xs text-gray-500 mb-4">{item.size}</p>
                  <Button size="sm" className="bg-brand-teal hover:bg-brand-teal/90">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.awards?.title || "Awards & Recognition"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Recognition for our commitment to excellence in mental health and coaching
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {awards.map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 text-center h-full">
                  <Award className="w-12 h-12 text-brand-orange mx-auto mb-4" />
                  <div className="text-sm text-brand-teal font-medium mb-2">{award.year}</div>
                  <h3 className="text-lg font-semibold text-ink-dark mb-2">{award.title}</h3>
                  <p className="text-gray-600 text-sm">{award.org}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Press */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Media Inquiries
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              For press inquiries, interviews, or additional information, please contact our media team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-brand-teal hover:bg-gray-50 text-lg px-8"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Press Team
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}