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
import { Mail, Lock, User, Phone as PhoneIcon, Calendar } from 'lucide-react';

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
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Left Column - Motivational Section (Hidden on mobile) */}
          <div className="hidden lg:flex flex-col space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            {/* Motivational Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=1000&fit=crop"
                alt="Person starting a wellness journey"
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
                  "The journey of a thousand miles begins with one step. Take yours today."
                </blockquote>
                <p className="text-teal-200 font-medium">— Lao Tzu</p>
              </div>
            </div>

            {/* Additional Stats/Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl font-bold text-teal-600 mb-1">500+</div>
                <div className="text-sm text-gray-600">Certified Coaches</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl font-bold text-teal-600 mb-1">10k+</div>
                <div className="text-sm text-gray-600">Sessions Completed</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl font-bold text-teal-600 mb-1">98%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </div>
            </div>

            {/* Testimonial Snippet */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-teal-100">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 italic leading-relaxed mb-2">
                    "Finding my coach through ACFL transformed my approach to wellness. The personalized matching made all the difference."
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-gray-800">Sarah M.</p>
                    <span className="text-gray-400">•</span>
                    <p className="text-xs text-gray-500">Client since 2024</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Registration CTA */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
              <h3 className="text-gray-800 font-bold text-2xl mb-2">Are you a coach?</h3>
              <p className="text-gray-600 text-sm mb-4">Join our network of certified wellness professionals</p>
              <Link href="/register/coach">
                <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-base py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                  Register as a Coach
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Welcome Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Start Your Journey</h1>
              <p className="text-gray-500 text-sm">
                {fromAssessment && hasAssessmentData
                  ? 'Complete your registration to view your personalized coach matches'
                  : 'Create your account and find your perfect wellness coach'
                }
              </p>
            </div>

            {/* Card Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 lg:p-10 pb-24 md:pb-8 transition-all duration-300 hover:shadow-2xl">
              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
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
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-3 focus:ring-teal-400/50 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/20 bg-white text-gray-900 transition-all duration-300 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="First name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name*
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-3 focus:ring-teal-400/50 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/20 bg-white text-gray-900 transition-all duration-300 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-3 focus:ring-teal-400/50 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/20 bg-white text-gray-900 transition-all duration-300 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
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
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-3 focus:ring-teal-400/50 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/20 bg-white text-gray-900 transition-all duration-300 ${
                      errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
                )}
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
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-3 focus:ring-teal-400/50 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/20 bg-white text-gray-900 transition-all duration-300 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                </div>
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
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-3 focus:ring-teal-400/50 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/20 bg-white text-gray-900 transition-all duration-300 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                </div>
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

              {/* Desktop Button */}
              <div className="pt-6 hidden md:block">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-0.5 shadow-lg hover:shadow-2xl hover:shadow-teal-500/30 focus:ring-4 focus:ring-teal-400/50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : 'Create Account'}
                </Button>
              </div>

              {/* Mobile Sticky Button */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl z-50">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-lg active:scale-95"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : 'Create Account'}
                </Button>
              </div>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Already part of our community?{' '}
                  <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-all">
                    Log in here
                  </Link>
                </p>
              </div>

              {/* Security Notice */}
              <div className="mt-6 text-center text-xs text-gray-400 space-y-1.5 leading-relaxed">
                <p>
                  This platform is HIPAA-compliant and your data is secure.
                </p>
                <p>
                  For mental health emergencies, call 988 or 911 immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientRegister() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <NavbarLandingPage />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <ClientRegisterForm />
      </Suspense>

      <Footer />
    </div>
  );
}