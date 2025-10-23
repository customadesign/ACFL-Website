'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NavbarLandingPage  from '@/components/NavbarLandingPage';
import Footer from "@/components/Footer"

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAssessmentData, setHasAssessmentData] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const fromAssessment = searchParams.get('from') === 'assessment';

  useEffect(() => {
    // Check if there's assessment data in localStorage
    const assessmentData = localStorage.getItem('assessmentData');
    if (assessmentData) {
      setHasAssessmentData(true);
      console.log('Assessment data found in login page');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setResendSuccess(false);
    setError('');

    try {
      const { getApiUrl } = await import('@/lib/api');
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendSuccess(true);
        setEmailNotVerified(false);
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (err: any) {
      setError('An error occurred while resending verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      // Check if we have assessment data that needs special handling
      const assessmentData = localStorage.getItem('assessmentData');
      const shouldRedirectToSearch = (fromAssessment || hasAssessmentData) && assessmentData;

      if (shouldRedirectToSearch || redirect) {
        // Use skipRedirect for custom redirect handling
        await login(formData.email, formData.password, true);

        // Handle custom redirects
        if (shouldRedirectToSearch) {
          console.log('Redirecting to search-coaches with assessment data after login');
          setTimeout(() => {
            router.push('/clients/search-coaches?from=assessment');
          }, 100);
        } else if (redirect) {
          setTimeout(() => {
            if (fromAssessment) {
              router.push(`${redirect}?from=assessment`);
            } else {
              router.push(redirect);
            }
          }, 100);
        }
      } else {
        // Let AuthContext handle normal role-based redirect
        await login(formData.email, formData.password);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);

      // Check if error is due to unverified email
      if (errorMessage.includes('verify your email') || errorMessage.includes('verification')) {
        setEmailNotVerified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <nav>
        <NavbarLandingPage />
      </nav>
      <div className="w-full max-w-md mx-auto my-28">
        <Card className="bg-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                alt="ACT Coaching For Life Logo" 
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              {fromAssessment || hasAssessmentData
                ? 'Sign in to see your personalized coach matches'
                : 'Sign in to your ACT Coaching For Life account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  ✅ Verification email sent! Please check your inbox and click the verification link.
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                  {emailNotVerified && (
                    <div className="mt-3 pt-3 border-t border-red-300">
                      <p className="mb-2 font-medium">Didn't receive the verification email?</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className="w-full"
                      >
                        {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link href="/register/client">
                  <Button variant="outline" className="w-full">
                    Register as Client
                  </Button>
                </Link>
                <Link href="/register/coach">
                  <Button variant="outline" className="w-full">
                    Register as Coach
                  </Button>
                </Link>
              </div>
            </div>

            {/* Test Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Test Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin@acfl.com / admin123</p>
                <p><strong>Coach:</strong> coach@acfl.com / coach123</p>
                <p><strong>Client:</strong> client@acfl.com / client123</p>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                This platform is HIPAA-compliant and your data is secure.
              </p>
              <p className="mt-2">
                For mental health emergencies, call 988 or 911 immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <nav>
          <NavbarLandingPage />
        </nav>
        <div className="w-full max-w-md mx-auto my-28">
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}