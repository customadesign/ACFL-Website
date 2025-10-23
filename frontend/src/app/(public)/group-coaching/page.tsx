"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Users, Clock, Calendar, ChevronRight, Heart, Target, Brain, Compass, CheckCircle, Star } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"
import CountUp from "@/components/CountUp"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import Footer from "@/components/Footer"
import { getApiUrl } from "@/lib/api"

interface ContentData {
  id: string
  title: string
  content: string
  slug: string
  meta_description?: string
}

// Default content - will be overridden by CMS if available
const defaultGroupTypes = [
  {
    title: "Anxiety & Stress Management",
    description: "Learn ACT techniques to manage anxiety and build resilience in a supportive group environment",
    duration: "8 weeks",
    size: "6-8 participants",
    schedule: "Weekly, 90 minutes",
    focus: ["Mindfulness practices", "Cognitive defusion", "Values clarification", "Stress reduction techniques"]
  },
  {
    title: "Values-Based Living",
    description: "Discover your core values and learn to live authentically with like-minded individuals",
    duration: "6 weeks", 
    size: "8-10 participants",
    schedule: "Weekly, 75 minutes",
    focus: ["Values exploration", "Goal setting", "Behavioral activation", "Life direction planning"]
  },
  {
    title: "Workplace Wellness",
    description: "Professional development group focused on psychological flexibility in work environments",
    duration: "10 weeks",
    size: "10-12 participants", 
    schedule: "Weekly, 60 minutes",
    focus: ["Work-life balance", "Professional boundaries", "Career satisfaction", "Team dynamics"]
  },
  {
    title: "Relationship & Communication",
    description: "Improve relationships through ACT principles and enhanced communication skills",
    duration: "8 weeks",
    size: "6-8 participants",
    schedule: "Weekly, 90 minutes", 
    focus: ["Active listening", "Conflict resolution", "Emotional regulation", "Intimacy building"]
  }
]

const defaultBenefits = [
  {
    icon: Users,
    title: "Peer Support",
    description: "Connect with others on similar journeys and build lasting supportive relationships"
  },
  {
    icon: Target,
    title: "Shared Learning",
    description: "Learn from diverse perspectives and experiences within the group setting"
  },
  {
    icon: Heart,
    title: "Cost Effective",
    description: "Access high-quality ACT coaching at a more affordable rate than individual sessions"
  },
  {
    icon: Brain,
    title: "Group Dynamics",
    description: "Benefit from group accountability and motivation to achieve your goals"
  }
]

const defaultUpcomingGroups = [
  {
    title: "Anxiety & Stress Management",
    startDate: "February 12, 2024",
    time: "7:00 PM EST",
    spotsLeft: 3,
    coach: "Dr. Sarah Mitchell"
  },
  {
    title: "Values-Based Living",
    startDate: "February 19, 2024", 
    time: "6:30 PM EST",
    spotsLeft: 5,
    coach: "Michael Chen"
  },
  {
    title: "Workplace Wellness",
    startDate: "February 26, 2024",
    time: "12:00 PM EST",
    spotsLeft: 2,
    coach: "Dr. Emily Rodriguez"
  },
  {
    title: "Relationship & Communication",
    startDate: "March 5, 2024",
    time: "7:30 PM EST", 
    spotsLeft: 4,
    coach: "James Thompson"
  }
]

