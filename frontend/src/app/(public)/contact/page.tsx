'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import NavbarLandingPage from '@/components/NavbarLandingPage'
import Footer from '@/components/Footer'
import Contact from '../component/contactUs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ContactPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('emailForm'),
      phone: formData.get('phone'),
      interests: formData.getAll('interest'),
      message: formData.get('messageForm')
    }

    try {
      // TODO: Add your contact form submission logic here
      console.log('Form submitted:', data)
      alert('Thank you for contacting us! We will get back to you soon.')
      e.currentTarget.reset()
    } catch (error) {
      console.error('Form submission error:', error)
      alert('There was an error sending your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToForm = () => {
    const formSection = document.querySelector('#contact-form')
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 bg-[url('/images/contact-hero.png')] bg-cover bg-center bg-no-repeat">
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Get In Touch
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              We're here to support your journey towards personal and professional growth. Our coaches are ready to help you navigate life's challenges with compassion and expertise.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Us Section */}
      <Contact />

      {/* Send an Email Form Section */}
      <section id="contact-form" className="py-16 bg-[#e9f6f7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">Connect</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Send an Email
            </h2>
            <p className="text-gray-600">
              Start your journey towards meaningful personal transformation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder=""
                        className="mt-2 h-12 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder=""
                        className="mt-2 h-12 border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Email and Phone Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="emailForm" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="emailForm"
                        name="emailForm"
                        type="email"
                        placeholder=""
                        className="mt-2 h-12 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder=""
                        className="mt-2 h-12 border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Primary Coaching Interest Checkboxes */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Your primary coaching interest
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="interest"
                          value="personal-growth"
                          className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                        />
                        <span className="text-gray-700">Personal growth</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="interest"
                          value="professional-development"
                          className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                        />
                        <span className="text-gray-700">Professional development</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="interest"
                          value="relationship-coaching"
                          className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                        />
                        <span className="text-gray-700">Relationship coaching</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="interest"
                          value="stress-management"
                          className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                        />
                        <span className="text-gray-700">Stress management</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="interest"
                          value="leadership-skills"
                          className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                        />
                        <span className="text-gray-700">Leadership skills</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="interest"
                          value="other"
                          className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                        />
                        <span className="text-gray-700">Other</span>
                      </label>
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <Label htmlFor="messageForm" className="text-sm font-medium text-gray-700">
                      Message
                    </Label>
                    <Textarea
                      id="messageForm"
                      name="messageForm"
                      rows={6}
                      placeholder="Share your coaching goals briefly"
                      className="mt-2 border-gray-300"
                    />
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      required
                      className="w-4 h-4 mt-1 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the terms
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="text-center">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-brand-teal hover:bg-brand-teal/90 text-white px-12 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              FAQs
            </h2>
            <p className="text-gray-600">
              Find answers to common questions about our ACT coaching services
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {/* FAQ 1 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  How quickly will you respond to my message?
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openFaqIndex === 0 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaqIndex === 0 && (
                <div className="px-6 pb-6 text-gray-600">
                  We typically reply within a few minutes during business hours. If you reach out after hours, our team will get back to you the next business day.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  Do you offer phone consultations?
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openFaqIndex === 1 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaqIndex === 1 && (
                <div className="px-6 pb-6 text-gray-600">
                  Yes! We offer phone consultations as one of our coaching formats. You can choose between phone, video call, or text-based coaching—whatever helps you feel most comfortable.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  Can I schedule a session directly?
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openFaqIndex === 2 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaqIndex === 2 && (
                <div className="px-6 pb-6 text-gray-600">
                  Absolutely! You can schedule a session directly through our booking page. Simply choose your preferred coach, session type, and time that works best for you. You'll receive a confirmation email right after booking.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  What information should I include in my message?
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openFaqIndex === 3 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaqIndex === 3 && (
                <div className="px-6 pb-6 text-gray-600">
                  To help us assist you better, please share your name, preferred contact method (email or phone), and a brief description of what you'd like support with. If you're interested in coaching, you can also mention your goals or areas you'd like to focus on.
                </div>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  What if I'm not satisfied?
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openFaqIndex === 4 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaqIndex === 4 && (
                <div className="px-6 pb-6 text-gray-600">
                  We offer a satisfaction guarantee. If you're not completely satisfied with your initial coaching experience, we'll help you find a different coach or a different format at no additional cost.
                </div>
              )}
            </div>
          </motion.div>

          {/* Need more information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Need more information?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is ready to answer any additional questions
            </p>
            <Button
              onClick={scrollToForm}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3"
            >
              Contact
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}