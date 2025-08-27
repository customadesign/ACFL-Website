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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileCardSkeleton from '@/components/ProfileCardSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/lib/api'
import { User, Edit, Save, X, Calendar, Clock, MapPin, Phone, Mail, Shield, Settings, Search, Heart, RefreshCw } from 'lucide-react'
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
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [openLocation, setOpenLocation] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
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

  const loadProfileAndStats = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setLoadingProfile(true)
      }
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
      setInitialLoad(false)
    }
  }

  // Load user profile data and stats
  useEffect(() => {
    loadProfileAndStats()
  }, [form])

  const refreshData = async () => {
    setIsLoading(true)
    await loadProfileAndStats(true)
    setIsLoading(false)
  }

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

  // Remove full page loading - we now use skeleton loading

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Manage your personal information and preferences</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="h-8 px-3 dark:bg-gray-800 dark:text-gray-100"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Stats Overview */}
        {initialLoad ? (
          <div className="mb-8">
            <ProfileCardSkeleton type="stats" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Sessions</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Upcoming Sessions</p>
                    <p className="text-2xl font-bold text-foreground">{stats.upcomingSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Saved Coaches</p>
                    <p className="text-2xl font-bold text-foreground">{stats.savedCoaches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <User className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Member Since</p>
                    <p className="text-xl font-bold text-foreground">{stats.memberSince}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Form */}
        {initialLoad ? (
          <ProfileCardSkeleton type="form" />
        ) : (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription className="dark:text-gray-300">Update your personal details and preferences</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 dark:text-white">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={form.handleSubmit(handleSubmit)}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 dark:text-white"
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
            {/* Required Fields Note */}
            {isEditing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">
                    Fields marked with <span className="text-red-500 font-bold">*</span> are required.
                  </span>
                </div>
              </div>
            )}
            <Form {...form}>
              <form className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                      
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">First Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.watch('firstName')}
                        onChange={(e) => form.setValue('firstName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Last Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.watch('lastName')}
                        onChange={(e) => form.setValue('lastName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={form.watch('email')}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={form.watch('phone')}
                        onChange={(e) => form.setValue('phone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Location <span className="text-red-500">*</span></label>
                    <Popover
                      modal={false}
                      open={openLocation}
                      onOpenChange={(open) => {
                        if (!isEditing) return
                        setOpenLocation(open)
                        if (open) setLocationQuery('')
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={openLocation}
                          disabled={!isEditing}
                          className="w-full justify-between bg-white dark:bg-gray-800"
                        >
                          {form.watch('location') ? (STATE_NAMES as any)[form.watch('location')] || 'Select your state' : 'Select your state'}
                          <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="p-0 w-72 sm:w-96">
                        <div className="p-2">
                          <Input
                            placeholder="Search states..."
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-[300px] overflow-y-auto">
                            {Object.entries(STATE_NAMES)
                              .filter(([code, name]) =>
                                name.toLowerCase().includes(locationQuery.toLowerCase()) ||
                                code.toLowerCase().includes(locationQuery.toLowerCase())
                              )
                              .map(([code, name]) => (
                                <div
                                  key={code}
                                  role="option"
                                  tabIndex={0}
                                  aria-selected={form.watch('location') === code}
                                  className={`w-full cursor-pointer text-left px-3 py-2 rounded hover:bg-accent ${form.watch('location') === code ? 'bg-accent' : ''}`}
                                  onPointerDown={(e) => {
                                    e.preventDefault()
                                    form.setValue('location', code)
                                    setOpenLocation(false)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      form.setValue('location', code)
                                      setOpenLocation(false)
                                    }
                                  }}
                                  onClick={() => {
                                    form.setValue('location', code)
                                    setOpenLocation(false)
                                  }}
                                >
                                  {name}
                                </div>
                              ))}
                            {Object.entries(STATE_NAMES)
                              .filter(([code, name]) =>
                                name.toLowerCase().includes(locationQuery.toLowerCase()) ||
                                code.toLowerCase().includes(locationQuery.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">No states found.</div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About Me</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Bio</label>
                    <textarea
                      value={form.watch('bio') || ''}
                      onChange={(e) => form.setValue('bio', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Tell coaches about yourself, your goals, or what you're looking for in coaching..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100  bg-white dark:bg-background text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Preferred Language</label>
                      <select
                        value={form.watch('language')}
                        onChange={(e) => form.setValue('language', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Gender Identity</label>
                      <select
                        value={form.watch('genderIdentity')}
                        onChange={(e) => form.setValue('genderIdentity', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted"
                      >
                        <option value="">Select gender identity</option>
                        {genderIdentityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Ethnic Identity</label>
                      <select
                        value={form.watch('ethnicIdentity')}
                        onChange={(e) => form.setValue('ethnicIdentity', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted"
                      >
                        <option value="">Select ethnic identity</option>
                        {ethnicIdentityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Religious Background</label>
                      <select
                        value={form.watch('religiousBackground')}
                        onChange={(e) => form.setValue('religiousBackground', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted"
                      >
                        <option value="">Select religious background</option>
                        {religiousBackgroundOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Read-only view when not editing */}
                {!isEditing && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Information</h3>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">First Name</p>
                          <p className="text-gray-900 dark:text-gray-100">{form.watch('firstName') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Last Name</p>
                          <p className="text-gray-900 dark:text-gray-100">{form.watch('lastName') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-gray-100">{form.watch('email') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Phone Number</p>
                          <p className="text-gray-900 dark:text-gray-100">{form.watch('phone') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Location</p>
                          <p className="text-gray-900 dark:text-gray-100">{form.watch('location') ? STATE_NAMES[form.watch('location')] : 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Language</p>
                          <p className="text-gray-900 dark:text-gray-100">{form.watch('language') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Gender Identity</p>
                          <p className="text-gray-900 dark:text-gray-100">{(genderIdentityOptions.find(o => o.value === form.watch('genderIdentity'))?.label) || form.watch('genderIdentity') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Ethnic Identity</p>
                          <p className="text-gray-900 dark:text-gray-100">{(ethnicIdentityOptions.find(o => o.value === form.watch('ethnicIdentity'))?.label) || form.watch('ethnicIdentity') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-400">Religious Background</p>
                          <p className="text-gray-900 dark:text-gray-100">{(religiousBackgroundOptions.find(o => o.value === form.watch('religiousBackground'))?.label) || form.watch('religiousBackground') || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {form.watch('bio') && (
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</p>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-900 dark:text-gray-100">{form.watch('bio')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
        )}
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