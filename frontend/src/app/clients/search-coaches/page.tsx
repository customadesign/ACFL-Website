'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ProviderCard } from "@/components/ProviderCard";
import MeetingBlocker from "@/components/MeetingBlocker";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Filter, 
  Search, 
  RefreshCw, 
  Heart, 
  Star, 
  Video, 
  MapPin, 
  MessageCircle, 
  Calendar, 
  Trash2, 
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Timer,
  DollarSign,
  Award,
  Languages,
  Users
} from "lucide-react";
import { STATE_NAMES } from "@/constants/states";
import {
  concernOptions,
  therapyModalityOptions,
  genderIdentityOptions,
  ethnicIdentityOptions,
  religiousBackgroundOptions,
  availabilityOptions,
} from "@/constants/formOptions";
import { LANGUAGES } from "@/constants/languages";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { findMatches, getAllCoaches, getSavedCoaches } from "@/lib/api";
import axios from 'axios';
import { getApiUrl } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Enhanced form validation schema focused on coach registration sections
const searchFormSchema = z.object({
  // Required base filters
  location: z.string().optional(),
  maxPrice: z.number().optional(),
  
  // Professional Background
  educationalBackground: z.string().optional().or(z.literal("any")),
  coachingExperienceYears: z.string().optional().or(z.literal("any")),
  professionalCertifications: z.array(z.string()).optional(),
  
  // Specialization
  coachingExpertise: z.array(z.string()).optional(),
  ageGroupsComfortable: z.array(z.string()).optional(),
  actTrainingLevel: z.string().optional().or(z.literal("any")),
  
  // Approach & Methods
  coachingPhilosophy: z.string().optional(),
  coachingTechniques: z.array(z.string()).optional(),
  sessionStructure: z.string().optional().or(z.literal("any")),
  
  // Ethics & Boundaries
  scopeHandlingApproach: z.string().optional(),
  boundaryMaintenanceApproach: z.string().optional().or(z.literal("any")),
  
  // Crisis Management
  comfortableWithSuicidalThoughts: z.string().optional().or(z.literal("any")),
  
  // Availability
  weeklyHoursAvailable: z.string().optional().or(z.literal("any")),
  preferredSessionLength: z.string().optional().or(z.literal("any")),
  availabilityTimes: z.array(z.string()).optional(),
  
  // Technology
  videoConferencingComfort: z.string().optional().or(z.literal("any")),
  internetConnectionQuality: z.string().optional().or(z.literal("any")),
  
  // Languages
  languagesFluent: z.array(z.string()).optional(),
});

type SearchFormData = z.infer<typeof searchFormSchema>;

interface Coach {
  id: string;
  name: string;
  email?: string;
  bio: string;
  sessionRate: string;
  rating: number;
  matchScore: number;
  
  // Professional Background
  educationalBackground?: string;
  coachingExperienceYears?: string;
  professionalCertifications?: string[];
  
  // Specialization
  coachingExpertise?: string[];
  ageGroupsComfortable?: string[];
  actTrainingLevel?: string;
  
  // Approach & Methods
  coachingPhilosophy?: string;
  coachingTechniques?: string[];
  sessionStructure?: string;
  
  // Ethics & Boundaries
  scopeHandlingApproach?: string;
  boundaryMaintenanceApproach?: string;
  professionalDisciplineHistory?: boolean;
  
  // Crisis Management
  comfortableWithSuicidalThoughts?: string;
  selfHarmProtocol?: string;
  
  // Availability
  weeklyHoursAvailable?: string;
  preferredSessionLength?: string;
  availabilityTimes?: string[];
  
  // Technology
  videoConferencingComfort?: string;
  internetConnectionQuality?: string;
  
  // Languages
  languagesFluent?: string[];
  
  // Legacy fields for compatibility
  specialties?: string[];
  languages?: string[];
  experience?: string;
  location?: string[];
  virtualAvailable?: boolean;
  inPersonAvailable?: boolean;
}

interface SavedCoach extends Coach {
  savedDate: string;
}

