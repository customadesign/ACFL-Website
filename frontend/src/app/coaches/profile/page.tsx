'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import CoachPageWrapper from '@/components/CoachPageWrapper';
import { getApiUrl } from '@/lib/api';
import axios from 'axios';

const SPECIALTIES = [
  'Anxiety', 'Depression', 'PTSD', 'Addiction', 'Relationships', 'Stress Management',
  'Career Coaching', 'Life Coaching', 'Grief Counseling', 'Anger Management',
  'Eating Disorders', 'Family Therapy', 'Couples Therapy', 'Teen Counseling'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch'
];

export default function CoachProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    qualifications: '',
    isAvailable: true,
    videoAvailable: false,
    inPersonAvailable: false,
    phoneAvailable: false
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSessions: 0,
    averageRating: 0,
    completionRate: 0
  });

  const API_URL = getApiUrl();

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await axios.get(`${API_URL}/api/coach/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        setProfileData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || '',
          experience: data.years_experience?.toString() || '',
          hourlyRate: data.hourly_rate_usd?.toString() || '',
          qualifications: (() => {
            try {
              const quals = typeof data.qualifications === 'string' 
                ? JSON.parse(data.qualifications) 
                : data.qualifications;
              return Array.isArray(quals) ? quals.join(', ') : (data.qualifications || '');
            } catch {
              return data.qualifications || '';
            }
          })(),
          isAvailable: data.is_available ?? true,
          videoAvailable: data.videoAvailable ?? false,
          inPersonAvailable: data.inPersonAvailable ?? false,
          phoneAvailable: data.phoneAvailable ?? false
        });
        setSelectedSpecialties(data.specialties || []);
        setSelectedLanguages(data.languages || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/coach/profile/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show error for stats, just keep the default values
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  // Helper function to check if a field is valid
  const isFieldValid = (fieldName: string, value: any) => {
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
      case 'email':
        return value && value.trim().length > 0;
      case 'specialties':
        return selectedSpecialties.length > 0;
      case 'languages':
        return selectedLanguages.length > 0;
      default:
        return true;
    }
  };

  // Helper function to get field border color
  const getFieldBorderColor = (fieldName: string, value: any) => {
    if (!editing) return 'border-gray-300';
    return isFieldValid(fieldName, value) ? 'border-green-300' : 'border-red-300';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    // Enhanced validation with detailed error messages
    const validationErrors = [];
    
    if (!profileData.firstName?.trim()) {
      validationErrors.push('❌ First name is required');
    }
    
    if (!profileData.lastName?.trim()) {
      validationErrors.push('❌ Last name is required');
    }
    
    if (!profileData.email?.trim()) {
      validationErrors.push('❌ Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      validationErrors.push('❌ Please enter a valid email address');
    }
    
    if (profileData.experience && (parseInt(profileData.experience) < 0 || parseInt(profileData.experience) > 50)) {
      validationErrors.push('❌ Years of experience must be between 0 and 50');
    }
    
    if (profileData.hourlyRate && (parseFloat(profileData.hourlyRate) < 0 || parseFloat(profileData.hourlyRate) > 1000)) {
      validationErrors.push('❌ Hourly rate must be between $0 and $1000');
    }
    
    if (selectedSpecialties.length === 0) {
      validationErrors.push('❌ Please select at least one specialty');
    }
    
    if (selectedLanguages.length === 0) {
      validationErrors.push('❌ Please select at least one language');
    }
    
    if (validationErrors.length > 0) {
      const errorMessage = `Please fix the following errors:\n\n${validationErrors.join('\n')}`;
      setError(errorMessage);
      setSaving(false);
      return;
    }
    
    try {
      const qualifications = profileData.qualifications
        ? profileData.qualifications.split(',').map(q => q.trim()).filter(q => q)
        : [];

      const updateData = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone?.trim() || null,
        bio: profileData.bio?.trim() || null,
        specialties: selectedSpecialties,
        languages: selectedLanguages,
        qualifications: qualifications.length > 0 ? qualifications : null,
        experience: profileData.experience ? parseInt(profileData.experience) : null,
        hourlyRate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : null,
        isAvailable: profileData.isAvailable,
        videoAvailable: profileData.videoAvailable,
        inPersonAvailable: profileData.inPersonAvailable,
        phoneAvailable: profileData.phoneAvailable
      };

      const response = await axios.put(`${API_URL}/api/coach/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!');
        setEditing(false);
        // Reload profile to get updated data
        await loadProfile();
        
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join('. ');
        setError(errorMessages);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <CoachPageWrapper title="My Profile" description="Manage your professional profile and availability">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </CoachPageWrapper>
    );
  }

  return (
    <CoachPageWrapper title="My Profile" description="Manage your professional profile and availability">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
          <button 
            onClick={() => setSuccessMessage('')}
            className="text-green-500 hover:text-green-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
              {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-lg flex items-start justify-between shadow-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-bold text-lg mb-2">⚠️ Validation Errors</div>
                <div className="whitespace-pre-line text-sm">{error}</div>
              </div>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 ml-4 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your professional details and preferences</CardDescription>
            </div>
            {!editing ? (
              <Button onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    setError('');
                    setSuccessMessage('');
                  }}
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
                      {/* Required Fields Note */}
            {editing && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">
                    Fields marked with <span className="text-red-500 font-bold">*</span> are required.
                    Please ensure all required fields are filled before saving.
                  </span>
                </div>
              </div>
            )}

            {/* Validation Warning */}
            {editing && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    ⚠️ Please fill in all required fields before saving. Empty required fields will prevent the form from being saved.
                  </span>
                </div>
              </div>
            )}

            {/* Form Validation Status */}
            {editing && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Form Validation Status:</span>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm ${profileData.firstName?.trim() ? 'text-green-600' : 'text-red-600'}`}>
                      {profileData.firstName?.trim() ? '✅' : '❌'} First Name
                    </span>
                    <span className={`text-sm ${profileData.lastName?.trim() ? 'text-green-600' : 'text-red-600'}`}>
                      {profileData.lastName?.trim() ? '✅' : '❌'} Last Name
                    </span>
                    <span className={`text-sm ${profileData.email?.trim() ? 'text-green-600' : 'text-red-600'}`}>
                      {profileData.email?.trim() ? '✅' : '❌'} Email
                    </span>
                    <span className={`text-sm ${selectedSpecialties.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedSpecialties.length > 0 ? '✅' : '❌'} Specialties
                    </span>
                    <span className={`text-sm ${selectedLanguages.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedLanguages.length > 0 ? '✅' : '❌'} Languages
                    </span>
                  </div>
                </div>
              </div>
            )}
          
          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Availability Status</h3>
              <p className="text-sm text-gray-500">Toggle your availability for new clients</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileData.isAvailable}
                onChange={(e) => setProfileData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                disabled={!editing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {profileData.isAvailable ? 'Available' : 'Not Available'}
              </span>
            </label>
          </div>

          {/* Session Availability Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Session Types Available</h3>
            <p className="text-sm text-gray-600 mb-4">Select the types of sessions you offer to clients</p>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Video Sessions Only */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h4 className="font-medium text-gray-900">Video Sessions</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Online video calls via secure platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.videoAvailable}
                    onChange={(e) => setProfileData(prev => ({ ...prev, videoAvailable: e.target.checked }))}
                    disabled={!editing}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                rows={4}
                value={profileData.bio}
                onChange={handleChange}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="experience"
                  value={profileData.experience}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={profileData.hourlyRate}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications & Certifications</label>
              <input
                type="text"
                name="qualifications"
                value={profileData.qualifications}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Separate with commas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties <span className="text-red-500">*</span>
              </label>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 ${editing ? 'max-h-48' : ''} overflow-y-auto border border-gray-300 rounded-md p-3`}>
                {editing ? (
                  SPECIALTIES.map((specialty) => (
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
                  ))
                ) : (
                  <div className="col-span-full flex flex-wrap gap-2">
                    {selectedSpecialties.map((specialty) => (
                      <span key={specialty} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages <span className="text-red-500">*</span>
              </label>
              <div className={`grid grid-cols-3 md:grid-cols-4 gap-2 ${editing ? 'max-h-32' : ''} overflow-y-auto border border-gray-300 rounded-md p-3`}>
                {editing ? (
                  LANGUAGES.map((language) => (
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
                  ))
                ) : (
                  <div className="col-span-full flex flex-wrap gap-2">
                    {selectedLanguages.map((language) => (
                      <span key={language} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {language}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </CoachPageWrapper>
  );
}