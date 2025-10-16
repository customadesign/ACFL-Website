"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ArrowLeft, Shield, Calendar } from "lucide-react"
import Footer from "@/components/Footer"
import NavbarLandingPage from "@/components/NavbarLandingPage"
import { useState, useEffect } from "react"
import { getApiUrl } from "@/lib/api"

interface StaticContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  content_type: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function PrivacyPage() {
  const [content, setContent] = useState<StaticContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/content/public/content?slug=privacy-policy`);
      
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
                <Shield className="w-12 h-12 text-brand-teal" />
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-ink-dark mb-4 text-center">
                {content?.title || "Privacy Policy"}
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
                  />
                ) : (
                  // Fallback content if CMS is not available
                  <>
                    <h2 className="text-2xl font-semibold text-ink-dark mb-4">1. Introduction</h2>
                    <p className="text-gray-600 mb-6">
                      At ACT Coaching For Life, we are committed to protecting your privacy and ensuring the security 
                      of your personal information. This Privacy Policy explains how we collect, use, disclose, and 
                      safeguard your information when you use our services.
                    </p>

                    <h2 className="text-2xl font-semibold text-ink-dark mb-4">2. Information We Collect</h2>
                    <p className="text-gray-600 mb-6">
                      We collect information that you provide directly to us, including:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                      <li>Personal identification information (name, email, phone number)</li>
                      <li>Account credentials</li>
                      <li>Payment information</li>
                      <li>Demographic information</li>
                      <li>Session notes and coaching-related information</li>
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
                      <li>Your assigned coach (limited to necessary information)</li>
                      <li>Service providers who assist in our operations</li>
                      <li>Law enforcement when required by law</li>
                      <li>Professional advisors under confidentiality agreements</li>
                    </ul>

                    <h2 className="text-2xl font-semibold text-ink-dark mb-4">5. Data Security</h2>
                    <p className="text-gray-600 mb-6">
                      We implement appropriate technical and organizational measures to protect your personal 
                      information, including:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                      <li>Encryption of data in transit and at rest</li>
                      <li>Regular security assessments</li>
                      <li>Secure authentication mechanisms</li>
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
                  </>
                )}
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
      <Footer />
    </div>
  )
}