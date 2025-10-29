'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NavbarLandingPage  from '@/components/NavbarLandingPage';
import Footer from "@/components/Footer"
import { Mail, Lock } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <nav>
        <NavbarLandingPage />
      </nav>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">

            {/* Left Column - Motivational Section (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              {/* Motivational Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=1000&fit=crop"
                  alt="Person meditating peacefully"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/80 via-teal-900/40 to-transparent"></div>

                {/* Quote Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
                  <div className="mb-4">
                    <svg className="w-12 h-12 text-teal-300 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                    </svg>
                  </div>
                  <blockquote className="text-2xl font-bold leading-relaxed mb-4">
                    "The greatest discovery of my generation is that human beings can alter their lives by altering their attitudes."
                  </blockquote>
                  <p className="text-teal-200 font-medium">— William James</p>
                </div>
              </div>

              {/* Additional Stats/Features */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                  <div className="text-3xl font-bold text-teal-600 mb-1">500+</div>
                  <div className="text-sm text-gray-600">Certified Coaches</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                  <div className="text-3xl font-bold text-teal-600 mb-1">10k+</div>
                  <div className="text-sm text-gray-600">Sessions Completed</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                  <div className="text-3xl font-bold text-teal-600 mb-1">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700">
              {/* Welcome Title */}
              <div className="text-center mb-8 mt-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
                <p className="text-gray-500 text-sm">
                  {fromAssessment || hasAssessmentData
                    ? 'Sign in to see your personalized coach matches'
                    : 'Sign in to your ACT Coaching For Life account'
                  }
                </p>
              </div>

              {/* Card Container */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 lg:p-10 transition-all duration-300 hover:shadow-2xl">
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password*
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline transition-all"
            >
              Forgot password?
            </Link>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg text-base"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </Button>
          </div>
        </form>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to ACT?{' '}
              <Link href="/register/client" className="font-medium text-teal-600 hover:text-teal-500 hover:underline transition-all">
                Register Here
              </Link>
            </p>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Test Credentials:</h4>
          <div className="text-xs text-gray-700 space-y-1.5">
            <p><strong>Admin:</strong> admin@acfl.com / admin123</p>
            <p><strong>Coach:</strong> coach@acfl.com / coach123</p>
            <p><strong>Client:</strong> client@acfl.com / client123</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-gray-600 space-y-2 leading-relaxed">
          <p className="font-medium">
            This platform is HIPAA-compliant and your data is secure.
          </p>
          <p>
            For mental health emergencies, call 988 or 911 immediately.
          </p>
        </div>
      </div>
      {/* End Right Column */}

      </div>
      {/* End Grid */}
      </div>
      {/* End Container */}
      </div>
      {/* End Flex Container */}

      <Footer />
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
        <nav>
          <NavbarLandingPage />
        </nav>
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left placeholder */}
              <div className="hidden lg:block"></div>
              {/* Right - Loading */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 transition-all duration-300">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}