'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NavbarLandingPage from '@/components/NavbarLandingPage';
import Footer from '@/components/Footer';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';

function CoachRegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>

      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <Card className="bg-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>

              <CardTitle className="text-3xl font-bold text-gray-900">
                Registration Successful!
              </CardTitle>

              <CardDescription className="text-lg mt-4">
                Thank you for joining ACT Coaching For Life as a coach
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Email Verification Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Verify Your Email Address
                    </h3>
                    <p className="text-blue-800 mb-3">
                      We've sent a verification email to{' '}
                      {email && (
                        <span className="font-semibold">{email}</span>
                      )}
                      {!email && (
                        <span className="font-semibold">your email address</span>
                      )}
                    </p>
                    <p className="text-sm text-blue-700">
                      Please check your inbox and click the verification link to activate your coach account and access your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Next Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">What's Next?</h3>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 text-sm font-semibold">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">
                        <strong>Check your email</strong> - Look for an email from ACT Coaching For Life (check spam/junk folder if you don't see it)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 text-sm font-semibold">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">
                        <strong>Click the verification link</strong> - This will verify your email address and activate your coach account
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 text-sm font-semibold">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">
                        <strong>Sign in and complete your profile</strong> - Once verified, you can sign in and set up your coaching profile, availability, and rates
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 text-sm font-semibold">4</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">
                        <strong>Start connecting with clients</strong> - Begin your coaching journey and help clients achieve their goals
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login" className="flex-1">
                  <Button className="w-full" size="lg">
                    Go to Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full" size="lg">
                    Back to Home
                  </Button>
                </Link>
              </div>

              {/* Help Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Didn't receive the email?</strong> Check your spam folder or wait a few minutes and check again.
                  </p>
                  <p>
                    <strong>Have questions about the platform?</strong> Check out our{' '}
                    <Link href="/help" className="text-blue-600 hover:text-blue-700 underline">
                      Help Center
                    </Link>
                    {' '}or contact our support team at{' '}
                    <a
                      href="mailto:support@actcoachingforlife.com"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      support@actcoachingforlife.com
                    </a>
                  </p>
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                <p className="flex items-center">
                  <span className="mr-2">🔒</span>
                  This platform is HIPAA-compliant and your data is secure. The verification link will expire in 24 hours for your protection.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CoachRegistrationSuccess() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-white">
        <nav>
          <NavbarLandingPage />
        </nav>
        <div className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    }>
      <CoachRegistrationSuccessContent />
    </Suspense>
  );
}