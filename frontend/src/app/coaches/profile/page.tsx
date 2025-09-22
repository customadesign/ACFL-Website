
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import CoachPageWrapper from '@/components/CoachPageWrapper';
import ProfileCardSkeleton from '@/components/ProfileCardSkeleton';
import { getApiUrl } from '@/lib/api';
import axios from 'axios';
import { availabilityOptions, therapyModalityOptions, genderIdentityOptions } from '@/constants/formOptions';
import { STATE_NAMES } from '@/constants/states';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Camera, Upload, User, Award, Clock, Shield, Heart, Globe, Settings, UserX, Download, FileText, FileImage, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SPECIALTIES = [
  'Anxiety', 'Depression', 'PTSD', 'Addiction', 'Relationships', 'Stress Management',
  'Career Coaching', 'Life Coaching', 'Grief Counseling', 'Anger Management',
  'Eating Disorders', 'Family Therapy', 'Couples Therapy', 'Teen Counseling'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch'
];

const COACHING_TECHNIQUES = [
  'Cognitive Behavioral Techniques',
  'Mindfulness practices',
  'Goal setting & action planning',
  'Values clarification',
  'Solution-focused techniques',
  'Motivational interviewing',
  'Positive psychology',
  'Somatic/body-based approaches',
  'Visualization & imagery',
  'Journaling exercises'
];

const PROFESSIONAL_CERTIFICATIONS = [
  'ICF (International Coach Federation) Certified',
  'Board Certified Coach (BCC)',
  'ACT Training Certificate',
  'Mental Health First Aid',
  'Other coaching certifications',
  'No formal certifications'
];

