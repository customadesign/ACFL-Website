"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Download, ExternalLink, Calendar, Award, FileText, Mail } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"

const pressReleases = [
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

const mediaKit = [
  { title: "Company Logos", description: "High-resolution logos in various formats", size: "2.3 MB" },
  { title: "Executive Bios", description: "Leadership team biographies and headshots", size: "1.8 MB" },
  { title: "Company Fact Sheet", description: "Key statistics and company information", size: "450 KB" },
  { title: "Product Screenshots", description: "Platform interface and feature highlights", size: "5.2 MB" }
]

const awards = [
  { year: "2023", title: "Best Mental Health Platform", org: "Digital Health Awards" },
  { year: "2023", title: "Top Workplace Culture", org: "Remote Work Association" },
  { year: "2022", title: "Innovation in Therapy", org: "Psychology Today" },
  { year: "2022", title: "Fastest Growing Startup", org: "TechCrunch" }
]

export default function PressPage() {
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
              <Link href="/blog" className="text-gray-700 hover:text-brand-teal transition-colors">Blog</Link>
              <Link href="/press" className="text-brand-teal font-semibold">Press</Link>
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
              Press & <GradientText className="inline-block">Media</GradientText>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get the latest news, press releases, and media resources about ACT Coaching For Life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Recent Press Releases
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay updated with our latest announcements and company news.
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
                    <div className="mb-4 md:mb-0 md:mr-8">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        {release.date}
                      </div>
                      <h3 className="text-xl font-semibold text-ink-dark mb-2">{release.title}</h3>
                      <p className="text-gray-600">{release.excerpt}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white flex-shrink-0"
                    >
                      Read More
                      <ExternalLink className="w-4 h-4 ml-2" />
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Media Kit
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Download our media resources for your articles and publications.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {mediaKit.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <FileText className="w-8 h-8 text-brand-teal mb-3" />
                      <h3 className="text-lg font-semibold text-ink-dark mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.size}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-brand-teal hover:text-brand-teal/80">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-6">
              Awards & Recognition
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Recognized for our innovation and impact in mental health.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {awards.map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <Award className="w-12 h-12 text-brand-orange mx-auto mb-4" />
                  <p className="text-sm text-gray-500 mb-2">{award.year}</p>
                  <h3 className="font-semibold text-ink-dark mb-1">{award.title}</h3>
                  <p className="text-sm text-gray-600">{award.org}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-brand-teal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Mail className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Media Inquiries
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              For press inquiries, interviews, or additional resources, please contact our media team.
            </p>
            <Button className="bg-white text-brand-teal hover:bg-gray-50 px-8 py-4 text-lg">
              Contact Press Team
            </Button>
            <p className="text-white/80 mt-4">press@actcoachingforlife.com</p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}