"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Clock, User, Calendar, ArrowRight, BookOpen, Users, Heart, Brain, Star } from "lucide-react"
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

export default function BlogPage() {
  const [blogContent, setBlogContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  // Default blog posts if CMS content is not available
  const defaultFeaturedPosts = [
    {
      title: "Understanding the Six Core Processes of ACT",
      excerpt: "Dive deep into the fundamental processes that make ACT such an effective therapeutic approach for lasting change.",
      author: "Dr. Sarah Mitchell",
      date: "March 15, 2024",
      category: "ACT Fundamentals",
      readTime: "8 min read",
      image: "/blog/act-processes.jpg",
      featured: true
    },
    {
      title: "Mindfulness in Daily Life: Practical Exercises",
      excerpt: "Learn simple yet powerful mindfulness techniques you can integrate into your everyday routine.",
      author: "Michael Chen",
      date: "March 12, 2024",
      category: "Mindfulness",
      readTime: "6 min read",
      image: "/blog/mindfulness-daily.jpg"
    }
  ]

  const defaultRecentPosts = [
    {
      title: "Values-Based Living: Your Compass for Life Decisions",
      excerpt: "How to identify your core values and use them to guide important life choices and daily actions.",
      author: "Dr. Emily Rodriguez",
      date: "March 10, 2024",
      category: "Values & Purpose",
      readTime: "7 min read"
    },
    {
      title: "Cognitive Defusion: Changing Your Relationship with Thoughts",
      excerpt: "Practical strategies to create distance from unhelpful thoughts and reduce their impact on your life.",
      author: "James Wilson",
      date: "March 8, 2024",
      category: "Cognitive Flexibility",
      readTime: "5 min read"
    },
    {
      title: "The Science Behind ACT: Research and Evidence",
      excerpt: "Exploring the extensive research that supports ACT as an evidence-based therapeutic approach.",
      author: "Dr. Lisa Park",
      date: "March 5, 2024",
      category: "Research & Science",
      readTime: "10 min read"
    }
  ]

  const defaultCategories = [
    { name: "ACT Fundamentals", count: 12, color: "bg-brand-teal", icon: Brain },
    { name: "Mindfulness", count: 8, color: "bg-brand-orange", icon: Heart },
    { name: "Values & Purpose", count: 6, color: "bg-brand-purple", icon: Star },
    { name: "Research & Science", count: 4, color: "bg-brand-coral", icon: BookOpen },
    { name: "Client Stories", count: 10, color: "bg-brand-leaf", icon: Users }
  ]

  useEffect(() => {
    fetchBlogContent()
  }, [])

  const fetchBlogContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=blog`)
      console.log('Blog content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Blog content data:', data)
        setBlogContent(data)
      } else {
        console.log('Failed to fetch blog content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching blog content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!blogContent?.content) return null

    try {
      const parsed = JSON.parse(blogContent.content)
      console.log('Parsed blog content:', parsed)
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
      // If CMS has custom title, check if it contains "Blog" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('blog')) {
        const parts = title.split(/blog/i)
        const match = title.match(/blog/i)
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
    return <>Our <GradientText className="inline-block">Blog</GradientText></>
  }

  const featuredPosts = cmsContent?.featured?.posts || defaultFeaturedPosts
  const recentPosts = cmsContent?.recentPosts?.posts || defaultRecentPosts
  const blogCategories = cmsContent?.categories?.categories || defaultCategories

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
              {heroContent.description || blogContent?.meta_description ||
                "Insights, tips, and stories from our coaching community to support your journey toward psychological flexibility."}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-12 pr-4 h-14 w-full text-lg border-gray-300 focus:border-brand-teal focus:ring-brand-teal"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.featured?.title || "Featured Articles"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our most popular and insightful content to help you on your journey
            </p>
          </motion.div>

          {featuredPosts.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Main Featured Post */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-1"
              >
                <SpotlightCard className="p-0 overflow-hidden hover:shadow-xl transition-shadow">
                  {featuredPosts[0].image && (
                    <div className="h-48 bg-gradient-to-br from-brand-teal to-brand-orange" />
                  )}
                  <div className="p-6">
                    <Badge className="mb-3 bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20">
                      {featuredPosts[0].category}
                    </Badge>
                    <h3 className="text-2xl font-bold text-ink-dark mb-3 leading-tight">
                      {featuredPosts[0].title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{featuredPosts[0].excerpt}</p>

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <User className="w-4 h-4 mr-2" />
                      <span className="mr-4">{featuredPosts[0].author}</span>
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="mr-4">{featuredPosts[0].date}</span>
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{featuredPosts[0].readTime}</span>
                    </div>

                    <Button className="bg-brand-teal hover:bg-brand-teal/90">
                      Read Article
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </SpotlightCard>
              </motion.div>

              {/* Secondary Featured Posts */}
              <div className="space-y-4">
                {featuredPosts.slice(1, 3).map((post: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <SpotlightCard className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-ink-dark mb-2 leading-tight">
                        {post.title}
                      </h4>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{post.author}</span>
                        <span className="mx-2">•</span>
                        <span>{post.date}</span>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-ink-dark mb-6">
              {cmsContent?.categories?.title || "Explore by Topic"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse articles by category to find content most relevant to your interests
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {blogCategories.map((category: any, index: number) => {
              const IconComponent = category.icon || BookOpen

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <SpotlightCard className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <div className={`w-12 h-12 ${category.color || 'bg-brand-teal'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-ink-dark mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.count} articles</p>
                  </SpotlightCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-ink-dark mb-6">
              {cmsContent?.recentPosts?.title || "Latest Posts"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay up to date with our newest insights and resources
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className="bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-ink-dark mb-3 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 flex-1">{post.excerpt}</p>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <User className="w-4 h-4 mr-2" />
                    <span className="mr-4">{post.author}</span>
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{post.date}</span>
                  </div>

                  <Button variant="outline" className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-brand-teal hover:bg-brand-teal/90">
              View All Posts
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Never Miss an Update
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest insights delivered directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
              />
              <Button className="bg-white text-brand-teal hover:bg-gray-50 px-8">
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