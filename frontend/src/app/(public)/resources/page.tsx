"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Download, BookOpen, Video, FileText, Headphones, Users, Calendar, ChevronRight } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"

const resources = {
  guides: [
    {
      title: "ACT Fundamentals Guide",
      description: "A comprehensive introduction to Acceptance and Commitment Therapy principles",
      pages: 45,
      format: "PDF",
      icon: BookOpen
    },
    {
      title: "Values Clarification Workbook",
      description: "Exercises to help identify and live by your core values",
      pages: 28,
      format: "PDF",
      icon: FileText
    },
    {
      title: "Mindfulness Exercises Collection",
      description: "30+ guided mindfulness practices for daily use",
      pages: 60,
      format: "PDF",
      icon: BookOpen
    },
    {
      title: "Cognitive Defusion Techniques",
      description: "Practical strategies for managing difficult thoughts",
      pages: 35,
      format: "PDF",
      icon: FileText
    }
  ],
  videos: [
    {
      title: "Introduction to ACT Coaching",
      duration: "15 min",
      instructor: "Dr. Sarah Mitchell"
    },
    {
      title: "Mindfulness in Daily Life",
      duration: "20 min",
      instructor: "Michael Chen"
    },
    {
      title: "Working with Difficult Emotions",
      duration: "25 min",
      instructor: "Dr. Emily Rodriguez"
    },
    {
      title: "Building Psychological Flexibility",
      duration: "30 min",
      instructor: "James Thompson"
    }
  ],
  podcasts: [
    {
      title: "Living ACT: Weekly Insights",
      episodes: 52,
      duration: "30-45 min"
    },
    {
      title: "Mindful Conversations",
      episodes: 24,
      duration: "20-30 min"
    },
    {
      title: "Success Stories",
      episodes: 36,
      duration: "25-35 min"
    }
  ],
  workshops: [
    {
      title: "ACT Foundations Workshop",
      date: "February 15, 2024",
      duration: "2 hours",
      type: "Live Online"
    },
    {
      title: "Values & Committed Action",
      date: "February 22, 2024",
      duration: "90 min",
      type: "Live Online"
    },
    {
      title: "Mindfulness Intensive",
      date: "March 1, 2024",
      duration: "3 hours",
      type: "Live Online"
    }
  ]
}

export default function ResourcesPage() {
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
              <Link href="/blog" className="text-gray-700 hover:text-brand-teal transition-colors">Blog</Link>
              <Link href="/resources" className="text-brand-teal font-semibold">Resources</Link>
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
              ACT <GradientText className="inline-block">Resources</GradientText>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Free guides, videos, and tools to support your journey toward psychological flexibility and wellbeing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Downloadable Guides */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              Downloadable Guides
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive resources to deepen your understanding of ACT
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {resources.guides.map((guide, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="h-full p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <guide.icon className="w-10 h-10 text-brand-teal flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-ink-dark mb-2">{guide.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{guide.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {guide.pages} pages • {guide.format}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-brand-teal hover:text-brand-teal/80"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Library */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              Video Library
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn from our expert coaches through guided video sessions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.videos.map((video, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-brand-teal to-brand-orange flex items-center justify-center">
                    <Video className="w-12 h-12 text-white" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-ink-dark mb-1">{video.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{video.instructor}</p>
                    <p className="text-xs text-gray-500">{video.duration}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Podcasts */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              Podcasts
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Listen and learn on the go with our curated podcast series
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {resources.podcasts.map((podcast, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Headphones className="w-12 h-12 text-brand-orange mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-ink-dark mb-2">{podcast.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {podcast.episodes} episodes • {podcast.duration} each
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                  >
                    Listen Now
                  </Button>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshops */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4">
              Upcoming Workshops
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our live online workshops for deeper learning experiences
            </p>
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {resources.workshops.map((workshop, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-xl font-semibold text-ink-dark mb-2">{workshop.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {workshop.date}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {workshop.type}
                        </span>
                        <span>{workshop.duration}</span>
                      </div>
                    </div>
                    <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                      Register
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
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
              Ready for Personalized Support?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              While these resources are helpful, nothing beats working with a coach who understands your unique journey.
            </p>
            <Link href="/#quick-assessment">
              <Button className="bg-white text-brand-teal hover:bg-gray-50 px-8 py-4 text-lg">
                Find Your Coach
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}