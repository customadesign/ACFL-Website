"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, FileText } from "lucide-react"

export default function TermsPage() {
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
              <Link href="/privacy" className="text-gray-700 hover:text-brand-teal transition-colors">Privacy</Link>
              <Link href="/terms" className="text-brand-teal font-semibold">Terms</Link>
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
                <FileText className="w-12 h-12 text-brand-teal" />
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4 text-center">
                Terms of Service
              </h1>
              
              <p className="text-gray-600 text-center mb-12">
                Last updated: January 1, 2024
              </p>

              <div className="prose prose-gray max-w-none">
                <h2 className="text-2xl font-semibold text-ink-dark mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 mb-6">
                  By accessing and using ACT Coaching For Life ("the Service"), you agree to be bound by these 
                  Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">2. Description of Service</h2>
                <p className="text-gray-600 mb-6">
                  ACT Coaching For Life provides online coaching services based on Acceptance and Commitment Therapy 
                  (ACT) principles. Our platform connects users with qualified coaches to support mental health and 
                  personal development goals.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">3. User Eligibility</h2>
                <p className="text-gray-600 mb-6">
                  You must be at least 18 years old to use our Service. By using the Service, you represent and 
                  warrant that you have the legal capacity to enter into these Terms.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">4. Account Registration</h2>
                <p className="text-gray-600 mb-6">
                  To access certain features of our Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Promptly update your account information as needed</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">5. Coaching Services</h2>
                <p className="text-gray-600 mb-6">
                  Our coaching services are not a substitute for professional medical advice, diagnosis, or treatment. 
                  Always seek the advice of your physician or other qualified health provider with any questions 
                  regarding a medical condition.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">6. Privacy and Confidentiality</h2>
                <p className="text-gray-600 mb-6">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                  use, and protect your information. Coach-client communications are confidential, subject to 
                  legal requirements and safety exceptions.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">7. Payment Terms</h2>
                <p className="text-gray-600 mb-6">
                  Subscription fees are billed in advance on a monthly basis. All payments are non-refundable 
                  except as required by law or as explicitly stated in these Terms.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">8. Cancellation Policy</h2>
                <p className="text-gray-600 mb-6">
                  You may cancel your subscription at any time. Cancellation will take effect at the end of your 
                  current billing period. Sessions must be cancelled at least 24 hours in advance to avoid charges.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">9. Intellectual Property</h2>
                <p className="text-gray-600 mb-6">
                  All content on our platform, including text, graphics, logos, and software, is the property of 
                  ACT Coaching For Life and is protected by intellectual property laws.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">10. Limitation of Liability</h2>
                <p className="text-gray-600 mb-6">
                  To the maximum extent permitted by law, ACT Coaching For Life shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages resulting from your use 
                  of the Service.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">11. Changes to Terms</h2>
                <p className="text-gray-600 mb-6">
                  We reserve the right to modify these Terms at any time. We will notify users of material 
                  changes via email or through the Service. Continued use after changes constitutes acceptance.
                </p>

                <h2 className="text-2xl font-semibold text-ink-dark mb-4">12. Contact Information</h2>
                <p className="text-gray-600 mb-6">
                  For questions about these Terms, please contact us at:
                  <br />
                  Email: legal@actcoachingforlife.com
                  <br />
                  Phone: 1-800-ACT-HELP
                </p>
              </div>

              <div className="mt-12 text-center">
                <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                  I Accept the Terms
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}