function SearchCoachesContent() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<Coach[]>([]);
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [savedCoaches, setSavedCoaches] = useState<SavedCoach[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('saved');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [coachesPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [openLocation, setOpenLocation] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      location: '',
      maxPrice: 500,
      // Professional Background
      educationalBackground: 'any',
      coachingExperienceYears: 'any',
      professionalCertifications: [],
      // Specialization
      coachingExpertise: [],
      ageGroupsComfortable: [],
      actTrainingLevel: 'any',
      // Approach & Methods
      coachingPhilosophy: '',
      coachingTechniques: [],
      sessionStructure: 'any',
      // Ethics & Boundaries
      scopeHandlingApproach: '',
      boundaryMaintenanceApproach: 'any',
      // Crisis Management
      comfortableWithSuicidalThoughts: 'any',
      // Availability
      weeklyHoursAvailable: 'any',
      preferredSessionLength: 'any',
      availabilityTimes: [],
      // Technology
      videoConferencingComfort: 'any',
      internetConnectionQuality: 'any',
      // Languages
      languagesFluent: [],
    },
  });

  const watchedExperience = form.watch('coachingExperienceYears');

  // Load user preferences from profile
  const loadUserPreferences = () => {
    // This would load from user profile if available
    // For now, we'll use default values
  };

  // Load all coaches from database
  const loadAllCoaches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const coaches = await getAllCoaches();
      setAllCoaches(coaches);
      setFilteredCoaches(coaches);
    } catch (error) {
      console.error('Error loading coaches:', error);
      setError('Failed to load coaches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved coaches
  const loadSavedCoaches = async () => {
    try {
      const savedCoachesData = await getSavedCoaches();
      setSavedCoaches(savedCoachesData);
      // Set filtered coaches to saved coaches by default
      setFilteredCoaches(savedCoachesData);
    } catch (error) {
      console.error('Error loading saved coaches:', error);
      setSavedCoaches([]);
      setFilteredCoaches([]);
    }
  };

  // Toggle save/unsave coach
  const handleSaveToggle = async (coach: Coach) => {
    try {
      // This would call the save/unsave API
      // For now, we'll just toggle locally
      const isSaved = savedCoaches.some(sc => sc.id === coach.id);
      if (isSaved) {
        setSavedCoaches(prev => prev.filter(sc => sc.id !== coach.id));
      } else {
        setSavedCoaches(prev => [...prev, { ...coach, savedDate: new Date().toISOString() }]);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Refresh saved coaches from API
  const refreshSavedCoaches = async () => {
    try {
      const savedCoachesData = await getSavedCoaches();
      setSavedCoaches(savedCoachesData);
      if (activeTab === 'saved') {
        setFilteredCoaches(savedCoachesData);
      }
    } catch (error) {
      console.error('Error refreshing saved coaches:', error);
    }
  };

  // Quick search with focus on registration fields (uses normal search mode)
  const handleQuickSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create basic search data with normal mode
        const searchData = {
          coachingExpertise: [searchQuery], // Treat search query as expertise search
          searchMode: 'normal' as const
        };
        
        console.log('🔍 Using normal search mode for quick search');
        
        // Use the findMatches API with normal mode
        const result = await findMatches(searchData);
        const incoming = (result && (result as any).matches) ? (result as any).matches : (result as any) || [];
        const processed: Coach[] = Array.isArray(incoming) ? incoming : [];
        
        setFilteredCoaches(processed);
        setHasSearched(true);
      } catch (error) {
        console.error('Quick search error:', error);
        // Fallback to local filtering
        const query = searchQuery.toLowerCase();
        const filtered = allCoaches.filter(coach => 
          // Basic info
          coach.name.toLowerCase().includes(query) ||
          coach.bio.toLowerCase().includes(query) ||
          
          // Professional Background
          (coach.educationalBackground && coach.educationalBackground.toLowerCase().includes(query)) ||
          (coach.coachingExperienceYears && coach.coachingExperienceYears.toLowerCase().includes(query)) ||
          (coach.professionalCertifications && coach.professionalCertifications.some(cert => 
            cert.toLowerCase().includes(query)
          )) ||
          
          // Specialization
          (coach.coachingExpertise && coach.coachingExpertise.some(expertise => 
            expertise.toLowerCase().includes(query)
          )) ||
          (coach.ageGroupsComfortable && coach.ageGroupsComfortable.some(ageGroup => 
            ageGroup.toLowerCase().includes(query)
          )) ||
          (coach.actTrainingLevel && coach.actTrainingLevel.toLowerCase().includes(query)) ||
          
          // Approach & Methods
          (coach.coachingPhilosophy && coach.coachingPhilosophy.toLowerCase().includes(query)) ||
          (coach.coachingTechniques && coach.coachingTechniques.some(technique => 
            technique.toLowerCase().includes(query)
          )) ||
          (coach.sessionStructure && coach.sessionStructure.toLowerCase().includes(query)) ||
          
          // Ethics & Boundaries
          (coach.scopeHandlingApproach && coach.scopeHandlingApproach.toLowerCase().includes(query)) ||
          (coach.boundaryMaintenanceApproach && coach.boundaryMaintenanceApproach.toLowerCase().includes(query)) ||
          
          // Crisis Management
          (coach.comfortableWithSuicidalThoughts && coach.comfortableWithSuicidalThoughts.toLowerCase().includes(query)) ||
          (coach.selfHarmProtocol && coach.selfHarmProtocol.toLowerCase().includes(query)) ||
          
          // Availability
          (coach.weeklyHoursAvailable && coach.weeklyHoursAvailable.toLowerCase().includes(query)) ||
          (coach.preferredSessionLength && coach.preferredSessionLength.toLowerCase().includes(query)) ||
          (coach.availabilityTimes && coach.availabilityTimes.some(time => 
            time.toLowerCase().includes(query)
          )) ||
          
          // Technology
          (coach.videoConferencingComfort && coach.videoConferencingComfort.toLowerCase().includes(query)) ||
          (coach.internetConnectionQuality && coach.internetConnectionQuality.toLowerCase().includes(query)) ||
          
          // Languages
          (coach.languagesFluent && coach.languagesFluent.some(language => 
            language.toLowerCase().includes(query)
          )) ||
          
          // Legacy fields for backward compatibility
          (coach.specialties && coach.specialties.some(specialty => 
            specialty.toLowerCase().includes(query)
          )) ||
          (coach.languages && coach.languages.some(language => 
            language.toLowerCase().includes(query)
          ))
        );
        setFilteredCoaches(filtered);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFilteredCoaches(allCoaches);
      setHasSearched(false);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Determine if advanced search is being used
  const isAdvancedSearch = (data: SearchFormData): boolean => {
    const advancedFields = [
      'educationalBackground',
      'coachingTechniques',
      'sessionStructure',
      'ageGroupsComfortable',
      'actTrainingLevel',
      'comfortableWithSuicidalThoughts',
      'weeklyHoursAvailable',
      'preferredSessionLength',
      'boundaryMaintenanceApproach',
      'videoConferencingComfort'
    ];

    return advancedFields.some(field => {
      const value = data[field as keyof SearchFormData];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && value !== 'any' && value !== '';
    });
  };

  // Handle form submission
  const handleSubmit = async (data: SearchFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Determine search mode based on form data
      const searchMode = isAdvancedSearch(data) ? 'advanced' : 'normal';
      const searchData = { ...data, searchMode };
      
      console.log(`🔍 Using ${searchMode} search mode`);
      
      // Use the findMatches API with search mode
      const result = await findMatches(searchData);
      const incoming = (result && (result as any).matches) ? (result as any).matches : (result as any) || [];
      let processed: Coach[] = Array.isArray(incoming) ? incoming : [];
      if (data.coachingExperienceYears && data.coachingExperienceYears !== 'any') {
        // Filter based on coaching experience years directly matching the selection
        processed = processed.filter((coach: Coach) => {
          return coach.coachingExperienceYears === data.coachingExperienceYears;
        });
      }
      setMatches(processed);
      setFilteredCoaches(processed);
      setHasSearched(true);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current coaches for pagination
  const getCurrentCoaches = () => {
    const startIndex = (currentPage - 1) * coachesPerPage;
    const endIndex = startIndex + coachesPerPage;
    return filteredCoaches.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredCoaches.length / coachesPerPage);

  // Apply real-time filters focused on registration fields
  const applyFilters = () => {
    let filtered = allCoaches;

    // Apply comprehensive search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(coach => 
        // Basic info
        coach.name.toLowerCase().includes(query) ||
        coach.bio.toLowerCase().includes(query) ||
        
        // Professional Background
        (coach.educationalBackground && coach.educationalBackground.toLowerCase().includes(query)) ||
        (coach.coachingExperienceYears && coach.coachingExperienceYears.toLowerCase().includes(query)) ||
        (coach.professionalCertifications && coach.professionalCertifications.some(cert => 
          cert.toLowerCase().includes(query)
        )) ||
        
        // Specialization
        (coach.coachingExpertise && coach.coachingExpertise.some(expertise => 
          expertise.toLowerCase().includes(query)
        )) ||
        (coach.actTrainingLevel && coach.actTrainingLevel.toLowerCase().includes(query)) ||
        
        // Approach & Methods
        (coach.coachingPhilosophy && coach.coachingPhilosophy.toLowerCase().includes(query)) ||
        (coach.coachingTechniques && coach.coachingTechniques.some(technique => 
          technique.toLowerCase().includes(query)
        )) ||
        (coach.sessionStructure && coach.sessionStructure.toLowerCase().includes(query)) ||
        
        // Ethics & Boundaries
        (coach.boundaryMaintenanceApproach && coach.boundaryMaintenanceApproach.toLowerCase().includes(query)) ||
        
        // Crisis Management
        (coach.comfortableWithSuicidalThoughts && coach.comfortableWithSuicidalThoughts.toLowerCase().includes(query)) ||
        
        // Languages
        (coach.languagesFluent && coach.languagesFluent.some(language => 
          language.toLowerCase().includes(query)
        ))
      );
    }

    // Apply price filter
    filtered = filtered.filter(coach => {
      const price = parseInt(coach.sessionRate.replace(/[^0-9]/g, ''));
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply filters based on registration sections
    
    // Professional Background filters
    const educationalBg = form.getValues().educationalBackground;
    if (educationalBg && educationalBg !== 'any') {
      filtered = filtered.filter(coach => 
        coach.educationalBackground === educationalBg
      );
    }

    const experienceYears = form.getValues().coachingExperienceYears;
    if (experienceYears && experienceYears !== 'any') {
      filtered = filtered.filter(coach => 
        coach.coachingExperienceYears === experienceYears
      );
    }

    const certifications = form.getValues().professionalCertifications;
    if (certifications && certifications.length > 0) {
      filtered = filtered.filter(coach => 
        coach.professionalCertifications && 
        certifications.some(cert => coach.professionalCertifications?.includes(cert))
      );
    }

    // Specialization filters
    const expertise = form.getValues().coachingExpertise;
    if (expertise && expertise.length > 0) {
      filtered = filtered.filter(coach => 
        coach.coachingExpertise && 
        expertise.some(exp => coach.coachingExpertise?.includes(exp))
      );
    }

    const ageGroups = form.getValues().ageGroupsComfortable;
    if (ageGroups && ageGroups.length > 0) {
      filtered = filtered.filter(coach => 
        coach.ageGroupsComfortable && 
        ageGroups.some(age => coach.ageGroupsComfortable?.includes(age))
      );
    }

    const actLevel = form.getValues().actTrainingLevel;
    if (actLevel && actLevel !== 'any') {
      filtered = filtered.filter(coach => 
        coach.actTrainingLevel === actLevel
      );
    }

    // Approach & Methods filters
    const sessionStruct = form.getValues().sessionStructure;
    if (sessionStruct && sessionStruct !== 'any') {
      filtered = filtered.filter(coach => 
        coach.sessionStructure === sessionStruct
      );
    }

    const techniques = form.getValues().coachingTechniques;
    if (techniques && techniques.length > 0) {
      filtered = filtered.filter(coach => 
        coach.coachingTechniques && 
        techniques.some(technique => coach.coachingTechniques?.includes(technique))
      );
    }

    // Ethics & Boundaries filters
    const boundaryApproach = form.getValues().boundaryMaintenanceApproach;
    if (boundaryApproach && boundaryApproach !== 'any') {
      filtered = filtered.filter(coach => 
        coach.boundaryMaintenanceApproach === boundaryApproach
      );
    }

    // Crisis Management filter
    const crisisMgmt = form.getValues().comfortableWithSuicidalThoughts;
    if (crisisMgmt && crisisMgmt !== 'any') {
      filtered = filtered.filter(coach => 
        coach.comfortableWithSuicidalThoughts === crisisMgmt
      );
    }

    // Availability filters
    const weeklyHours = form.getValues().weeklyHoursAvailable;
    if (weeklyHours && weeklyHours !== 'any') {
      filtered = filtered.filter(coach => 
        coach.weeklyHoursAvailable === weeklyHours
      );
    }

    const sessionLength = form.getValues().preferredSessionLength;
    if (sessionLength && sessionLength !== 'any') {
      filtered = filtered.filter(coach => 
        coach.preferredSessionLength === sessionLength
      );
    }

    const availTimes = form.getValues().availabilityTimes;
    if (availTimes && availTimes.length > 0) {
      filtered = filtered.filter(coach => 
        coach.availabilityTimes && 
        availTimes.some(time => coach.availabilityTimes?.includes(time))
      );
    }

    // Technology filters
    const videoComfort = form.getValues().videoConferencingComfort;
    if (videoComfort && videoComfort !== 'any') {
      filtered = filtered.filter(coach => 
        coach.videoConferencingComfort === videoComfort
      );
    }

    // Languages filter
    const languages = form.getValues().languagesFluent;
    if (languages && languages.length > 0) {
      filtered = filtered.filter(coach => 
        coach.languagesFluent && 
        languages.some(lang => coach.languagesFluent?.includes(lang))
      );
    }

    setFilteredCoaches(filtered);
    setCurrentPage(1);
  };

  // Load data on component mount
  useEffect(() => {
    loadUserPreferences();
    loadSavedCoaches(); // Only load saved coaches initially
    
    // Check if coming from assessment
    const urlParams = new URLSearchParams(window.location.search);
    const fromAssessment = urlParams.get('from') === 'assessment';
    
    if (fromAssessment) {
      // Load assessment data from localStorage
      const assessmentDataStr = localStorage.getItem('assessmentData');
      if (assessmentDataStr) {
        try {
          const assessmentData = JSON.parse(assessmentDataStr);
          console.log('Loading assessment data:', assessmentData);
          
          // Convert location from full state name to state code
          const locationName = assessmentData.location || '';
          let locationCode = '';
          if (locationName) {
            // Find the state code by matching the full name
            const stateEntry = Object.entries(STATE_NAMES).find(
              ([code, name]) => name === locationName
            );
            locationCode = stateEntry ? stateEntry[0] : '';
            console.log('Converting location:', { locationName, locationCode });
          }
          if (locationCode) {
            form.setValue('location', locationCode);
          }
          
          // Convert priceRange string to numeric range
          if (assessmentData.priceRange) {
            const priceMap: Record<string, [number, number]> = {
              'under-50': [0, 50],
              '50-75': [50, 75],
              '75-100': [75, 100],
              '100-150': [100, 150],
              '150-200': [150, 200],
              'over-200': [200, 500],
              'flexible': [0, 500]
            };
            const range = priceMap[assessmentData.priceRange] || [0, 500];
            setPriceRange(range);
          }
          
          // Switch to search tab and show form
          setActiveTab('search');
          setShowForm(true);
          
          // Load all coaches if not already loaded
          if (allCoaches.length === 0) {
            loadAllCoaches().then(() => {
              // Auto-submit the form with assessment data after coaches are loaded
              setTimeout(() => {
                const formData = {
                  location: locationCode, // Use the converted location code
                  maxPrice: priceRange[1] || 500
                };
                console.log('Auto-submitting search with assessment data:', formData);
                console.log('Price range set to:', priceRange);
                handleSubmit(formData as SearchFormData);
              }, 500);
            });
          } else {
            // Coaches already loaded, auto-submit immediately
            setTimeout(() => {
              const formData = {
                location: locationCode, // Use the converted location code
                maxPrice: priceRange[1] || 500
              };
              console.log('Auto-submitting search with assessment data (coaches already loaded):', formData);
              console.log('Price range set to:', priceRange);
              handleSubmit(formData as SearchFormData);
            }, 500);
          }
          
          // Clear the assessment data from localStorage after using it
          localStorage.removeItem('assessmentData');
          sessionStorage.removeItem('pendingAssessment');
          
          // Remove the 'from' parameter from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error('Error parsing assessment data:', error);
        }
      }
    }
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, priceRange, selectedFilters, watchedExperience]);

  return (
    <MeetingBlocker blockMessage="You are currently in a meeting. Please end your current session before searching for coaches.">
      <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-20 sm:pb-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-gray-lite via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-3xl p-8 sm:p-12 mb-8 sm:mb-12 overflow-hidden">
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full text-sm font-medium text-brand-teal dark:text-brand-teal mb-6 border border-gray-200 dark:border-gray-700">
              <Search className="w-4 h-4 mr-2" />
              Find Your Perfect Match
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-dark dark:text-white mb-4 sm:mb-6 leading-tight">
              Discover Your Ideal Life Coach
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Connect with certified coaches who understand your journey and can help you achieve your goals
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-brand-leaf rounded-full mr-2"></div>
                500+ Verified Coaches
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-brand-teal rounded-full mr-2"></div>
                24/7 Support Available
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-brand-orange rounded-full mr-2"></div>
                Personalized Matching
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar - Always Visible */}
        <div className="mb-8 sm:mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center p-2">
                  <div className="flex items-center flex-1">
                    <Search className="w-6 h-6 text-gray-400 dark:text-gray-500 ml-4" />
                    <input
                      type="text"
                      placeholder="Search by name, specialization, location, or any criteria..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
                      className="flex-1 px-4 py-4 text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={handleQuickSearch}
                    disabled={isLoading}
                    className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Search className="w-5 h-5 mr-2" />
                    )}
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setActiveTab('search');
                if (allCoaches.length === 0) {
                  loadAllCoaches();
                }
                setFilteredCoaches(allCoaches);
                setHasSearched(false);
              }}
              className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'search'
                  ? 'bg-brand-teal text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Search className="w-5 h-5 mr-2" />
              <span>Discover Coaches</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('saved');
                setFilteredCoaches(savedCoaches);
                setHasSearched(false);
              }}
              className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'saved'
                  ? 'bg-brand-teal text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Heart className="w-5 h-5 mr-2" />
              <span>My Favorites ({savedCoaches.length})</span>
            </button>
          </div>
        </div>

        {/* Enhanced Loading State */}
        {isLoading && (
          <div className="text-center py-12 sm:py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-full p-8 shadow-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-brand-teal mx-auto"></div>
              </div>
              <h3 className="text-xl font-semibold text-ink-dark dark:text-white mt-6 mb-2">
                {hasSearched ? "Finding Perfect Matches" : "Loading Coaches"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {hasSearched
                  ? "Analyzing coach profiles to find your ideal matches..."
                  : "Preparing our database of qualified coaches..."}
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-brand-leaf rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error Message */}
        {error && (
          <div className="mb-8 mx-2 sm:mx-0">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-1">
                    Search Error
                  </h3>
                  <p className="text-red-700 mb-4">
                    {error}
                  </p>
                  <button
                    onClick={() => {
                      setError(null);
                      if (activeTab === 'search') {
                        loadAllCoaches();
                      } else {
                        loadSavedCoaches();
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filters - Only show when on search tab */}
        {activeTab === 'search' && (
          <div className="mb-8 sm:mb-12">
            <div className="text-center mb-6">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <SlidersHorizontal className="w-5 h-5 mr-3" />
                <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
                {showAdvancedFilters ? <ChevronUp className="w-5 h-5 ml-3" /> : <ChevronDown className="w-5 h-5 ml-3" />}
              </button>
            </div>

            {showAdvancedFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-lite dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-ink-dark dark:text-white mb-1">Refine Your Search</h3>
                      <p className="text-gray-600 dark:text-gray-300">Use these filters to find coaches that perfectly match your needs</p>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-2 h-2 bg-brand-teal rounded-full"></div>
                      <span>Optional filters</span>
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Specialization Filter */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-brand-coral/10 dark:bg-brand-coral/20 rounded-xl flex items-center justify-center">
                          <Award className="w-5 h-5 text-brand-coral" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-ink-dark dark:text-white">Specialization</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">What area do you need help with?</p>
                        </div>
                      </div>

                      <Form {...form}>
                        <FormField
                          control={form.control}
                          name="coachingExpertise"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {['Life transitions', 'Career development', 'Relationship coaching', 'Stress management', 'Anxiety & worry', 'Depression & mood', 'Self-esteem & confidence', 'Work-life balance'].map((expertise) => (
                                    <label key={expertise} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                      <Checkbox
                                        checked={field.value?.includes(expertise)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, expertise]);
                                          } else {
                                            field.onChange(current.filter((item) => item !== expertise));
                                          }
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{expertise}</span>
                                    </label>
                                  ))}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </Form>
                    </div>

                    {/* Experience & Price */}
                    <div className="space-y-6">
                      {/* Experience Level */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-brand-teal" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-ink-dark dark:text-white">Experience</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Coach experience level</p>
                          </div>
                        </div>

                        <Form {...form}>
                          <FormField
                            control={form.control}
                            name="coachingExperienceYears"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white dark:bg-gray-700 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-xl h-12">
                                      <SelectValue placeholder="Any experience level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="any">Any experience level</SelectItem>
                                    <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                                    <SelectItem value="1-2 years">1-2 years</SelectItem>
                                    <SelectItem value="3-5 years">3-5 years</SelectItem>
                                    <SelectItem value="6-10 years">6-10 years</SelectItem>
                                    <SelectItem value="More than 10 years">More than 10 years</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </Form>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-brand-leaf/10 dark:bg-brand-leaf/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-brand-leaf" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-ink-dark dark:text-white">Budget</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Price per session</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-brand-leaf/10 dark:bg-brand-leaf/20 p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold text-brand-leaf">
                              ${priceRange[0]} - ${priceRange[1]}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">per session</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Price</label>
                              <Input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                className="bg-white dark:bg-gray-700 dark:text-white text-center border-2 border-gray-200 dark:border-gray-600 rounded-lg h-10"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Price</label>
                              <Input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
                                className="bg-white dark:bg-gray-700 dark:text-white text-center border-2 border-gray-200 dark:border-gray-600 rounded-lg h-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Filters */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-brand-orange/10 dark:bg-brand-orange/20 rounded-xl flex items-center justify-center">
                          <Languages className="w-5 h-5 text-brand-orange" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-ink-dark dark:text-white">Languages</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Preferred language</p>
                        </div>
                      </div>

                      <Form {...form}>
                        <FormField
                          control={form.control}
                          name="languagesFluent"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="space-y-2">
                                  {['English', 'Spanish', 'French', 'Mandarin', 'Other'].map((language) => (
                                    <label key={language} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                      <Checkbox
                                        checked={field.value?.includes(language)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, language]);
                                          } else {
                                            field.onChange(current.filter((item) => item !== language));
                                          }
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{language}</span>
                                    </label>
                                  ))}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </Form>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          form.reset();
                          setSearchQuery('');
                          setPriceRange([0, 500]);
                          setSelectedFilters(new Set());
                          setFilteredCoaches(allCoaches);
                        }}
                        className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset Filters
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center px-8 py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        ) : (
                          <Search className="w-5 h-5 mr-3" />
                        )}
                        Apply Filters & Search
                      </button>
                    </form>
                  </Form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div className="px-2 sm:px-0">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-dark dark:text-white">
                {activeTab === 'saved' ? 'Your Saved Coaches' : 'Available Coaches'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {activeTab === 'saved'
                  ? `${savedCoaches.length} saved coach${savedCoaches.length !== 1 ? 'es' : ''}`
                  : `${filteredCoaches.length} coach${filteredCoaches.length !== 1 ? 'es' : ''} found`
                }
              </p>
            </div>
            {activeTab === 'search' && (
              <Button
                variant="outline"
                onClick={() => setShowForm(!showForm)}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto mx-2 sm:mx-0 touch-manipulation"
              >
                {showForm ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                <span className="text-gray-900">{showForm ? 'Hide' : 'Show'} Filters</span>
              </Button>
            )}
          </div>

          {/* No Results Message */}
          {filteredCoaches.length === 0 && !isLoading && (
            <Card className="p-6 sm:p-12 text-center bg-white dark:bg-gray-800 mx-2 sm:mx-0">
              <div className="max-w-md mx-auto">
                {activeTab === 'saved' ? (
                  <>
                    <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-ink-dark dark:text-white mb-2">No Saved Coaches Yet</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                      You haven't saved any coaches yet. Use the search tab to find coaches and save them to your favorites.
                    </p>
                    <Button
                      onClick={() => {
                        setActiveTab('search');
                        if (allCoaches.length === 0) {
                          loadAllCoaches();
                        }
                        setFilteredCoaches(allCoaches);
                      }}
                      variant="outline"
                    >
                      Search Coaches
                    </Button>
                  </>
                ) : (
                  <>
                    <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-ink-dark dark:text-white mb-2">No Coaches Found</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                      Try adjusting your search criteria or filters to find more matches.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setPriceRange([0, 500]);
                        setSelectedFilters(new Set());
                        setFilteredCoaches(allCoaches);
                      }}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Coaches Grid */}
          {filteredCoaches.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 px-2 sm:px-0">
              {getCurrentCoaches().map((coach) => (
                <ProviderCard
                  key={coach.id}
                  id={coach.id}
                  name={coach.name}
                  matchScore={coach.matchScore || 0}
                  specialties={coach.specialties || []}
                  modalities={(() => {
                    const raw = (coach as any).modalities || (coach as any).therapy_modalities
                    if (!Array.isArray(raw)) return []
                    return raw.map((m: any) => {
                      if (typeof m !== 'string') return null
                      const match = therapyModalityOptions.find(o => o.id === m)
                      return match ? match.label : m
                    }).filter(Boolean) as string[]
                  })()}
                  languages={coach.languages || []}
                  bio={coach.bio || ''}
                  sessionRate={coach.sessionRate || ''}
                  experience={coach.experience || ''}
                  rating={coach.rating || 0}
                  virtualAvailable={coach.virtualAvailable || false}
                  email={coach.email || ''}
                  profilePhoto={(coach as any).profilePhoto || ''}
                  isBestMatch={(coach.matchScore || 0) >= 90}
                  initialIsSaved={savedCoaches.some(sc => sc.id === coach.id)}
                  onSaveChange={refreshSavedCoaches}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 sm:mt-8 px-2 sm:px-0">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0">
                {/* Mobile pagination info */}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 sm:hidden mb-2">
                  Page {currentPage} of {totalPages}
                </div>
                
                <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="touch-manipulation px-3 sm:px-4"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">←</span>
                  </Button>
                  
                  {/* Show fewer page numbers on mobile */}
                  {totalPages <= 5 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 sm:w-10 sm:h-10 touch-manipulation"
                      >
                        {page}
                      </Button>
                    ))
                  ) : (
                    // Show condensed pagination for many pages
                    <>
                      {currentPage > 2 && (
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(1)}
                          className="w-8 h-8 sm:w-10 sm:h-10 touch-manipulation"
                        >
                          1
                        </Button>
                      )}
                      {currentPage > 3 && <span className="px-2 text-gray-400">...</span>}
                      
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        const page = Math.max(1, currentPage - 1) + i;
                        if (page > totalPages) return null;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 sm:w-10 sm:h-10 touch-manipulation"
                          >
                            {page}
                          </Button>
                        );
                      }).filter(Boolean)}
                      
                      {currentPage < totalPages - 2 && <span className="px-2 text-gray-400">...</span>}
                      {currentPage < totalPages - 1 && (
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(totalPages)}
                          className="w-8 h-8 sm:w-10 sm:h-10 touch-manipulation"
                        >
                          {totalPages}
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="touch-manipulation px-3 sm:px-4"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">→</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </MeetingBlocker>
  );
}

export default function SearchCoaches() {
  return (
    <ProtectedRoute>
      <SearchCoachesContent />
    </ProtectedRoute>
  );
}
