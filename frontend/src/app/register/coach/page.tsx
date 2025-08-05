'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const SPECIALTIES = [
  'Anxiety', 'Depression', 'PTSD', 'Addiction', 'Relationships', 'Stress Management',
  'Career Coaching', 'Life Coaching', 'Grief Counseling', 'Anger Management',
  'Eating Disorders', 'Family Therapy', 'Couples Therapy', 'Teen Counseling'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch'
];

export default function CoachRegister() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    qualifications: ''
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerCoach } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

    // Validate password as user types
    if (e.target.name === 'password') {
      validatePassword(e.target.value);
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('');
      return;
    }

    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };

    const unmet = [];
    if (!requirements.length) unmet.push('at least 8 characters');
    if (!requirements.uppercase) unmet.push('one uppercase letter');
    if (!requirements.lowercase) unmet.push('one lowercase letter');
    if (!requirements.number) unmet.push('one number');

    if (unmet.length > 0) {
      setPasswordError(`Password must contain ${unmet.join(', ')}`);
    } else {
      setPasswordError('');
    }
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setSelectedSpecialties(prev => [...prev, specialty]);
    } else {
      setSelectedSpecialties(prev => prev.filter(s => s !== specialty));
    }
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      setSelectedLanguages(prev => [...prev, language]);
    } else {
      setSelectedLanguages(prev => prev.filter(l => l !== language));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (selectedSpecialties.length === 0) {
      setError('Please select at least one specialty');
      return;
    }

    if (selectedLanguages.length === 0) {
      setError('Please select at least one language');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const qualifications = formData.qualifications
        ? formData.qualifications.split(',').map(q => q.trim()).filter(q => q)
        : [];

      const registrationData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        specialties: selectedSpecialties,
        languages: selectedLanguages
      };

      // Only include optional fields if they have values
      if (formData.phone) {
        registrationData.phone = formData.phone;
      }
      if (formData.bio) {
        registrationData.bio = formData.bio;
      }
      if (qualifications.length > 0) {
        registrationData.qualifications = qualifications;
      }
      if (formData.experience) {
        registrationData.experience = parseInt(formData.experience);
      }
      if (formData.hourlyRate) {
        registrationData.hourlyRate = parseFloat(formData.hourlyRate);
      }

      console.log('Sending registration data:', registrationData);
      await registerCoach(registrationData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
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
              Join our network of professional coaches and help clients achieve their goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {SPECIALTIES.map((specialty) => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={specialty}
                          checked={selectedSpecialties.includes(specialty)}
                          onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                        />
                        <label htmlFor={specialty} className="text-sm text-gray-700">
                          {specialty}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {LANGUAGES.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={language}
                          checked={selectedLanguages.includes(language)}
                          onCheckedChange={(checked) => handleLanguageChange(language, checked as boolean)}
                        />
                        <label htmlFor={language} className="text-sm text-gray-700">
                          {language}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell clients about your approach, experience, and what makes you unique..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      id="experience"
                      name="experience"
                      min="0"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      min="0"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifications & Certifications
                  </label>
                  <input
                    type="text"
                    id="qualifications"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    placeholder="Separate multiple qualifications with commas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${passwordError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} focus:border-transparent`}
                  />
                  {passwordError ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {passwordError}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
    </div>
  );
}