'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from "@/components/Footer";
import NavbarLandingPage from '@/components/NavbarLandingPage';

export default function CoachApplicationSuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return;

    // Start countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router, autoRedirect]);

  const handleCancelRedirect = () => {
    setAutoRedirect(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-green-600 mb-2">
                🎉 Application Successfully Submitted!
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Thank you for your interest in becoming a coach with ACT Coaching For Life
              </CardDescription>
              {autoRedirect && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500 mb-2">
                    Redirecting to home page in <span className="font-bold text-blue-600">{countdown}</span> seconds...
                  </div>
                  <button
                    onClick={handleCancelRedirect}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Stay on this page
                  </button>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Our team will review your application within 3-5 business days</li>
                  <li>• You'll receive an email confirmation shortly</li>
                  <li>• We may contact your professional references</li>
                  <li>• You'll be notified of our decision via email</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
                <ul className="text-sm text-yellow-700 space-y-1 text-left">
                  <li>• Please check your email (including spam folder)</li>
                  <li>• Keep your contact information up to date</li>
                  <li>• Application ID will be sent via email</li>
                </ul>
              </div>
              
              <div className="pt-4 space-y-3">
                <Button asChild className="w-full">
                  <Link href="/">
                    Return to Home
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Questions? Email us at{' '}
                <a href="mailto:support@actcoachingforlife.com" className="text-blue-600 hover:underline">
                  support@actcoachingforlife.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}