export default function GroupCoachingPage() {
  const [groupContent, setGroupContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroupContent()
  }, [])

  const fetchGroupContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=group-coaching`)
      console.log('Group coaching content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Group coaching content data:', data)
        setGroupContent(data)
      } else {
        console.log('Failed to fetch group coaching content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching group coaching content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!groupContent?.content) return null

    try {
      const parsed = JSON.parse(groupContent.content)
      console.log('Parsed group coaching content:', parsed)
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
      // If CMS has custom title, check if it contains "Group" or "Coaching" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('coaching')) {
        const parts = title.split(/coaching/i)
        const match = title.match(/coaching/i)
        if (parts.length === 2 && match) {
          return (
            <>
              {parts[0]}
              <GradientText className="inline-block">{match[0]}</GradientText>
              {parts[1]}
            </>
          )
        }
      } else if (title.toLowerCase().includes('group')) {
        const parts = title.split(/group/i)
        const match = title.match(/group/i)
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
    return <>Group <GradientText className="inline-block">Coaching</GradientText> Programs</>
  }

  // Get data from CMS or use defaults
  const groupTypes = cmsContent?.programs?.types || defaultGroupTypes
  const benefits = cmsContent?.benefits?.items || defaultBenefits
  const upcomingGroups = cmsContent?.upcoming?.groups || defaultUpcomingGroups
  const stats = cmsContent?.stats

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
              {heroContent.description || groupContent?.meta_description ||
                "Experience the power of ACT coaching in a supportive group setting. Connect with others, share experiences, and grow together on your journey to psychological flexibility."}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white px-10 py-6 text-lg font-semibold shadow-lg shadow-brand-teal/30 hover:shadow-xl transition-all duration-300 group">
                  View Available Groups
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white px-10 py-6 text-lg font-semibold shadow-lg transition-all duration-300">
                  Learn More
                </Button>
              </motion.div>
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
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-teal to-brand-teal/80 bg-clip-text text-transparent mb-3">
                <CountUp to={stats?.groupsCompleted || 200} duration={2} />+
              </div>
              <div className="text-lg text-gray-600 font-medium">{stats?.groupsCompletedLabel || "Groups Completed"}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-orange to-brand-orange/80 bg-clip-text text-transparent mb-3">
                <CountUp to={stats?.participants || 1800} duration={2.5} separator="," />+
              </div>
              <div className="text-lg text-gray-600 font-medium">{stats?.participantsLabel || "Participants"}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-leaf to-brand-leaf/80 bg-clip-text text-transparent mb-3">
                <CountUp to={stats?.completionRate || 92} duration={2.2} />%
              </div>
              <div className="text-lg text-gray-600 font-medium">{stats?.completionRateLabel || "Completion Rate"}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-coral to-brand-coral/80 bg-clip-text text-transparent mb-3">
                <CountUp to={stats?.averageRating || 4.9} duration={2} />/<CountUp to={5} duration={1.5} />
              </div>
              <div className="text-lg text-gray-600 font-medium">{stats?.averageRatingLabel || "Average Rating"}</div>
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
              {cmsContent?.benefits?.title || "Why Choose Group Coaching?"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.benefits?.subtitle || "Discover the unique advantages of learning and growing with others"}
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
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center group cursor-pointer p-6 rounded-xl hover:bg-gradient-to-br hover:from-brand-teal/5 hover:to-transparent transition-colors duration-300"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <IconComponent className="w-12 h-12 text-brand-teal mx-auto mb-4 group-hover:text-brand-orange transition-colors duration-300" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-ink-dark mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Group Types Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.programs?.title || "Our Group Programs"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.programs?.subtitle || "Specialized groups designed for different needs and goals"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {groupTypes.map((group, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="h-full p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-teal/30 bg-gradient-to-br from-white to-gray-50/50 group">
                  <h3 className="text-xl font-semibold text-ink-dark mb-3">{group.title}</h3>
                  <p className="text-gray-600 mb-4">{group.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {group.duration}
                      </span>
                    </div>
                    <div>
                      <span className="flex items-center text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {group.size}
                      </span>
                    </div>
                    <div>
                      <span className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {group.schedule}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-ink-dark mb-2">Focus Areas:</h4>
                    <ul className="space-y-1">
                      {group.focus.map((item, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-brand-teal mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Groups */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              {cmsContent?.upcoming?.title || "Upcoming Groups"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {cmsContent?.upcoming?.subtitle || "Join one of our upcoming group coaching sessions"}
            </p>
          </motion.div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {upcomingGroups.map((group, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ x: 8, transition: { duration: 0.3 } }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-teal/30 bg-gradient-to-br from-white to-gray-50/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-xl font-semibold text-ink-dark mb-2">{group.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {group.startDate}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {group.time}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Coach: {group.coach}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          group.spotsLeft <= 2 
                            ? 'bg-red-100 text-red-800' 
                            : group.spotsLeft <= 5 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {group.spotsLeft} spots left
                        </span>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white shadow-lg shadow-brand-teal/30 hover:shadow-xl transition-all duration-300 group">
                        Join Group
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </motion.div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SpotlightCard className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl text-gray-700 mb-6 italic">
                "The group coaching experience was transformative. Not only did I learn valuable ACT techniques, 
                but I also formed meaningful connections with others who understood my journey. The support and 
                accountability from the group made all the difference."
              </blockquote>
              <div className="flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face&auto=format&q=80"
                  alt="Jennifer W."
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="text-left">
                  <div className="font-semibold text-ink-dark">Jennifer W.</div>
                  <div className="text-sm text-gray-600">Anxiety & Stress Management Group</div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-teal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {cmsContent?.cta?.title || "Ready to Join a Supportive Community?"}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {cmsContent?.cta?.subtitle || "Experience the power of group learning and support. Find your group and start your journey today."}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-white text-brand-teal hover:bg-gray-50 px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  View Available Groups
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-brand-teal px-10 py-6 text-lg font-semibold shadow-lg transition-all duration-300">
                  Ask a Question
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