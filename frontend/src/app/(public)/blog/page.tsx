"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Calendar, Clock, User, ChevronRight, Search } from "lucide-react"
import GradientText from "@/components/GradientText"
import SpotlightCard from "@/components/SpotlightCard"
import { Input } from "@/components/ui/input"

const blogPosts = [
  {
    title: "Understanding Psychological Flexibility: The Core of ACT",
    excerpt: "Discover how developing psychological flexibility can transform your approach to life's challenges and create lasting positive change.",
    author: "Dr. Sarah Mitchell",
    date: "January 20, 2024",
    readTime: "5 min read",
    category: "ACT Fundamentals",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop"
  },
  {
    title: "5 Mindfulness Techniques to Reduce Anxiety",
    excerpt: "Learn practical mindfulness exercises from ACT therapy that can help you manage anxiety and stay present in difficult moments.",
    author: "Michael Chen",
    date: "January 18, 2024",
    readTime: "7 min read",
    category: "Mindfulness",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&h=400&fit=crop"
  },
  {
    title: "Values-Based Living: Finding Your North Star",
    excerpt: "Explore how identifying and living by your core values can guide you toward a more meaningful and fulfilling life.",
    author: "Dr. Emily Rodriguez",
    date: "January 15, 2024",
    readTime: "6 min read",
    category: "Values Work",
    image: "https://images.unsplash.com/photo-1492681290082-e932832941e6?w=600&h=400&fit=crop"
  },
  {
    title: "Breaking Free from Thought Patterns That Hold You Back",
    excerpt: "Understanding cognitive defusion and how to separate yourself from unhelpful thoughts that limit your potential.",
    author: "James Thompson",
    date: "January 12, 2024",
    readTime: "8 min read",
    category: "Cognitive Work",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop"
  },
  {
    title: "The Science Behind ACT: Evidence-Based Approaches",
    excerpt: "A deep dive into the research supporting Acceptance and Commitment Therapy and its effectiveness.",
    author: "Dr. Lisa Park",
    date: "January 10, 2024",
    readTime: "10 min read",
    category: "Research",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&h=400&fit=crop"
  },
  {
    title: "Building Resilience Through Acceptance",
    excerpt: "How accepting difficult emotions and experiences can paradoxically lead to greater emotional strength.",
    author: "Maria Gonzalez",
    date: "January 8, 2024",
    readTime: "5 min read",
    category: "Acceptance",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=400&fit=crop"
  }
]

const categories = [
  "All Posts",
  "ACT Fundamentals",
  "Mindfulness",
  "Values Work",
  "Cognitive Work",
  "Research",
  "Acceptance",
  "Success Stories"
]

export default function BlogPage() {
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
              <Link href="/resources" className="text-gray-700 hover:text-brand-teal transition-colors">Resources</Link>
              <Link href="/blog" className="text-brand-teal font-semibold">Blog</Link>
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
              The ACT <GradientText className="inline-block">Blog</GradientText>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Insights, stories, and practical guidance for living a more meaningful life through ACT principles.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-12 pr-4 h-12 w-full border-gray-300 focus:border-brand-teal focus:ring-brand-teal"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  className={index === 0 
                    ? "bg-brand-teal hover:bg-brand-teal/90 text-white" 
                    : "border-gray-300 hover:border-brand-teal hover:text-brand-teal"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <SpotlightCard className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="text-sm text-brand-teal mb-2">{post.category}</div>
                    <h3 className="text-xl font-semibold text-ink-dark mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {post.author}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {post.date}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-brand-teal hover:text-brand-teal/80"
                      >
                        Read More
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.article>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
            >
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-teal to-brand-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Get Weekly Insights
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest articles on ACT, mindfulness, and personal growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
              />
              <Button className="bg-white text-brand-teal hover:bg-gray-50 px-8">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}