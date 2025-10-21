'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NavbarLandingPage from '@/components/NavbarLandingPage';
import Footer from '@/components/Footer';
import { getApiUrl } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing_token'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('missing_token');
        setMessage('No verification token found in the URL.');
        return;
      }

      try {
        console.log('Verifying email with token:', token);
        const apiUrl = getApiUrl();

        const response = await fetch(`${apiUrl}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        console.log('Verification response:', data);

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! Welcome to ACT Coaching For Life.');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Email verification failed. The link may have expired or is invalid.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResendVerification = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendSuccess(true);
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        alert(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      alert('An error occurred while resending the verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>

      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Card className="bg-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {status === 'loading' && (
                  <div className="rounded-full bg-blue-100 p-3">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                {status === 'success' && (
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                )}
                {(status === 'error' || status === 'missing_token') && (
                  <div className="rounded-full bg-red-100 p-3">
                    <XCircle className="h-12 w-12 text-red-600" />
                  </div>
                )}
              </div>

              <CardTitle className="text-2xl font-bold">
                {status === 'loading' && 'Verifying Your Email'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
                {status === 'missing_token' && 'Invalid Link'}
              </CardTitle>

              <CardDescription className="text-base mt-2">
                {status === 'loading' && 'Please wait while we verify your email address...'}
                {message}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {status === 'success' && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Your email has been successfully verified. You'll receive a welcome email shortly with information about getting started.
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Redirecting to login in 3 seconds...
                    </p>
                    <Link href="/login">
                      <Button className="w-full">
                        Go to Login Now
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">What to do next:</h4>
                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                      <li>Check if the link was copied completely</li>
                      <li>The verification link expires after 24 hours</li>
                      <li>Request a new verification email below</li>
                      <li>Contact support if you continue to have issues</li>
                    </ul>
                  </div>

                  {resendSuccess ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Verification email sent successfully! Please check your inbox and spam folder.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Resend Verification Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <Button
                        onClick={handleResendVerification}
                        disabled={isResending || !email}
                        className="w-full"
                      >
                        {isResending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Verification Email
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Back to Login
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full">
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {status === 'missing_token' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      The verification link appears to be incomplete. Please check your email and click the verification link again.
                    </p>
                  </div>

                  <div className="text-center">
                    <Link href="/login">
                      <Button className="w-full">
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Help Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-start space-x-3 text-sm text-gray-600">
                  <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Need help?</p>
                    <p>
                      If you're having trouble verifying your email, contact our support team at{' '}
                      <a
                        href="mailto:support@actcoachingforlife.com"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        support@actcoachingforlife.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-white">
        <nav>
          <NavbarLandingPage />
        </nav>
        <div className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <div className="rounded-full bg-blue-100 p-3 w-fit mx-auto mb-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <p className="text-gray-600">Loading verification page...</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
