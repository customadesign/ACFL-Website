"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Shield } from "lucide-react"

export default function PrivacyPage() {
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
              <Link href="/terms" className="text-gray-700 hover:text-brand-teal transition-colors">Terms</Link>
              <Link href="/privacy" className="text-brand-teal font-semibold">Privacy</Link>
              <Link href="/#quick-assessment">
                <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                  Find a Coach
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link 
              href="/" 
              className="inline-flex items-center text-brand-teal hover:text-brand-teal/80 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>

            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="flex items-center justify-center mb-8">
                <Shield className="w-12 h-12 text-brand-teal" />
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4 text-center">
                Privacy Policy
              </h1>
              
              <p className="text-gray-600 text-center mb-12">
                Last updated: January 1, 2024
              </p>

              <div className="prose prose-gray max-w-none">
                <h2 className="text-2xl font-semibold text-ink-dark mb-4">1. Introduction</h2>
                <p className="text-gray-600 mb-6">
                  At ACT Coaching For Life, we are committed to protecting your privacy and ensuring the security 
                  of your personal information. This Privacy Policy explains how we collect, use, disclose, and 
                  safeguard your information when you use our services.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold text-ink-dark mb-3">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Name and contact information (email, phone number)</li>
                  <li>Account credentials and profile information</li>
                  <li>Payment and billing information</li>
                  <li>Health and wellness information shared during coaching</li>
                </ul>

                <h3 className="text-xl font-semibold text-ink-dark mb-3">Usage Information</h3>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Device information and IP addresses</li>
                  <li>Browser type and operating system</li>
                  <li>Usage patterns and preferences</li>
                  <li>Communication logs with coaches</li>
                </ul>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-600 mb-6">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Provide and improve our coaching services</li>
                  <li>Match you with appropriate coaches</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Communicate with you about your account and services</li>
                  <li>Ensure the safety and security of our platform</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">4. Information Sharing</h2>
                <p className="text-gray-600 mb-6">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Your assigned coach(es) to provide services</li>
                  <li>Service providers who assist in operating our platform</li>
                  <li>Legal authorities when required by law</li>
                  <li>Emergency contacts in safety situations</li>
                </ul>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">5. Data Security</h2>
                <p className="text-gray-600 mb-6">
                  We implement industry-standard security measures to protect your information, including:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure servers and regular security audits</li>
                  <li>Limited access to personal information</li>
                  <li>Regular staff training on data protection</li>
                </ul>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">6. Your Rights</h2>
                <p className="text-gray-600 mb-6">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">7. Data Retention</h2>
                <p className="text-gray-600 mb-6">
                  We retain your information for as long as necessary to provide services and comply with legal 
                  obligations. Coaching session notes are retained for 7 years as required by professional standards.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">8. Children's Privacy</h2>
                <p className="text-gray-600 mb-6">
                  Our services are not intended for children under 18. We do not knowingly collect information 
                  from children under 18 years of age.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">9. International Data Transfers</h2>
                <p className="text-gray-600 mb-6">
                  Your information may be transferred to and processed in countries other than your own. We ensure 
                  appropriate safeguards are in place for such transfers.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-600 mb-6">
                  We may update this Privacy Policy periodically. We will notify you of material changes via 
                  email or through our platform.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">11. Contact Us</h2>
                <p className="text-gray-600 mb-6">
                  For privacy-related questions or concerns, please contact us at:
                  <br />
                  Email: privacy@actcoachingforlife.com
                  <br />
                  Phone: 1-800-ACT-HELP
                  <br />
                  Data Protection Officer: dpo@actcoachingforlife.com
                </p>
              </div>

              <div className="mt-12 text-center">
                <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                  I Understand
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}