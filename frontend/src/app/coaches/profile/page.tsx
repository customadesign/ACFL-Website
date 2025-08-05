'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import CoachPageWrapper from '@/components/CoachPageWrapper';
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
    isAvailable: true
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSessions: 0,
    averageRating: 0,
    completionRate: 0
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
          experience: data.experience?.toString() || '',
          hourlyRate: data.hourly_rate?.toString() || '',
          qualifications: Array.isArray(data.qualifications) ? data.qualifications.join(', ') : '',
          isAvailable: data.is_available ?? true
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

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const qualifications = profileData.qualifications
        ? profileData.qualifications.split(',').map(q => q.trim()).filter(q => q)
        : [];

      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone || null,
        bio: profileData.bio || null,
        specialties: selectedSpecialties,
        languages: selectedLanguages,
        qualifications: qualifications.length > 0 ? qualifications : null,
        experience: profileData.experience ? parseInt(profileData.experience) : null,
        hourlyRate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : null,
        isAvailable: profileData.isAvailable
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
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        setError(errorMessages);
      } else {
        setError(error.response?.data?.message || 'Failed to save profile');
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
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
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
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
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