export default function CoachProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openLocation, setOpenLocation] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Export and deletion state
  const [isExporting, setIsExporting] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<any>(null);
  const [loadingDeletionStatus, setLoadingDeletionStatus] = useState(false);
  
  const [profileData, setProfileData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    profilePhoto: '',
    
    // Professional Information
    experience: '',
    hourlyRate: '',
    qualifications: '',
    location: '',
    customLocation: '',
    genderIdentity: '',
    isAvailable: true,
    videoAvailable: false,
    availability_options: [] as string[],
    
    // Application Data - Professional Background
    educationalBackground: '',
    coachingExperienceYears: '',
    professionalCertifications: [] as string[],
    
    // Specialization & Expertise
    coachingExpertise: [] as string[],
    ageGroupsComfortable: [] as string[],
    actTrainingLevel: '',
    
    // Approach & Methodology
    coachingPhilosophy: '',
    coachingTechniques: [] as string[],
    sessionStructure: '',
    
    // Professional Boundaries & Ethics
    scopeHandlingApproach: '',
    professionalDisciplineHistory: false,
    disciplineExplanation: '',
    boundaryMaintenanceApproach: '',
    
    // Crisis Management
    comfortableWithSuicidalThoughts: '',
    selfHarmProtocol: '',
    
    // Availability & Commitment
    weeklyHoursAvailable: '',
    preferredSessionLength: '',
    availabilityTimes: [] as string[],
    
    // Technology & Communication
    videoConferencingComfort: '',
    internetConnectionQuality: '',
    
    // Languages & Cultural Competency
    languagesFluent: [] as string[],
    
    // Professional References
    references: [] as Array<{
      name: string;
      title: string;
      organization: string;
      email: string;
      phone?: string;
    }>
  });

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTherapyModalities, setSelectedTherapyModalities] = useState<string[]>([]);
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

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadProfile(true), loadStats(true)]);
    setLoading(false);
  };

  const loadProfile = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setLoadingProfile(true);
      }
      
      // Load coach profile
      const response = await axios.get(`${API_URL}/api/coach/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        console.log('Profile data received:', data);
        
        // Try to get application data if available
        let applicationData = null;
        try {
          const appResponse = await axios.get(`${API_URL}/api/coach/application-data`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (appResponse.data.success && appResponse.data.data) {
            applicationData = appResponse.data.data;
          }
        } catch (appError) {
          console.log('Could not load application data:', appError);
        }

        setProfileData({
          // Basic Information
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || applicationData?.coaching_philosophy || '',
          profilePhoto: data.profile_photo || '',
          
          // Professional Information
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
          availability_options: data.demographics?.availability_options || [],
          location: 'none',
          customLocation: '',
          genderIdentity: data.demographics?.gender_identity || '',
          
          // Application Data - Professional Background
          educationalBackground: applicationData?.educational_background || '',
          coachingExperienceYears: applicationData?.coaching_experience_years || '',
          professionalCertifications: applicationData?.professional_certifications || [],
          
          // Specialization & Expertise
          coachingExpertise: applicationData?.coaching_expertise || [],
          ageGroupsComfortable: applicationData?.age_groups_comfortable || [],
          actTrainingLevel: applicationData?.act_training_level || '',
          
          // Approach & Methodology
          coachingPhilosophy: applicationData?.coaching_philosophy || data.bio || '',
          coachingTechniques: applicationData?.coaching_techniques || [],
          sessionStructure: applicationData?.session_structure || '',
          
          // Professional Boundaries & Ethics
          scopeHandlingApproach: applicationData?.scope_handling_approach || '',
          professionalDisciplineHistory: applicationData?.professional_discipline_history || false,
          disciplineExplanation: applicationData?.discipline_explanation || '',
          boundaryMaintenanceApproach: applicationData?.boundary_maintenance_approach || '',
          
          // Crisis Management
          comfortableWithSuicidalThoughts: applicationData?.comfortable_with_suicidal_thoughts || '',
          selfHarmProtocol: applicationData?.self_harm_protocol || '',
          
          // Availability & Commitment
          weeklyHoursAvailable: applicationData?.weekly_hours_available || '',
          preferredSessionLength: applicationData?.preferred_session_length || '',
          availabilityTimes: applicationData?.availability_times || [],
          
          // Technology & Communication
          videoConferencingComfort: applicationData?.video_conferencing_comfort || '',
          internetConnectionQuality: applicationData?.internet_connection_quality || '',
          
          // Languages & Cultural Competency
          languagesFluent: applicationData?.languages_fluent || [],
          
          // Professional References
          references: applicationData?.references || []
        });

        setSelectedSpecialties(data.specialties || applicationData?.coaching_expertise || []);
        setSelectedLanguages(data.languages || applicationData?.languages_fluent || []);
        setSelectedTherapyModalities(data.therapy_modalities || []);
        
        // Load location from demographics if available
        if (data.demographics && data.demographics.location) {
          const location = data.demographics.location;
          const validLocationCodes = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
            'CA-ON', 'CA-BC', 'CA-AB', 'CA-QC', 'UK-LON', 'UK-MAN', 'UK-BIR', 'AU-NSW', 'AU-VIC', 'AU-QLD', 'DE-BER', 'DE-MUN', 'FR-PAR', 'FR-LYO', 'ES-MAD', 'ES-BAR', 'IT-ROME', 'IT-MIL', 'NL-AMS', 'JP-TOK', 'JP-OSA', 'KR-SEO', 'SG-SIN', 'IN-MH', 'IN-DL', 'BR-SP', 'BR-RJ', 'MX-CMX', 'MX-JAL'
          ];
          
          if (validLocationCodes.includes(location)) {
            setProfileData(prev => ({ ...prev, location: location, customLocation: '' }));
          } else {
            setProfileData(prev => ({ ...prev, location: 'custom', customLocation: location }));
          }
        } else {
          setProfileData(prev => ({ ...prev, location: 'none', customLocation: '' }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoadingProfile(false);
      setInitialLoad(false);
    }
  };

  const loadStats = async (isRefresh: boolean = false) => {
    try {
      const response = await axios.get(`${API_URL}/api/coach/profile/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        console.log('Coach stats received:', response.data.data);
        const statsData = response.data.data;
        setStats({
          totalClients: statsData.totalClients || 0,
          totalSessions: statsData.totalSessions || 0,
          averageRating: statsData.averageRating || 0,
          completionRate: statsData.completionRate || statsData.completion_rate || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setProfileData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
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
        therapy_modalities: selectedTherapyModalities,
        qualifications: qualifications.length > 0 ? qualifications : null,
        experience: profileData.experience ? parseInt(profileData.experience) : null,
        hourlyRate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : null,
        isAvailable: profileData.isAvailable,
        videoAvailable: profileData.videoAvailable,
        availability_options: profileData.availability_options,
        location: profileData.location === 'custom' ? profileData.customLocation?.trim() || null : 
                 profileData.location === 'none' ? null : profileData.location,
        ...(profileData.genderIdentity ? { genderIdentity: profileData.genderIdentity } : {}),
        // Application data fields
        educationalBackground: profileData.educationalBackground?.trim() || null,
        coachingExperienceYears: profileData.coachingExperienceYears || null,
        professionalCertifications: profileData.professionalCertifications,
        coachingExpertise: profileData.coachingExpertise,
        ageGroupsComfortable: profileData.ageGroupsComfortable,
        actTrainingLevel: profileData.actTrainingLevel || null
      };

      console.log('Frontend sending updateData:', updateData);

      const response = await axios.put(`${API_URL}/api/coach/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!');
        setEditing(false);
        await loadProfile();
        
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const response = await axios.post(`${API_URL}/api/coach/upload-attachment`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const photoUrl = response.data.data.url;
        setProfileData(prev => ({ ...prev, profilePhoto: photoUrl }));
        
        // Save the photo URL to the database
        const updateResponse = await axios.put(`${API_URL}/api/coach/profile`, {
          profilePhoto: photoUrl
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (updateResponse.data.success) {
          setSuccessMessage('Profile photo updated successfully!');
          await loadProfile(); // Reload profile to get updated data
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. Please try again.');
    }
  };

  // Export data function
  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true)
      setError('')
      setSuccessMessage('')

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/coach/export-data`, {
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
        a.download = `coach-data-export-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        setSuccessMessage(`Your data export (${format.toUpperCase()}) has been downloaded successfully.`)
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
      const response = await fetch(`${API_URL}/api/coach/deletion-status`, {
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
      setError('')
      setSuccessMessage('')

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/coach/request-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: deletionReason })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Account deletion has been scheduled. Your account is now deactivated and will be permanently deleted in 30 days.')
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
      setError('')
      setSuccessMessage('')

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/coach/cancel-deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Account deletion has been cancelled. Your account has been reactivated.')
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

  return (
    <>
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <CoachPageWrapper title="My Profile" description="Manage your professional profile and credentials">
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
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 ml-4 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Overview with Refresh Button */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">Profile Overview</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="h-10 sm:h-8 px-3 dark:text-white touch-manipulation"
          >
            <RefreshCw className={`w-4 h-4 mr-2 dark:text-white ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300 truncate">Total Clients</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300 truncate">Total Sessions</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300 truncate">Average Rating</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.averageRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300 truncate">Completion</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.completionRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Profile Management */}
      {initialLoad ? (
        <ProfileCardSkeleton type="form" />

      ) : (
        <div className="space-y-6">
          {/* Profile Photo Section */}
          <Card className="bg-card border-border">
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
                  {profileData.profilePhoto ? (
                    <img
                      src={profileData.profilePhoto}
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
                  <h3 className="text-lg font-semibold">{profileData.firstName} {profileData.lastName}</h3>
                  <p className="text-gray-600 break-words">{profileData.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click the upload button to change your profile photo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Profile Sections */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Professional Profile</CardTitle>
                  <CardDescription>Comprehensive profile management based on your application</CardDescription>
                </div>
                {!editing ? (
                  <Button onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700 dark:text-white min-h-[44px] touch-manipulation">
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 flex items-center dark:text-white min-h-[44px] touch-manipulation"
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
                      className="dark:text-white min-h-[44px] touch-manipulation"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto pb-2 sm:pb-0" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {[
                    { id: 'basic', label: 'Basic Info', icon: User },
                    { id: 'professional', label: 'Professional', icon: Award },
                    { id: 'specialization', label: 'Specialization', icon: Heart },
                    { id: 'approach', label: 'Approach', icon: Settings },
                    { id: 'availability', label: 'Availability', icon: Clock },
                    { id: 'ethics', label: 'Ethics & Safety', icon: Shield },
                    { id: 'technology', label: 'Technology', icon: Globe },
                    ...(profileData.references.length > 0 ? [{ id: 'references', label: 'References', icon: User }] : [])
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 touch-manipulation min-h-[44px] ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleChange}
                        disabled={!editing}
                        required
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleChange}
                        disabled={!editing}
                        required
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleChange}
                        disabled={!editing}
                        required
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground touch-manipulation"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Bio / Coaching Philosophy</label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={profileData.bio}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground touch-manipulation resize-vertical"
                      placeholder="Describe your coaching philosophy and approach..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Years of Experience</label>
                      <input
                        type="number"
                        name="experience"
                        value={profileData.experience}
                        onChange={handleChange}
                        disabled={!editing}
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Hourly Rate ($)</label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={profileData.hourlyRate}
                        onChange={handleChange}
                        disabled={!editing}
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground touch-manipulation"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Gender Identity</label>
                    {editing ? (
                      <Select
                        value={profileData.genderIdentity ? profileData.genderIdentity : 'not_specified'}
                        onValueChange={(value) => setProfileData(prev => ({ ...prev, genderIdentity: value === 'not_specified' ? '' : value }))}
                      >
                        <SelectTrigger className="w-full bg-background text-foreground">
                          <SelectValue placeholder="Select gender identity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not specified</SelectItem>
                          {genderIdentityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="w-full px-3 py-2 bg-background border border-gray-300 rounded-md text-foreground">
                        {profileData.genderIdentity
                          ? (genderIdentityOptions.find(o => o.value === profileData.genderIdentity)?.label || profileData.genderIdentity)
                          : 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Location</label>
                    {editing ? (
                      <Popover
                        modal={false}
                        open={openLocation}
                        onOpenChange={(open) => {
                          setOpenLocation(open)
                          if (open) setLocationQuery('')
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground text-left flex items-center justify-between"
                          >
                            <span>
                              {profileData.location && profileData.location !== 'custom' && profileData.location !== 'none'
                                ? (STATE_NAMES as any)[profileData.location] || 'Select your location'
                                : profileData.location === 'custom'
                                  ? profileData.customLocation || 'Custom location'
                                  : 'Select your location'}
                            </span>
                            <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="p-0 w-[280px] sm:w-96 max-h-[300px]">
                          <div className="p-2">
                            <Input
                              placeholder="Search states..."
                              value={locationQuery}
                              onChange={(e) => setLocationQuery(e.target.value)}
                              className="mb-2"
                            />
                            <div className="max-h-[200px] overflow-y-auto hide-scrollbar">
                              <div
                                className={`w-full cursor-pointer text-left px-3 py-2 rounded hover:bg-accent ${profileData.location === 'none' ? 'bg-accent' : ''}`}
                                onPointerDown={(e) => {
                                  e.preventDefault()
                                  setProfileData(prev => ({ ...prev, location: 'none', customLocation: '' }))
                                  setOpenLocation(false)
                                }}
                              >
                                No location specified
                              </div>
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
                                    aria-selected={profileData.location === code}
                                    className={`w-full cursor-pointer text-left px-3 py-2 rounded hover:bg-accent ${profileData.location === code ? 'bg-accent' : ''}`}
                                    onPointerDown={(e) => {
                                      e.preventDefault()
                                      setProfileData(prev => ({ ...prev, location: code, customLocation: '' }))
                                      setOpenLocation(false)
                                    }}
                                  >
                                    {name}
                                  </div>
                                ))}
                              <div
                                className={`w-full cursor-pointer text-left px-3 py-2 rounded hover:bg-accent ${profileData.location === 'custom' ? 'bg-accent' : ''}`}
                                onPointerDown={(e) => {
                                  e.preventDefault()
                                  setProfileData(prev => ({ ...prev, location: 'custom' }))
                                  setOpenLocation(false)
                                }}
                              >
                                Custom Location
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="w-full px-3 py-2 bg-background border border-gray-300 rounded-md text-foreground">
                        {profileData.location === 'none' ? 'Not specified' : 
                         profileData.location === 'custom' ? profileData.customLocation || 'Custom location' :
                         profileData.location ? (STATE_NAMES as any)[profileData.location] || profileData.location : 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Professional Background</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Educational Background</label>
                    {editing ? (
                      <textarea
                        name="educationalBackground"
                        value={profileData.educationalBackground}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                        placeholder="Describe your educational background..."
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        {profileData.educationalBackground ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {profileData.educationalBackground}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Coaching Experience Level</label>
                    {editing ? (
                      <Select
                        value={profileData.coachingExperienceYears || ""}
                        onValueChange={(value) => setProfileData(prev => ({ ...prev, coachingExperienceYears: value }))}
                      >
                        <SelectTrigger className="w-full bg-background text-foreground">
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1 years">0-1 years</SelectItem>
                          <SelectItem value="1-3 years">1-3 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="5-10 years">5-10 years</SelectItem>
                          <SelectItem value="10+ years">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        {profileData.coachingExperienceYears ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {profileData.coachingExperienceYears}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Professional Certifications</label>
                    {editing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-gray-300 rounded-md p-4">
                        {PROFESSIONAL_CERTIFICATIONS.map((cert) => (
                          <div key={cert} className="flex items-center space-x-3">
                            <Checkbox
                              id={cert}
                              checked={profileData.professionalCertifications.includes(cert)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    professionalCertifications: [...prev.professionalCertifications, cert]
                                  }));
                                } else {
                                  setProfileData(prev => ({
                                    ...prev,
                                    professionalCertifications: prev.professionalCertifications.filter(c => c !== cert)
                                  }));
                                }
                              }}
                              className="touch-manipulation"
                            />
                            <label htmlFor={cert} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              {cert}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        {profileData.professionalCertifications.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profileData.professionalCertifications.map((cert, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {cert}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Qualifications & Certifications</label>
                    <input
                      type="text"
                      name="qualifications"
                      value={profileData.qualifications}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Separate with commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">ACT Training Level</label>
                    {editing ? (
                      <Select
                        value={profileData.actTrainingLevel || ""}
                        onValueChange={(value) => setProfileData(prev => ({ ...prev, actTrainingLevel: value }))}
                      >
                        <SelectTrigger className="w-full bg-background text-foreground">
                          <SelectValue placeholder="Select your ACT training level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No formal ACT training">No formal ACT training</SelectItem>
                          <SelectItem value="Basic ACT workshop (1-2 days)">Basic ACT workshop (1-2 days)</SelectItem>
                          <SelectItem value="Intermediate ACT training (3-5 days)">Intermediate ACT training (3-5 days)</SelectItem>
                          <SelectItem value="Advanced ACT training (1+ weeks)">Advanced ACT training (1+ weeks)</SelectItem>
                          <SelectItem value="ACT Trainer certification">ACT Trainer certification</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        {profileData.actTrainingLevel ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {profileData.actTrainingLevel}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'specialization' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Specialization & Expertise</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                      Specialties <span className="text-red-500">*</span>
                    </label>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${editing ? 'max-h-48' : ''} overflow-y-auto border border-gray-300 rounded-md p-4`}>
                      {editing ? (
                        SPECIALTIES.map((specialty) => (
                          <div key={specialty} className="flex items-center space-x-3 min-h-[44px]">
                            <Checkbox
                              id={specialty}
                              checked={selectedSpecialties.includes(specialty)}
                              onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                              className="touch-manipulation"
                            />
                            <label htmlFor={specialty} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                              {specialty}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full flex flex-wrap gap-2 p-2">
                          {selectedSpecialties.map((specialty) => (
                            <span key={specialty} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                      Languages <span className="text-red-500">*</span>
                    </label>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${editing ? 'max-h-32' : ''} overflow-y-auto border border-gray-300 rounded-md p-4`}>
                      {editing ? (
                        LANGUAGES.map((language) => (
                          <div key={language} className="flex items-center space-x-3 min-h-[44px]">
                            <Checkbox
                              id={language}
                              checked={selectedLanguages.includes(language)}
                              onCheckedChange={(checked) => handleLanguageChange(language, checked as boolean)}
                              className="touch-manipulation"
                            />
                            <label htmlFor={language} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Age Groups Comfortable Working With</label>
                    {editing ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-gray-300 rounded-md p-4">
                        {['Children (5-12)', 'Teenagers (13-17)', 'Young Adults (18-25)', 'Adults (26-65)', 'Seniors (65+)'].map((ageGroup) => (
                          <div key={ageGroup} className="flex items-center space-x-3">
                            <Checkbox
                              id={ageGroup}
                              checked={profileData.ageGroupsComfortable.includes(ageGroup)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    ageGroupsComfortable: [...prev.ageGroupsComfortable, ageGroup]
                                  }));
                                } else {
                                  setProfileData(prev => ({
                                    ...prev,
                                    ageGroupsComfortable: prev.ageGroupsComfortable.filter(a => a !== ageGroup)
                                  }));
                                }
                              }}
                              className="touch-manipulation"
                            />
                            <label htmlFor={ageGroup} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              {ageGroup}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        {profileData.ageGroupsComfortable.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profileData.ageGroupsComfortable.map((ageGroup, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {ageGroup}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Areas of Coaching Expertise</label>
                    {editing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-gray-300 rounded-md p-4">
                        {COACHING_TECHNIQUES.map((technique) => (
                          <div key={technique} className="flex items-center space-x-3">
                            <Checkbox
                              id={technique}
                              checked={profileData.coachingExpertise.includes(technique)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    coachingExpertise: [...prev.coachingExpertise, technique]
                                  }));
                                } else {
                                  setProfileData(prev => ({
                                    ...prev,
                                    coachingExpertise: prev.coachingExpertise.filter(t => t !== technique)
                                  }));
                                }
                              }}
                              className="touch-manipulation"
                            />
                            <label htmlFor={technique} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              {technique}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        {profileData.coachingExpertise.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profileData.coachingExpertise.map((expertise, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {expertise}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'approach' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Coaching Approach & Methodology</h3>
                  
                  {profileData.coachingTechniques.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Coaching Techniques</label>
                      <div className="flex flex-wrap gap-2">
                        {profileData.coachingTechniques.map((technique, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            {technique}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileData.sessionStructure && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Session Structure Preference</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{profileData.sessionStructure}</span>
                      </div>
                    </div>
                  )}

                  {profileData.preferredSessionLength && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Preferred Session Length</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profileData.preferredSessionLength}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Therapy Modalities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                      Therapy Modalities
                    </label>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${editing ? 'max-h-40' : ''} overflow-y-auto border border-gray-300 rounded-md p-4`}>
                      {editing ? (
                        therapyModalityOptions.map((modality) => (
                          <div key={modality.id} className="flex items-center space-x-3 min-h-[44px]">
                            <Checkbox
                              id={modality.id}
                              checked={selectedTherapyModalities.includes(modality.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTherapyModalities(prev => [...prev, modality.id]);
                                } else {
                                  setSelectedTherapyModalities(prev => prev.filter(id => id !== modality.id));
                                }
                              }}
                              className="touch-manipulation"
                            />
                            <label htmlFor={modality.id} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                              {modality.label}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full flex flex-wrap gap-2">
                          {selectedTherapyModalities.map((modalityId) => {
                            const modality = therapyModalityOptions.find(m => m.id === modalityId);
                            return modality ? (
                              <span key={modalityId} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                                {modality.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'availability' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Availability & Commitment</h3>
                  
                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Availability Status</h4>
                      <p className="text-sm text-muted-foreground">Toggle your availability for new clients</p>
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
                      <span className="ml-3 text-sm font-medium text-foreground">
                        {profileData.isAvailable ? 'Available' : 'Not Available'}
                      </span>
                    </label>
                  </div>

                  {/* Session Types Available */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Session Types Available</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <h5 className="font-medium text-gray-900 dark:text-green-100">Video Sessions</h5>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-green-200 mt-1">Online video calls via secure platform</p>
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

                  {/* Time Availability */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Time Availability</h4>
                    {editing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availabilityOptions.map((option) => {
                          const isChecked = profileData.availability_options.includes(option.id);
                          return (
                            <div key={option.id} className="flex items-center space-x-3 min-h-[44px]">
                              <Checkbox
                                id={option.id}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setProfileData(prev => ({
                                      ...prev,
                                      availability_options: [...prev.availability_options, option.id]
                                    }));
                                  } else {
                                    setProfileData(prev => ({
                                      ...prev,
                                      availability_options: prev.availability_options.filter(id => id !== option.id)
                                    }));
                                  }
                                }}
                                disabled={!editing}
                                className="touch-manipulation"
                              />
                              <label
                                htmlFor={option.id}
                                className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-300 leading-relaxed"
                              >
                                {option.label}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profileData.availability_options.length > 0 ? (
                          profileData.availability_options.map((availabilityId) => {
                            const option = availabilityOptions.find(opt => opt.id === availabilityId);
                            return option ? (
                              <div key={availabilityId} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 min-h-[44px]">
                                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-green-100 leading-relaxed">{option.label}</span>
                              </div>
                            ) : null;
                          })
                        ) : (
                          <div className="text-sm text-muted-foreground italic">No availability times set</div>
                        )}
                      </div>
                    )}
                  </div>

                  {profileData.weeklyHoursAvailable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Weekly Hours Available</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profileData.weeklyHoursAvailable}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ethics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Professional Ethics & Safety</h3>
                  
                  {profileData.scopeHandlingApproach && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Scope of Practice Approach</label>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{profileData.scopeHandlingApproach}</p>
                      </div>
                    </div>
                  )}

                  {profileData.boundaryMaintenanceApproach && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Professional Boundary Maintenance</label>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{profileData.boundaryMaintenanceApproach}</p>
                      </div>
                    </div>
                  )}

                  {profileData.comfortableWithSuicidalThoughts && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Comfort Level with High-Risk Clients</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {profileData.comfortableWithSuicidalThoughts}
                        </span>
                      </div>
                    </div>
                  )}

                  {profileData.selfHarmProtocol && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Crisis Management Protocol</label>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{profileData.selfHarmProtocol}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'technology' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Technology & Communication</h3>
                  
                  {profileData.videoConferencingComfort && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Video Conferencing Comfort Level</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {profileData.videoConferencingComfort}
                        </span>
                      </div>
                    </div>
                  )}

                  {profileData.internetConnectionQuality && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Internet Connection Quality</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profileData.internetConnectionQuality}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Professional References Tab */}
              {activeTab === 'references' && profileData.references.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Professional References</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {profileData.references.map((reference, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Reference {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reference.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reference.title}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reference.organization}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reference.email}</p>
                          </div>
                          {reference.phone && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{reference.phone}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          {!loadingDeletionStatus && deletionStatus && deletionStatus.isActive !== undefined && (
            <Card className="bg-card border-border">
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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Your Data</span>
              </CardTitle>
              <CardDescription>
                Download a copy of all your professional data, including profile information, session history, client interactions, and earnings.
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

          {/* Account Deletion */}
          {(!deletionStatus || !deletionStatus.hasPendingDeletion) && (
            <Card className="border-red-200 bg-card border-border">
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
                      <li>You will lose access to all your data and client information</li>
                      <li>All scheduled sessions will be cancelled</li>
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
      )}
      </CoachPageWrapper>
    </>
  );
}
      