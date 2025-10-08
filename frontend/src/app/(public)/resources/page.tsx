"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download, BookOpen, Video, FileText, Headphones, Users, Calendar, ChevronRight, Search, Mail } from "lucide-react"
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

export default function ResourcesPage() {
  const [resourcesContent, setResourcesContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  // Default resources if CMS content is not available
  const defaultCategories = [
    {
      title: "Guides & Workbooks",
      description: "Comprehensive guides to help you understand and practice ACT principles",
      icon: BookOpen,
      iconName: "BookOpen",
      resources: [
        {
          title: "ACT Fundamentals Guide",
          description: "A comprehensive introduction to Acceptance and Commitment Therapy principles",
          pages: 45,
          format: "PDF",
          downloadUrl: "#"
        },
        {
          title: "Values Clarification Workbook",
          description: "Exercises to help identify and live by your core values",
          pages: 28,
          format: "PDF",
          downloadUrl: "#"
        }
      ]
    },
    {
      title: "Video Content",
      description: "Expert-led video sessions on key ACT concepts and techniques",
      icon: Video,
      iconName: "Video",
      resources: [
        {
          title: "Introduction to ACT Coaching",
          description: "Learn the basics of ACT coaching methodology",
          duration: "15 min",
          instructor: "Dr. Sarah Mitchell",
          videoUrl: "#"
        }
      ]
    },
    {
      title: "Audio Resources",
      description: "Guided meditations and audio exercises for practice",
      icon: Headphones,
      iconName: "Headphones",
      resources: [
        {
          title: "Mindfulness Audio Series",
          description: "Guided mindfulness exercises for daily practice",
          duration: "Various",
          format: "MP3",
          audioUrl: "#"
        }
      ]
    }
  ]

  const defaultFeatured = [
    {
      title: "Complete ACT Starter Kit",
      description: "Everything you need to begin your ACT journey",
      type: "Bundle",
      items: 5,
      downloadUrl: "#"
    },
    {
      title: "Weekly Mindfulness Challenge",
      description: "7-day guided mindfulness program",
      type: "Program",
      duration: "7 days",
      accessUrl: "#"
    }
  ]

  useEffect(() => {
    fetchResourcesContent()
  }, [])

  const fetchResourcesContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=resources`)
      console.log('Resources content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Resources content data:', data)
        setResourcesContent(data)
      } else {
        console.log('Failed to fetch resources content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching resources content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!resourcesContent?.content) return null

    try {
      const parsed = JSON.parse(resourcesContent.content)
      console.log('Parsed resources content:', parsed)
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
      // If CMS has custom title, check if it contains "Resources" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('resources')) {
        const parts = title.split(/resources/i)
        const match = title.match(/resources/i)
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
    return <><GradientText className="inline-block">Resources</GradientText> Library</>
  }

  const resourceCategories = cmsContent?.categories?.categories || defaultCategories
  const featuredResources = cmsContent?.featured?.resources || defaultFeatured

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
              {heroContent.description || resourcesContent?.meta_description ||
                "Access our comprehensive collection of ACT resources, guides, and tools to support your personal growth journey."}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Search resources..."
                  className="pl-12 pr-4 h-14 w-full text-lg border-gray-300 focus:border-brand-teal focus:ring-brand-teal"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.featured?.title || "Featured Resources"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hand-picked resources to get you started on your ACT journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredResources.map((resource, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-8 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-ink-dark mb-2">{resource.title}</h3>
                      <p className="text-gray-600 mb-4">{resource.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                        <span className="px-3 py-1 bg-brand-teal/10 text-brand-teal rounded-full">
                          {resource.type}
                        </span>
                        {resource.items && <span>{resource.items} items</span>}
                        {resource.duration && <span>{resource.duration}</span>}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-brand-teal hover:bg-brand-teal/90">
                    <Download className="w-4 h-4 mr-2" />
                    Access Resource
                  </Button>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.categories?.title || "Browse by Category"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our organized collection of resources by type and topic
            </p>
          </motion.div>

          <div className="space-y-16">
            {resourceCategories.map((category, categoryIndex) => {
              const IconComponent = category.iconName ?
                { BookOpen, Video, FileText, Headphones, Users, Calendar }[category.iconName] || BookOpen
                : category.icon

              return (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                >
                  <div className="text-center mb-8">
                    <IconComponent className="w-16 h-16 text-brand-teal mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-ink-dark mb-2">{category.title}</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">{category.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(category.resources || []).map((resource, resourceIndex) => (
                      <SpotlightCard key={resourceIndex} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-ink-dark">{resource.title}</h4>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{resource.description}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          {resource.pages && <span>{resource.pages} pages</span>}
                          {resource.duration && <span>{resource.duration}</span>}
                          {resource.format && <span className="px-2 py-1 bg-gray-100 rounded">{resource.format}</span>}
                        </div>

                        {resource.instructor && (
                          <p className="text-sm text-brand-teal mb-4">by {resource.instructor}</p>
                        )}

                        <Button size="sm" variant="outline" className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
                          <Download className="w-4 h-4 mr-2" />
                          Access
                        </Button>
                      </SpotlightCard>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {cmsContent?.newsletter?.title || "Stay Updated"}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {cmsContent?.newsletter?.description ||
                "Get notified when we add new resources and tools to help you on your journey."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
              />
              <Button className="bg-white text-brand-teal hover:bg-gray-50 px-8">
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}