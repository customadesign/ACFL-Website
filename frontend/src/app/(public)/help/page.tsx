"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Search, HelpCircle, MessageCircle, Book, CreditCard, Shield, Users, ChevronRight, Phone, Mail } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const categories = [
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

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")

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
              <Link href="/help" className="text-brand-teal font-semibold">Help Center</Link>
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
      <section className="py-20 bg-white">
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
              How Can We <GradientText className="inline-block">Help You?</GradientText>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Find answers to your questions and get the support you need for your coaching journey.
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
                >
                  <Link 
                    href="#" 
                    className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                  >
                    <span className="text-gray-700 group-hover:text-brand-teal transition-colors">
                      {article}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-teal transition-colors" />
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
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="h-full p-6 hover:shadow-lg transition-shadow">
                  <category.icon className="w-10 h-10 text-brand-teal mb-4" />
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
            ))}
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
              Still Need Help?
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
              Our support team is here to assist you with any questions or concerns.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
                <p className="text-white/80 text-sm mb-4">Chat with our support team</p>
                <Button className="bg-white text-brand-teal hover:bg-gray-50">
                  Start Chat
                </Button>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
                <p className="text-white/80 text-sm mb-4">We'll respond within 24 hours</p>
                <a href="mailto:support@actcoachingforlife.com" className="text-white underline hover:text-white/80">
                  support@actcoachingforlife.com
                </a>
              </div>

              <div className="text-center">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Phone Support</h3>
                <p className="text-white/80 text-sm mb-4">Mon-Fri 9am-6pm EST</p>
                <a href="tel:1-800-228-4357" className="text-white underline hover:text-white/80">
                  1-800-ACT-HELP
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}