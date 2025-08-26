'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiUrl } from '@/lib/api';
import { PhoneInput } from '@/components/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import Footer from "@/components/Footer"
import NavbarLandingPage  from '@/components/NavbarLandingPage';

export default function CoachRegister() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    qualifications: '',
    experience: '',
    hourlyRate: '',
    specialties: [] as string[],
    languages: [] as string[]
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { registerCoach } = useAuth();

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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const requirements = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /\d/.test(formData.password)
      };

      const unmet = [];
      if (!requirements.length) unmet.push('at least 8 characters');
      if (!requirements.uppercase) unmet.push('one uppercase letter');
      if (!requirements.lowercase) unmet.push('one lowercase letter');
      if (!requirements.number) unmet.push('one number');

      if (unmet.length > 0) {
        newErrors.password = `Password must contain ${unmet.join(', ')}`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional for coaches, but must be valid if provided)
    if (formData.phone.trim()) {
      if (!formData.phone.startsWith('+')) {
        newErrors.phone = 'Please select a country and enter a valid phone number';
      } else if (formData.phone.length < 10) {
        newErrors.phone = 'Phone number is too short';
      } else if (formData.phone.length > 20) {
        newErrors.phone = 'Phone number is too long';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }

    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };

    const metCount = Object.values(requirements).filter(Boolean).length;
    
    if (metCount === 4) {
      setPasswordStrength('Strong');
    } else if (metCount >= 2) {
      setPasswordStrength('Medium');
    } else {
      setPasswordStrength('Weak');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    // Check password strength in real-time
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Use registerCoach from AuthContext which handles auto-login
      await registerCoach({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        bio: formData.bio || 'Professional ACT coach ready to help you achieve your goals',
        qualifications: formData.qualifications ? [formData.qualifications] : ['Certified Life Coach'],
        experience: parseInt(formData.experience) || 1,
        hourlyRate: parseInt(formData.hourlyRate) || 75,
        specialties: formData.specialties,
        languages: formData.languages.length > 0 ? formData.languages : ['English']
      });

      // The registerCoach function already handles token storage and redirects to /coaches
      // No need for manual redirect as it's handled in AuthContext
    } catch (err: any) {
      setErrors({ submit: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex flex-col min-h-screen bg-white ">
      <nav>
        <NavbarLandingPage />
      </nav>
      <div className="w-full max-w-md mx-auto my-28">
       
        
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                alt="ACT Coaching For Life Logo" 
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Become a Coach</CardTitle>
            <CardDescription>
              Create your coach account now and complete your professional profile later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {errors.submit}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  error={errors.phone}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength === 'Weak' ? 'w-1/3 bg-red-500' : 
                            passwordStrength === 'Medium' ? 'w-2/3 bg-yellow-500' : 
                            'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'Weak' ? 'text-red-500' : 
                        passwordStrength === 'Medium' ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 8 characters, uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="professional"
                      name="professional"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="professional" className="text-gray-700">
                      I certify that I am a qualified professional and will maintain appropriate standards of care
                    </label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Coach Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Looking for coaching?{' '}
                <Link href="/register/client" className="text-green-600 hover:text-green-500 font-medium">
                  Register as Client
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}