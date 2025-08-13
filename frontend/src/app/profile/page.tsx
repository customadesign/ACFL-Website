'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/lib/api'
import { User, Edit, Save, X, Calendar, Clock, MapPin, Phone, Mail, Shield, Settings, Search, Heart } from 'lucide-react'
import { STATE_NAMES } from '@/constants/states'
import { 
  concernOptions, 
  genderIdentityOptions, 
  ethnicIdentityOptions, 
  religiousBackgroundOptions, 
  availabilityOptions 
} from '@/constants/formOptions'
import { LANGUAGES } from '@/constants/languages'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Form validation schema
const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  genderIdentity: z.string().optional(),
  ethnicIdentity: z.string().optional(),
  religiousBackground: z.string().optional(),
  language: z.string().optional(),
  areaOfConcern: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  therapistGender: z.string().optional(),
  bio: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

function ProfileContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    savedCoaches: 0,
    memberSince: 'N/A'
  })

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      genderIdentity: '',
      ethnicIdentity: '',
      religiousBackground: '',
      language: '',
      areaOfConcern: [],
      availability: [],
      therapistGender: '',
      bio: '',
    },
  })

  // Load user profile data and stats
  useEffect(() => {
    const loadProfileAndStats = async () => {
      try {
        setLoadingProfile(true)
        const API_URL = getApiUrl()
        
        // Load profile data
        const response = await fetch(`${API_URL}/api/client/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            const userData = data.data
            form.setValue('firstName', userData.firstName || userData.first_name || '')
            form.setValue('lastName', userData.lastName || userData.last_name || '')
            form.setValue('email', userData.email || '')
            form.setValue('phone', userData.phone || '')
            form.setValue('location', userData.location || userData.preferences?.location || '')
            form.setValue('genderIdentity', userData.genderIdentity || userData.preferences?.genderIdentity || '')
            form.setValue('ethnicIdentity', userData.ethnicIdentity || userData.preferences?.ethnicIdentity || '')
            form.setValue('religiousBackground', userData.religiousBackground || userData.preferences?.religiousBackground || '')
            form.setValue('language', userData.language || userData.preferences?.language || '')
            form.setValue('areaOfConcern', userData.areaOfConcern || userData.preferences?.areaOfConcern || [])
            form.setValue('availability', userData.availability || userData.preferences?.availability || [])
            form.setValue('therapistGender', userData.therapistGender || userData.preferences?.therapistGender || '')
            form.setValue('bio', userData.bio || '')
            
            // Set member since date
            if (userData.created_at) {
              setStats(prev => ({
                ...prev,
                memberSince: new Date(userData.created_at).toLocaleDateString()
              }))
            }
          }
        }
        
        // Load stats (placeholder - could be expanded with real API calls)
        setStats(prev => ({
          ...prev,
          totalSessions: 0, // TODO: Get from appointments API
          upcomingSessions: 0, // TODO: Get from appointments API  
          savedCoaches: 0 // TODO: Get from saved coaches API
        }))
        
      } catch (error) {
        console.error('Error loading profile:', error)
        setError('Failed to load profile data')
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfileAndStats()
  }, [form])

  const handleSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setSuccess(null)
    // Reset form to original values
    form.reset()
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-lg text-gray-600">Manage your personal information and preferences</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saved Coaches</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.savedCoaches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <User className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Member Since</p>
                  <p className="text-xl font-bold text-gray-900">{stats.memberSince}</p>
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
                <CardDescription>Update your personal details and preferences</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={form.handleSubmit(handleSubmit)}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={form.watch('firstName')}
                        onChange={(e) => form.setValue('firstName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={form.watch('lastName')}
                        onChange={(e) => form.setValue('lastName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.watch('email')}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={form.watch('phone')}
                        onChange={(e) => form.setValue('phone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      value={form.watch('location')}
                      onChange={(e) => form.setValue('location', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select your state</option>
                      {Object.entries(STATE_NAMES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={form.watch('bio') || ''}
                      onChange={(e) => form.setValue('bio', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Tell coaches about yourself, your goals, or what you're looking for in coaching..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Preferences */}
                {isEditing && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                        <select
                          value={form.watch('language')}
                          onChange={(e) => form.setValue('language', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select preferred language</option>
                          {LANGUAGES.map((language) => (
                            <option key={language} value={language}>
                              {language}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender Identity</label>
                        <select
                          value={form.watch('genderIdentity')}
                          onChange={(e) => form.setValue('genderIdentity', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select gender identity</option>
                          {genderIdentityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Read-only view when not editing */}
                {!isEditing && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Current Information</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">First Name</p>
                          <p className="text-gray-900">{form.watch('firstName') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Last Name</p>
                          <p className="text-gray-900">{form.watch('lastName') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Email</p>
                          <p className="text-gray-900">{form.watch('email') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Phone Number</p>
                          <p className="text-gray-900">{form.watch('phone') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Location</p>
                          <p className="text-gray-900">{form.watch('location') ? STATE_NAMES[form.watch('location')] : 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Language</p>
                          <p className="text-gray-900">{form.watch('language') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Gender Identity</p>
                          <p className="text-gray-900">{(genderIdentityOptions.find(o => o.value === form.watch('genderIdentity'))?.label) || form.watch('genderIdentity') || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {form.watch('bio') && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Bio</p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-900">{form.watch('bio')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Profile() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <ProfileContent />
    </ProtectedRoute>
  )
} 