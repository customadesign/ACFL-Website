'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import NavbarLandingPage from '@/components/NavbarLandingPage'
import Footer from '@/components/Footer'
import GradientText from '@/components/GradientText'
import SpotlightCard from '@/components/SpotlightCard'
import { getApiUrl } from '@/lib/api'

interface ContentData {
  id: string
  title: string
  content: string
  slug: string
  meta_description?: string
}

export default function ContactPage() {
  const [contactContent, setContactContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  useEffect(() => {
    fetchContactContent()
  }, [])

  const fetchContactContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=contact`)
      console.log('Contact content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Contact content data:', data)
        setContactContent(data)
      } else {
        console.log('Failed to fetch contact content, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching contact content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse content from CMS if available
  const parseContent = () => {
    if (!contactContent?.content) return null

    try {
      const parsed = JSON.parse(contactContent.content)
      console.log('Parsed contact content:', parsed)
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
      // If CMS has custom title, check if it contains "Touch" to apply gradient
      const title = heroContent.title
      if (title.toLowerCase().includes('touch')) {
        const parts = title.split(/touch/i)
        const match = title.match(/touch/i)
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
    return <>Get In <GradientText className="inline-block">Touch</GradientText></>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Contact form submitted:', formData)
    alert('Thank you for contacting us! We will get back to you soon.')
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    })
  }

  // Default contact methods if CMS content is not available
  const defaultContactMethods = [
    {
      icon: Mail,
      iconName: "Mail",
      title: "Email",
      value: "support@actcoachingforlife.com",
      description: "We'll respond within 24 hours"
    },
    {
      icon: Phone,
      iconName: "Phone",
      title: "Phone",
      value: "+1 (800) ACT-HELP",
      description: "Mon-Fri 9am-6pm EST"
    },
    {
      icon: MessageCircle,
      iconName: "MessageCircle",
      title: "Live Chat",
      value: "Available now",
      description: "Chat with our support team"
    }
  ]

  const contactMethods = cmsContent?.contactMethods || defaultContactMethods

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-ink-dark mb-6">
              {renderTitle()}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {heroContent.description || contactContent?.meta_description ||
                "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-ink-dark mb-4">
              {cmsContent?.contactMethodsSection?.title || "How to Reach Us"}
            </h2>
            <p className="text-xl text-gray-600">
              {cmsContent?.contactMethodsSection?.subtitle || "Choose the method that works best for you"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, index) => {
              const IconComponent = method.iconName ?
                { Mail, Phone, MessageCircle, MapPin, Clock }[method.iconName] || Mail
                : method.icon

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <SpotlightCard className="p-6 text-center h-full hover:shadow-lg transition-shadow">
                    <IconComponent className="w-12 h-12 text-brand-teal mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-ink-dark mb-2">{method.title}</h3>
                    <p className="text-brand-teal font-medium mb-2">{method.value}</p>
                    <p className="text-gray-600 text-sm">{method.description}</p>
                  </SpotlightCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      {cmsContent?.contactForm?.title || "Send us a message"}
                    </CardTitle>
                    <CardDescription className="text-lg">
                      {cmsContent?.contactForm?.description ||
                        "Fill out the form below and we'll get back to you as soon as possible."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name" className="text-base font-medium">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            className="mt-1 h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-base font-medium">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="mt-1 h-12"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subject" className="text-base font-medium">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="What is this about?"
                          className="mt-1 h-12"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-base font-medium">Message</Label>
                        <Textarea
                          id="message"
                          name="message"
                          rows={6}
                          required
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Your message..."
                          className="mt-1"
                        />
                      </div>

                      <Button type="submit" className="w-full h-12 text-lg bg-brand-teal hover:bg-brand-teal/90">
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <SpotlightCard className="p-6">
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">
                    {cmsContent?.officeInfo?.title || "Our Office"}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-brand-teal mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-ink-dark">Address</p>
                        <p className="text-gray-600 text-sm">
                          {cmsContent?.officeInfo?.address || (
                            <>
                              123 Coaching Lane<br />
                              Suite 100<br />
                              San Francisco, CA 94105
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-brand-teal mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-ink-dark">Business Hours</p>
                        <p className="text-gray-600 text-sm">
                          {cmsContent?.officeInfo?.hours || (
                            <>
                              Monday - Friday: 9:00 AM - 6:00 PM<br />
                              Saturday: 10:00 AM - 4:00 PM<br />
                              Sunday: Closed
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <SpotlightCard className="p-6">
                  <h3 className="text-xl font-semibold text-ink-dark mb-4">
                    {cmsContent?.faq?.title || "Frequently Asked Questions"}
                  </h3>
                  <div className="space-y-3">
                    {(cmsContent?.faq?.items || [
                      "How quickly will you respond to my message?",
                      "Do you offer phone consultations?",
                      "Can I schedule a session directly?",
                      "What information should I include in my message?"
                    ]).map((faq, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-brand-teal hover:text-brand-teal/80 cursor-pointer">
                          • {faq}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4 w-full">
                    View All FAQs
                  </Button>
                </SpotlightCard>
              </motion.div>
            </div>
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
              {cmsContent?.cta?.title || "Ready to Start Your Journey?"}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {cmsContent?.cta?.subtitle ||
                "Don't wait to begin your transformation. Find your perfect ACT coach today."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-brand-teal hover:bg-gray-50 text-lg px-8"
              >
                Find a Coach
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                Browse Resources
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}