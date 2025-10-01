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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileCardSkeleton from '@/components/ProfileCardSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/lib/api'
import { User, Edit, Save, X, Calendar, Clock, MapPin, Mail, Shield, Settings, Search, Heart, RefreshCw, Camera, Upload, Bell, BellOff, Volume2, VolumeX, MessageCircle, UserX, Download, FileText, FileImage, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
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
  profilePhoto: z.string().optional(),
  // Notification preferences
  pushNotifications: z.boolean().optional(),
  soundNotifications: z.boolean().optional(),
  messageNotifications: z.boolean().optional(),
  appointmentNotifications: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

function ProfileContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingNotifications, setIsEditingNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
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

  // Export and deletion state
  const [isExporting, setIsExporting] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletionStatus, setDeletionStatus] = useState<any>(null)
  const [loadingDeletionStatus, setLoadingDeletionStatus] = useState(false)

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
      profilePhoto: '',
      // Notification preferences defaults
      pushNotifications: true,
      soundNotifications: true,
      messageNotifications: true,
      appointmentNotifications: true,
      appointmentReminders: true,
      marketingEmails: false,
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
          form.setValue('profilePhoto', userData.profilePhoto || '')

          // Load notification preferences (with defaults if not set)
          const notificationPrefs = userData.notificationPreferences || {}
          form.setValue('pushNotifications', notificationPrefs.pushNotifications ?? true)
          form.setValue('soundNotifications', notificationPrefs.soundNotifications ?? true)
          form.setValue('messageNotifications', notificationPrefs.messageNotifications ?? true)
          form.setValue('appointmentNotifications', notificationPrefs.appointmentNotifications ?? true)
          form.setValue('appointmentReminders', notificationPrefs.appointmentReminders ?? true)
          form.setValue('marketingEmails', notificationPrefs.marketingEmails ?? false)
          
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
  }

  const handleNotificationSubmit = async () => {
    setIsLoadingNotifications(true)
    setError(null)
    setSuccess(null)

    try {
      const API_URL = getApiUrl()

      // Extract only notification preferences from form
      const notificationData = {
        pushNotifications: form.getValues('pushNotifications'),
        soundNotifications: form.getValues('soundNotifications'),
        messageNotifications: form.getValues('messageNotifications'),
        appointmentNotifications: form.getValues('appointmentNotifications'),
        appointmentReminders: form.getValues('appointmentReminders'),
        marketingEmails: form.getValues('marketingEmails'),
      }

      const response = await fetch(`${API_URL}/api/client/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationData)
      })

      if (response.ok) {
        setSuccess('Notification preferences updated successfully!')
        setIsEditingNotifications(false)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update notification preferences')
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      setError('Failed to update notification preferences')
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const handleNotificationCancel = () => {
    setIsEditingNotifications(false)
    setError(null)
    setSuccess(null)
    // Reload profile to reset notification preferences
    loadProfileAndStats()
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    try {
      const API_URL = getApiUrl()
      const formData = new FormData()
      formData.append('attachment', file)

      const response = await fetch(`${API_URL}/api/client/upload-attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const photoUrl = data.data.url
        form.setValue('profilePhoto', photoUrl)
        
        // Save the photo URL to the database
        const updateResponse = await fetch(`${API_URL}/api/client/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ profilePhoto: photoUrl })
        })

        if (updateResponse.ok) {
          setSuccess('Profile photo updated successfully!')
          await loadProfileAndStats() // Reload profile to get updated data
          setTimeout(() => setSuccess(''), 3000)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to upload photo')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      setError('Failed to upload photo. Please try again.')
    }
  }

  // Export data function
  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true)
      setError(null)
      setSuccess(null)

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/export-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ format })
      })

      if (response.ok) {
        // Create a blob from the response and trigger download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `client-data-export-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        setSuccess(`Your data export (${format.toUpperCase()}) has been downloaded successfully.`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to export data')
      }
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Deletion functions
  const fetchDeletionStatus = async () => {
    try {
      setLoadingDeletionStatus(true)
      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/deletion-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeletionStatus(data.data)
      } else {
        // Set default active status if API fails
        setDeletionStatus({
          isActive: true,
          hasPendingDeletion: false,
          deletion: null
        })
      }
    } catch (error) {
      console.error('Error fetching deletion status:', error)
      // Set default active status if API fails
      setDeletionStatus({
        isActive: true,
        hasPendingDeletion: false,
        deletion: null
      })
    } finally {
      setLoadingDeletionStatus(false)
    }
  }

  const handleRequestDeletion = async () => {
    try {
      setIsExporting(true)
      setError(null)
      setSuccess(null)

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/request-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: deletionReason })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account deletion has been scheduled. Your account is now deactivated and will be permanently deleted in 30 days.')
        setShowDeleteDialog(false)
        setDeletionReason('')
        await fetchDeletionStatus()
      } else {
        setError(data.message || 'Failed to request account deletion')
      }
    } catch (error) {
      console.error('Deletion request error:', error)
      setError('Failed to request account deletion. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCancelDeletion = async () => {
    try {
      setIsExporting(true)
      setError(null)
      setSuccess(null)

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/cancel-deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account deletion has been cancelled. Your account has been reactivated.')
        await fetchDeletionStatus()
      } else {
        setError(data.message || 'Failed to cancel account deletion')
      }
    } catch (error) {
      console.error('Cancel deletion error:', error)
      setError('Failed to cancel account deletion. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilDeletion = (deletionDate: string) => {
    const days = Math.ceil((new Date(deletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  // Load deletion status on component mount
  useEffect(() => {
    fetchDeletionStatus()
  }, [])

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

        {/* Profile Photo Section */}
        {initialLoad ? (
          <ProfileCardSkeleton type="form" />
        ) : (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Photo
              </CardTitle>
              <CardDescription>Upload a professional photo for your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative flex-shrink-0">
                  {form.watch('profilePhoto') ? (
                    <img
                      src={form.watch('profilePhoto')}
                      alt="Profile"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 touch-manipulation">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold">{form.watch('firstName')} {form.watch('lastName')}</h3>
                  <p className="text-gray-600 break-words">{form.watch('email')}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click the upload button to change your profile photo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Notification Preferences */}
        {initialLoad ? (
          <ProfileCardSkeleton type="form" />
        ) : (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">
                    Choose how and when you want to receive notifications
                  </CardDescription>
                </div>
                {!isEditingNotifications ? (
                  <Button onClick={() => setIsEditingNotifications(true)} className="bg-blue-600 hover:bg-blue-700 dark:text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Settings
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleNotificationSubmit}
                      disabled={isLoadingNotifications}
                      className="bg-green-600 hover:bg-green-700 dark:text-white"
                    >
                      {isLoadingNotifications ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={handleNotificationCancel}
                      variant="outline"
                      disabled={isLoadingNotifications}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Notification Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-purple-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications in your browser</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={form.watch('pushNotifications')}
                      onCheckedChange={(checked) => form.setValue('pushNotifications', !!checked)}
                      disabled={!isEditingNotifications}
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center space-x-3">
                      {form.watch('soundNotifications') ? (
                        <Volume2 className="w-5 h-5 text-orange-600" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Sound Notifications</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Play sound with notifications</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={form.watch('soundNotifications')}
                      onCheckedChange={(checked) => form.setValue('soundNotifications', !!checked)}
                      disabled={!isEditingNotifications}
                      className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">New Messages</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when you receive new messages</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={form.watch('messageNotifications')}
                      onCheckedChange={(checked) => form.setValue('messageNotifications', !!checked)}
                      disabled={!isEditingNotifications}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Appointment Updates</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about appointment changes, confirmations, and cancellations</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={form.watch('appointmentNotifications')}
                      onCheckedChange={(checked) => form.setValue('appointmentNotifications', !!checked)}
                      disabled={!isEditingNotifications}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Appointment Reminders</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Get reminder notifications before your appointments</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={form.watch('appointmentReminders')}
                      onCheckedChange={(checked) => form.setValue('appointmentReminders', !!checked)}
                      disabled={!isEditingNotifications}
                      className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Marketing Emails</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates about new features and promotions</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={form.watch('marketingEmails')}
                      onCheckedChange={(checked) => form.setValue('marketingEmails', !!checked)}
                      disabled={!isEditingNotifications}
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Read-only view when not editing */}
              {!isEditingNotifications && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Settings</h3>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notification Methods</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.watch('pushNotifications') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {form.watch('pushNotifications') ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Sound Notifications</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.watch('soundNotifications') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {form.watch('soundNotifications') ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notification Types</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">New Messages</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.watch('messageNotifications') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {form.watch('messageNotifications') ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Appointment Updates</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.watch('appointmentNotifications') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {form.watch('appointmentNotifications') ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Appointment Reminders</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.watch('appointmentReminders') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {form.watch('appointmentReminders') ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Marketing Emails</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.watch('marketingEmails') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {form.watch('marketingEmails') ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account Status */}
        {!loadingDeletionStatus && deletionStatus && deletionStatus.isActive !== undefined && (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Account Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Status:</span>
                  <div className="flex items-center space-x-2">
                    {deletionStatus.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600">Deactivated</span>
                      </>
                    )}
                  </div>
                </div>

                {deletionStatus.hasPendingDeletion && deletionStatus.deletion && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-800 mb-2">Account Deletion Scheduled</h4>
                        <div className="space-y-2 text-sm text-red-700">
                          <p>
                            <strong>Deactivated:</strong> {formatDate(deletionStatus.deletion.deactivated_at)}
                          </p>
                          <p>
                            <strong>Scheduled Deletion:</strong> {formatDate(deletionStatus.deletion.scheduled_deletion_at)}
                          </p>
                          <p>
                            <strong>Days Remaining:</strong> {getDaysUntilDeletion(deletionStatus.deletion.scheduled_deletion_at)} days
                          </p>
                          {deletionStatus.deletion.reason && (
                            <p>
                              <strong>Reason:</strong> {deletionStatus.deletion.reason}
                            </p>
                          )}
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={handleCancelDeletion}
                            disabled={isExporting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isExporting ? 'Cancelling...' : 'Cancel Deletion'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Export */}
        {initialLoad ? (
          <ProfileCardSkeleton type="form" />
        ) : (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Your Data</span>
              </CardTitle>
              <CardDescription>
                Download a copy of all your personal data, including profile information, session history, messages, and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-semibold mb-2">CSV Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download your data in CSV format, suitable for spreadsheet applications.
                    </p>
                    <Button
                      onClick={() => handleExportData('csv')}
                      disabled={isExporting}
                      className="w-full"
                    >
                      {isExporting ? 'Generating...' : 'Download CSV'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <FileImage className="w-12 h-12 mx-auto mb-4 text-red-600" />
                    <h3 className="font-semibold mb-2">PDF Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a comprehensive PDF report of your data.
                    </p>
                    <Button
                      onClick={() => handleExportData('pdf')}
                      disabled={isExporting}
                      variant="outline"
                      className="w-full"
                    >
                      {isExporting ? 'Generating...' : 'Download PDF'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Deletion */}
        {(!deletionStatus || !deletionStatus.hasPendingDeletion) && (
          <Card className="border-red-200 bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <UserX className="w-5 h-5" />
                <span>Delete Account</span>
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">What happens when you delete your account:</h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    <li>Your account will be immediately deactivated</li>
                    <li>You will lose access to all your data and sessions</li>
                    <li>Your data will be permanently deleted after 30 days</li>
                    <li>You can cancel the deletion within 30 days by contacting support</li>
                    <li>This action cannot be undone after the 30-day period</li>
                  </ul>
                </div>

                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete your account? This will immediately deactivate your account and schedule it for permanent deletion in 30 days.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Reason for deletion (optional)</Label>
                        <Textarea
                          id="reason"
                          placeholder="Let us know why you're deleting your account..."
                          value={deletionReason}
                          onChange={(e) => setDeletionReason(e.target.value)}
                          maxLength={500}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={isExporting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleRequestDeletion}
                        disabled={isExporting}
                      >
                        {isExporting ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
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