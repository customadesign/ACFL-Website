"use client"

import { useState, useEffect } from 'react';
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, FileText, Calendar } from "lucide-react"
import Footer from "@/components/Footer"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import { getApiUrl } from '@/lib/api';

interface StaticContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  content_type: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export default function TermsPage() {
  const [content, setContent] = useState<StaticContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=terms-of-service`);
      
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else if (response.status === 404) {
        // Use fallback content if CMS content not found
        setError('CMS content not found, using default content');
      } else {
        setError('Failed to load content from CMS');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content from CMS');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <nav>
          <NavbarLandingPage />
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-teal"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white ">
      {/* Add custom styles for CMS content */}
      <style jsx global>{`
        .cms-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
        }
        .cms-content p {
          color: #4b5563;
          margin-bottom: 1.5rem;
          line-height: 1.75;
        }
        .cms-content ul {
          list-style-type: disc;
          list-style-position: inside;
          color: #4b5563;
          margin-bottom: 1.5rem;
        }
        .cms-content ul li {
          margin-bottom: 0.5rem;
        }
        .cms-content br {
          display: block;
          margin-bottom: 0.5rem;
        }
      `}</style>

      {/* Navigation */}
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="flex items-center justify-center mb-8">
                <FileText className="w-12 h-12 text-brand-teal" />
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4 text-center">
                {content?.title || "Terms of Service"}
              </h1>
              
              <div className="text-center mb-12">
                {content?.updated_at && (
                  <div className="flex items-center justify-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Last updated: {new Date(content.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {content?.meta_description && (
                  <p className="text-gray-600 mt-2">
                    {content.meta_description}
                  </p>
                )}
              </div>

              <div className="prose prose-gray max-w-none">
                {content?.content ? (
                  <div
                    dangerouslySetInnerHTML={{ 
                      __html: content.content
                    }}
                    className="cms-content"
                    style={{
                      // Custom styles for CMS content to match fallback design
                    }}
                  />
                ) : (
                  // Fallback content if CMS is not available
                  <>
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

                    <h2 className="text-2xl font-semibold text-ink-dark mb-4">8. Contact Information</h2>
                    <p className="text-gray-600 mb-6">
                      For questions about these Terms, please contact us at:
                      <br />
                      Email: legal@actcoachingforlife.com
                      <br />
                      Phone: 1-800-ACT-HELP
                    </p>
                  </>
                )}
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
      <Footer />
    </div>
  )
}