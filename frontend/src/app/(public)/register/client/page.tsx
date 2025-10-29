'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/api';
import { PhoneInput } from '@/components/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import Footer from "@/components/Footer"
import NavbarLandingPage  from '@/components/NavbarLandingPage';

function ClientRegisterForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [hasAssessmentData, setHasAssessmentData] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAssessment = searchParams.get('from') === 'assessment';
  const { registerClient } = useAuth();

  useEffect(() => {
    // Check if there's assessment data in localStorage
    const assessmentData = localStorage.getItem('assessmentData');
    if (assessmentData) {
      setHasAssessmentData(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!formData.phone.startsWith('+')) {
      newErrors.phone = 'Please select a country and enter a valid phone number';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number is too short';
    } else if (formData.phone.length > 20) {
      newErrors.phone = 'Phone number is too long';
    }

    // Validate birthday if provided
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      
      // Check if birthday is a valid date
      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'Invalid date format';
      } else if (birthDate > today) {
        // Check if birthday is not in the future
        newErrors.dateOfBirth = 'Birthday cannot be in the future';
      } else {
        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        // Check minimum age (18 years old)
        if (age < 18) {
          newErrors.dateOfBirth = 'You must be at least 18 years old to register for coaching services';
        }
        
        // Check maximum age (120 years old - reasonable limit)
        if (age > 120) {
          newErrors.dateOfBirth = 'Invalid birthday - please enter a valid date';
        }
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // First check if we need special handling for assessment flow
      const assessmentData = localStorage.getItem('assessmentData');
      const needsAssessmentRedirect = fromAssessment && assessmentData;
      
      // Use registerClient from AuthContext which handles auto-login
      await registerClient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined
      });

      // Override the default redirect if coming from assessment
      if (needsAssessmentRedirect) {
        console.log('Redirecting to search-coaches with assessment data');
        // Use replace to prevent the /clients redirect from AuthContext
        setTimeout(() => {
          router.replace('/clients/search-coaches?from=assessment');
        }, 100);
      }
      // Otherwise, the registerClient function handles the redirect to /clients
    } catch (err: any) {
      setErrors({ submit: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <img
          src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
          alt="ACT Coaching For Life Logo"
          className="h-16 w-auto"
        />
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Create Client Account</h1>
        <p className="text-gray-600 text-base">
          {fromAssessment && hasAssessmentData
            ? 'Create your account to see your personalized coach matches'
            : 'Join ACT Coaching For Life as a client and find your perfect coach'
          }
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {errors.submit}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name*
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number*
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, phone: value }));
                    if (errors.phone) {
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }
                  }}
                  error={errors.phone}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password*
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password*
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" className="font-medium text-teal-600 hover:text-teal-500">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="font-medium text-teal-600 hover:text-teal-500">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="hipaa"
                      name="hipaa"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="hipaa" className="text-gray-700">
                      I acknowledge that this platform is HIPAA-compliant and understand my rights regarding protected health information
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-lg font-medium transition-colors text-base"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-base text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-teal-600 hover:text-teal-500 font-medium">
                  Login
                </Link>
              </p>
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
    </>
  );
}

export default function ClientRegister() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <nav>
        <NavbarLandingPage />
      </nav>

      {/* Register as Coach Button - Top Right */}
      <div className="absolute top-24 right-6 z-10">
        <Link href="/register/coach" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Want to become a coach? Register as Coach
        </Link>
      </div>

      <div className="w-full max-w-xl mx-auto py-12 px-6">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        }>
          <ClientRegisterForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}