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
      <div className="w-full max-w-md mx-auto py-12 px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
            alt="ACT Coaching For Life Logo"
            className="h-16 w-auto"
          />
        </div>

        {/* Welcome Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back!</h1>
          <p className="text-gray-600 text-base">
            {fromAssessment || hasAssessmentData
              ? 'Sign in to see your personalized coach matches'
              : 'Sign in to your ACT Coaching For Life account'
            }
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password*
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-teal-600 hover:text-teal-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-lg font-medium transition-colors text-base"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </Button>
          </div>
        </form>

        {/* Registration Link */}
        <div className="mt-8 text-center">
          <p className="text-base text-gray-600">
            New to ACT?{' '}
            <Link href="/register/client" className="font-medium text-teal-600 hover:text-teal-500">
              Register Here
            </Link>
          </p>
        </div>

        {/* Test Credentials */}
        <div className="mt-10 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Test Credentials:</h4>
          <div className="text-xs text-gray-700 space-y-1.5">
            <p><strong>Admin:</strong> admin@acfl.com / admin123</p>
            <p><strong>Coach:</strong> coach@acfl.com / coach123</p>
            <p><strong>Client:</strong> client@acfl.com / client123</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center text-xs text-gray-600 space-y-2 leading-relaxed">
          <p className="font-medium">
            This platform is HIPAA-compliant and your data is secure.
          </p>
          <p>
            For mental health emergencies, call 988 or 911 immediately.
          </p>
        </div>
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
        <div className="w-full max-w-md mx-auto my-20 px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}