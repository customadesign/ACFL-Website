'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Mail, ArrowRight, Home, HelpCircle } from 'lucide-react';
import NavbarLandingPage from '@/components/NavbarLandingPage';
import Footer from '@/components/Footer';

function PendingApprovalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <nav>
        <NavbarLandingPage />
      </nav>

      <div className="flex-1 py-12">
        <div className="w-full max-w-2xl mx-auto px-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
              alt="ACT Coaching For Life Logo"
              className="h-16 w-auto"
            />
          </div>
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
            <Clock className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Pending Admin Approval
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Thank you for registering as a coach!
          </p>
        </div>

        {/* Email Display */}
        {email && (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Application submitted for:
                </p>
                <p className="text-base font-semibold text-blue-700 dark:text-blue-300 break-all">
                  {email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What Happens Next */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            What Happens Next?
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Admin Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our admin team will review your coach application. This typically takes 1-3 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Approval Notification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Once approved, you'll receive an email with a verification link.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Verify Your Email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the verification link in the email to activate your account (link valid for 24 hours).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Start Coaching!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  After verification, log in and start connecting with clients.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Important Notes
          </h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 ml-7">
            <li>• Check your spam folder if you don't receive the approval email</li>
            <li>• You cannot log in until your account is approved and email is verified</li>
            <li>• The verification link expires in 24 hours after approval</li>
            <li>• If you have questions, contact our support team</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
          <Link
            href="/contact"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Need help?{' '}
            <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
      <Footer />
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <PendingApprovalContent />
    </Suspense>
  );
}
