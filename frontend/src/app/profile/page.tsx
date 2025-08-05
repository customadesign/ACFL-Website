'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { User, Edit, Save, X, Calendar, MapPin, Phone, Mail, Shield, Settings, Search, Heart } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
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
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setError('Failed to load profile data')
      }
    }

    loadProfile()
  }, [form])

  const handleSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                alt="ACT Coaching For Life Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900">ACT Coaching For Life</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Welcome, {user?.firstName || 'Client'}</span>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/dashboard">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Dashboard
              </button>
            </Link>
            <Link href="/search-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Search Coaches
              </button>
            </Link>
            <Link href="/saved-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Saved Coaches
              </button>
            </Link>
            <Link href="/appointments">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Appointments
              </button>
            </Link>
            <Link href="/messages">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Messages
              </button>
            </Link>
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm whitespace-nowrap">
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-lg text-gray-600">Manage your personal information and preferences</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700 font-medium"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
            <button 
              onClick={() => setSuccess(null)}
              className="ml-2 text-green-500 hover:text-green-700 font-medium"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/search-coaches')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find New Coaches
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/saved-coaches')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  View Saved Coaches
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/appointments')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Appointments
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Edit Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Edit className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={form.handleSubmit(handleSubmit)} disabled={isLoading}>
                          <Save className="w-4 h-4 mr-2" />
                          {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isEditing} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isEditing} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(STATE_NAMES).map(([code, name]) => (
                                  <SelectItem key={code} value={code}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Demographics */}
                    {isEditing && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Demographics</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="genderIdentity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gender Identity</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select gender identity" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {genderIdentityOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ethnicIdentity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ethnic Identity</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select ethnic identity" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {ethnicIdentityOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="religiousBackground"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Religious Background</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select religious background" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {religiousBackgroundOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preferred Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select preferred language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {LANGUAGES.map((language) => (
                                      <SelectItem key={language} value={language}>
                                        {language}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Coaching Preferences */}
                    {isEditing && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Coaching Preferences</h3>
                        
                        <FormField
                          control={form.control}
                          name="areaOfConcern"
                          render={() => (
                            <FormItem>
                              <FormLabel>Areas of Concern</FormLabel>
                              <FormDescription>Select all that apply</FormDescription>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                {concernOptions.map((option) => (
                                  <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="areaOfConcern"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(option.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, option.id])
                                                : field.onChange(
                                                    field.value?.filter((value) => value !== option.id)
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm">
                                          {option.label}
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="availability"
                          render={() => (
                            <FormItem>
                              <FormLabel>Preferred Availability</FormLabel>
                              <FormDescription>Select all that apply</FormDescription>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                {availabilityOptions.map((option) => (
                                  <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="availability"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(option.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, option.id])
                                                : field.onChange(
                                                    field.value?.filter((value) => value !== option.id)
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm">
                                          {option.label}
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="therapistGender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Coach Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select preferred coach gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="any">Any gender</SelectItem>
                                  {genderIdentityOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Bio */}
                    {isEditing && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                        
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormDescription>Tell coaches a bit about yourself</FormDescription>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Share your background, goals, or what you're looking for in coaching..."
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Read-only view when not editing */}
                    {!isEditing && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Current Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                            <p className="text-gray-900">{form.watch('genderIdentity') || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Preferred Coach Gender</p>
                            <p className="text-gray-900">{form.watch('therapistGender') === 'any' ? 'Any gender' : form.watch('therapistGender') || 'Not specified'}</p>
                          </div>
                        </div>

                        {form.watch('areaOfConcern')?.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 mb-2">Areas of Concern</p>
                            <div className="flex flex-wrap gap-2">
                              {form.watch('areaOfConcern').map((concern) => {
                                const option = concernOptions.find(c => c.id === concern)
                                return (
                                  <span key={concern} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {option?.label || concern}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {form.watch('availability')?.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 mb-2">Preferred Availability</p>
                            <div className="flex flex-wrap gap-2">
                              {form.watch('availability').map((avail) => {
                                const option = availabilityOptions.find(a => a.id === avail)
                                return (
                                  <span key={avail} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    {option?.label || avail}
                                  </span>
                                )
                              })}
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