"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, HelpCircle, MessageCircle, Book, CreditCard, Shield, Users, ChevronRight, Phone, Mail } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"
import { Input } from "@/components/ui/input"
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

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [helpContent, setHelpContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  // Default content in case CMS content is not available
  const defaultCategories = [
    {
      icon: Users,
      title: "Getting Started",
      description: "Learn how to create an account and find your perfect coach",
      articles: ["How to sign up", "Finding the right coach", "Your first session", "Platform overview"]
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      description: "Manage your payments and subscription plans",
      articles: ["Pricing plans", "Payment methods", "Cancel subscription", "Refund policy"]
    },
    {
      icon: MessageCircle,
      title: "Coaching Sessions",
      description: "Everything about your coaching experience",
      articles: ["Scheduling sessions", "Preparing for coaching", "Session guidelines", "Changing coaches"]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "How we protect your information",
      articles: ["Data security", "Confidentiality", "Account security", "Privacy settings"]
    },
    {
      icon: Book,
      title: "ACT Resources",
      description: "Learn more about ACT methodology",
      articles: ["What is ACT?", "Core principles", "Exercises & techniques", "Recommended reading"]
    },
    {
      icon: HelpCircle,
      title: "Troubleshooting",
      description: "Common issues and solutions",
      articles: ["Login problems", "Technical issues", "Video call quality", "Mobile app help"]
    }
  ]

  const popularArticles = [
    "How do I find the right coach for me?",
    "What should I expect in my first session?",
    "Can I change my coach if we're not a good fit?",
    "How do I cancel or reschedule a session?",
    "What's included in my subscription?",
    "Is my information kept confidential?"
  ]

  useEffect(() => {
    fetchHelpContent()
  }, [])

  const fetchHelpContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=help`)
      console.log('Help content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Help content data:', data)
        setHelpContent(data)
      } else {
        console.log('Failed to fetch help content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching help content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse categories from CMS content if available
  const parseCategories = () => {
    if (!helpContent?.content) return defaultCategories

    try {
      const parsed = JSON.parse(helpContent.content)
      console.log('Parsed help content:', parsed)
      // Check if content is structured with sections (new CMS structure)
      if (parsed.categories && parsed.categories.categories) {
        return parsed.categories.categories
      }
      // Fallback to direct categories (old structure)
      return parsed.categories || defaultCategories
    } catch {
      return defaultCategories
    }
  }

  const categories = parseCategories()

  // Map icon names to actual icon components
  const iconMap: { [key: string]: any } = {
    Users,
    CreditCard,
    MessageCircle,
    Shield,
    Book,
    HelpCircle
  }

  // Parse title and description from CMS
  const getHeroContent = () => {
    if (!helpContent?.content) return { title: null, description: null }

    try {
      const parsed = JSON.parse(helpContent.content)
      return {
        title: parsed.hero?.title || null,
        description: parsed.hero?.subtitle || null
      }
    } catch {
      return { title: null, description: null }
    }
  }

  const heroContent = getHeroContent()

  // Parse contact support section from CMS
  const getContactContent = () => {
    if (!helpContent?.content) return null

    try {
      const parsed = JSON.parse(helpContent.content)
      return parsed.contact || null
    } catch {
      return null
    }
  }

  const contactContent = getContactContent()

  // Smart title rendering that preserves styling
  const renderTitle = () => {
    if (heroContent.title) {
      // If CMS has custom title, check if it contains "Help" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('help')) {
        const parts = title.split(/help/i)
        const helpMatch = title.match(/help/i)
        if (parts.length === 2 && helpMatch) {
          return (
            <>
              {parts[0]}
              <GradientText className="inline-block">{helpMatch[0]}</GradientText>
              {parts[1]}
            </>
          )
        }
      }
      // Return CMS title as-is if no special formatting needed
      return title
    }
    // Fallback to default styled content
    return <>How Can We <GradientText className="inline-block">Help You?</GradientText></>
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="py-24 md:py-32 lg:py-40 bg-white my-28 mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink-dark mb-8">
              {renderTitle()}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
              {heroContent.description || helpContent?.meta_description || "Find answers to your questions and get the support you need for your coaching journey."}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 w-full text-lg border-gray-300 focus:border-brand-teal focus:ring-brand-teal"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-ink-dark mb-6">Popular Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularArticles.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <Link
                    href="#"
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-teal/30 bg-gradient-to-br from-white to-gray-50/50 group cursor-pointer"
                  >
                    <span className="text-gray-700 group-hover:text-brand-teal transition-colors">
                      {article}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-teal group-hover:translate-x-1 transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-ink-dark mb-4">Browse by Category</h2>
            <p className="text-xl text-gray-600">Find help organized by topic</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              // Get the icon component from the map, or use the direct component if it's already a component
              const IconComponent = typeof category.icon === 'string'
                ? iconMap[category.icon] || HelpCircle
                : category.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <SpotlightCard className="h-full p-6 hover:shadow-lg transition-shadow">
                    <IconComponent className="w-10 h-10 text-brand-teal mb-4" />
                  <h3 className="text-xl font-semibold text-ink-dark mb-2">{category.title}</h3>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.articles.map((article, idx) => (
                      <li key={idx}>
                        <Link
                          href="#"
                          className="text-sm text-gray-500 hover:text-brand-teal transition-colors flex items-center"
                        >
                          <span className="mr-2">•</span>
                          {article}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    className="mt-4 text-brand-teal hover:text-brand-teal/80"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </SpotlightCard>
              </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {contactContent?.title || "Still Need Help?"}
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
              {contactContent?.subtitle || "Our support team is here to assist you with any questions or concerns."}
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {contactContent?.liveChat?.title || "Live Chat"}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {contactContent?.liveChat?.description || "Chat with our support team"}
                </p>
                <Button className="bg-white text-brand-teal hover:bg-gray-50">
                  {contactContent?.liveChat?.buttonText || "Start Chat"}
                </Button>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {contactContent?.email?.title || "Email Support"}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {contactContent?.email?.description || "We'll respond within 24 hours"}
                </p>
                <a
                  href={`mailto:${contactContent?.email?.address || "support@actcoachingforlife.com"}`}
                  className="text-white underline hover:text-white/80"
                >
                  {contactContent?.email?.address || "support@actcoachingforlife.com"}
                </a>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {contactContent?.phone?.title || "Phone Support"}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {contactContent?.phone?.hours || "Mon-Fri 9am-6pm EST"}
                </p>
                <a
                  href={`tel:${contactContent?.phone?.number || "1-800-228-4357"}`}
                  className="text-white underline hover:text-white/80"
                >
                  {contactContent?.phone?.displayNumber || "1-800-ACT-HELP"}
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