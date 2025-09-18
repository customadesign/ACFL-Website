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
      <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-20 sm:pb-16">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
            Find Your Perfect Coach
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-2">
            Discover qualified coaches who match your needs and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row justify-center items-center mb-6 sm:mb-8 gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('saved');
                // Show saved coaches when switching to saved tab
                setFilteredCoaches(savedCoaches);
                setHasSearched(false);
              }}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md font-medium transition-colors touch-manipulation ${
                activeTab === 'saved'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              <span className="hidden sm:inline">Saved Coaches ({savedCoaches.length})</span>
              <span className="sm:hidden">Saved ({savedCoaches.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('search');
                // Load all coaches when switching to search tab
                if (allCoaches.length === 0) {
                  loadAllCoaches();
                }
                setFilteredCoaches(allCoaches);
                setHasSearched(false);
              }}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md font-medium transition-colors touch-manipulation ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              <span className="hidden sm:inline">Search New Coaches</span>
              <span className="sm:hidden">Search</span>
            </button>
          </div>
          {/* Refresh button for saved coaches */}
         
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              {hasSearched
                ? "Finding your perfect coach matches..."
                : "Loading coaches from database..."}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2 px-4">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mx-2 sm:mx-0">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Search Form - Only show when on search tab */}
        {activeTab === 'search' && showForm && (
          <Card className="mb-6 sm:mb-8 shadow-lg border-0 bg-white dark:bg-gray-800 mx-2 sm:mx-0">
            <CardContent className="p-4 sm:p-6">
              {/* Modern Search Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Smart Search Filters</h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Find coaches that match your preferences</p>
                  </div>
                </div>
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center space-x-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-xl font-semibold touch-manipulation"
                  >
                    {showAdvancedFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    <span>{showAdvancedFilters ? "Hide" : "Show"} Advanced Filters</span>
                    <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                  </Button>
                </div>
              </div>

              {/* Enhanced Search Bar */}
              <div className="mb-8 sm:mb-10">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-6 h-6" />
                  <Input
                    type="text"
                    placeholder="Search by coach name, specialization, location, or any criteria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 pr-16 py-6 text-xl font-medium border-3 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors touch-manipulation"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  )}
                </div>
                {/* Search action button */}
                <div className="flex justify-center mt-6">
                  <Button
                    type="button"
                    onClick={handleQuickSearch}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 touch-manipulation"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search Now
                  </Button>
                </div>
              </div>

              {/* Essential Filters Section */}
              <div className="mb-8">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <SlidersHorizontal className="w-5 h-5 mr-2 text-green-600" />
                    Essential Search Filters
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Focus your search on the most important criteria</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Specialization */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="coachingExpertise"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2 font-semibold text-base mb-4">
                              <Award className="w-5 h-5 text-purple-600" />
                              <span>Specialization</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {['Life transitions', 'Career development', 'Relationship coaching', 'Stress management', 'Anxiety & worry', 'Depression & mood', 'Self-esteem & confidence', 'Work-life balance'].map((expertise) => (
                                  <div key={expertise} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`main-${expertise}`}
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
                                    <label htmlFor={`main-${expertise}`} className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer leading-tight">
                                      {expertise}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </Form>
                  </div>

                  {/* Experience Level */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="coachingExperienceYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2 font-semibold text-base mb-4">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <span>Experience Level</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 h-12">
                                  <SelectValue placeholder="Any experience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any experience</SelectItem>
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
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
                    <label className="flex items-center space-x-2 font-semibold text-base mb-4">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span>Price Range</span>
                    </label>
                    <div className="space-y-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ${priceRange[0]} - ${priceRange[1]}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">per session</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                          className="bg-white dark:bg-gray-700 text-center border border-green-200 dark:border-green-700 h-10 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
                          className="bg-white dark:bg-gray-700 text-center border border-green-200 dark:border-green-700 h-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Coach Registration Based Filters */}
                  {/* Main Search Button */}
                  <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-4 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 touch-manipulation"
                    >
                      <Search className="w-6 h-6 mr-3" />
                      Find Perfect Matches
                    </Button>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                      Search with your selected criteria above
                    </p>
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">




                      <FormField
                        control={form.control}
                        name="educationalBackground"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-blue-600" />
                              <span>Educational Background</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700">
                                  <SelectValue placeholder="Any education" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any education</SelectItem>
                                <SelectItem value="High School Diploma">High School</SelectItem>
                                <SelectItem value="Associate's Degree">Associate's</SelectItem>
                                <SelectItem value="Bachelor's Degree">Bachelor's</SelectItem>
                                <SelectItem value="Master's Degree">Master's</SelectItem>
                                <SelectItem value="Doctoral Degree">Doctoral</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coachingExperienceYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>Coaching Experience</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700">
                                  <SelectValue placeholder="Any experience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any experience</SelectItem>
                                <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                                <SelectItem value="1-2 years">1-2 years</SelectItem>
                                <SelectItem value="3-5 years">3-5 years</SelectItem>
                                <SelectItem value="6-10 years">6-10 years</SelectItem>
                                <SelectItem value="More than 10 years">More than 10 years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="actTrainingLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-blue-600" />
                              <span>ACT Training Level</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700">
                                  <SelectValue placeholder="Any ACT level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any level</SelectItem>
                                <SelectItem value="Yes, formal ACT training/certification">Formal ACT Certification</SelectItem>
                                <SelectItem value="Yes, workshop or seminar attendance">Workshop/Seminar</SelectItem>
                                <SelectItem value="Self-study of ACT principles">Self-study</SelectItem>
                                <SelectItem value="No, but willing to learn">Willing to learn</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sessionStructure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>Session Structure</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700">
                                  <SelectValue placeholder="Any structure" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any structure</SelectItem>
                                <SelectItem value="Highly structured with specific agendas">Highly structured</SelectItem>
                                <SelectItem value="Semi-structured with flexibility">Semi-structured</SelectItem>
                                <SelectItem value="Client-led and organic">Client-led</SelectItem>
                                <SelectItem value="Varies based on client needs">Varies by needs</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ageGroupsComfortable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span>Age Groups</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {[
                                  { id: 'children', label: 'Children (6-12)' },
                                  { id: 'adolescents', label: 'Adolescents (13-17)' },
                                  { id: 'young-adults', label: 'Young adults (18-25)' },
                                  { id: 'adults', label: 'Adults (26-64)' },
                                  { id: 'seniors', label: 'Seniors (65+)' },
                                ].map((ageGroup) => (
                                  <div key={ageGroup.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={ageGroup.id}
                                      checked={field.value?.includes(ageGroup.label)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, ageGroup.label]);
                                        } else {
                                          field.onChange(current.filter((item) => item !== ageGroup.label));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={ageGroup.id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                                    >
                                      {ageGroup.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coachingTechniques"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-blue-600" />
                              <span>Coaching Techniques</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {[
                                  { id: 'cbt', label: 'Cognitive Behavioral Techniques' },
                                  { id: 'mindfulness', label: 'Mindfulness practices' },
                                  { id: 'goal-setting', label: 'Goal setting & action planning' },
                                  { id: 'values', label: 'Values clarification' },
                                  { id: 'solution-focused', label: 'Solution-focused techniques' },
                                  { id: 'motivational', label: 'Motivational interviewing' },
                                  { id: 'positive-psych', label: 'Positive psychology' },
                                  { id: 'somatic', label: 'Somatic/body-based approaches' },
                                  { id: 'visualization', label: 'Visualization & imagery' },
                                  { id: 'journaling', label: 'Journaling exercises' },
                                ].map((technique) => (
                                  <div key={technique.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={technique.id}
                                      checked={field.value?.includes(technique.label)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, technique.label]);
                                        } else {
                                          field.onChange(current.filter((item) => item !== technique.label));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={technique.id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                                    >
                                      {technique.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="comfortableWithSuicidalThoughts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Heart className="w-4 h-4 text-blue-600" />
                              <span>Crisis Management Experience</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700">
                                  <SelectValue placeholder="Any experience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any experience</SelectItem>
                                <SelectItem value="Yes, I have training and experience">Training & experience</SelectItem>
                                <SelectItem value="Yes, but would need additional support">Would need support</SelectItem>
                                <SelectItem value="No, I would immediately refer">Would refer</SelectItem>
                                <SelectItem value="Prefer not to work with high-risk clients">Prefer not to work with high-risk</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="languagesFluent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Languages className="w-4 h-4 text-blue-600" />
                              <span>Languages Spoken</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                                {[
                                  'English',
                                  'Spanish', 
                                  'French',
                                  'Mandarin',
                                  'Other'
                                ].map((language) => (
                                  <div key={language} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={language}
                                      checked={field.value?.includes(language)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, language]);
                                        } else {
                                          field.onChange(current.filter((item) => item !== language));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={language}
                                      className="text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      {language}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weeklyHoursAvailable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span>Weekly Hours Available</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700">
                                  <SelectValue placeholder="Any hours" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any hours</SelectItem>
                                <SelectItem value="5-10 hours">5-10 hours</SelectItem>
                                <SelectItem value="11-20 hours">11-20 hours</SelectItem>
                                <SelectItem value="21-30 hours">21-30 hours</SelectItem>
                                <SelectItem value="31-40 hours">31-40 hours</SelectItem>
                                <SelectItem value="More than 40 hours">More than 40 hours</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferredSessionLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Timer className="w-4 h-4 text-blue-600" />
                              <span>Preferred Session Length</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700">
                                  <SelectValue placeholder="Any length" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any length</SelectItem>
                                <SelectItem value="30 minutes">30 minutes</SelectItem>
                                <SelectItem value="45 minutes">45 minutes</SelectItem>
                                <SelectItem value="60 minutes">60 minutes</SelectItem>
                                <SelectItem value="90 minutes">90 minutes</SelectItem>
                                <SelectItem value="Flexible based on client needs">Flexible based on client needs</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="availabilityTimes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>Availability Times</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                                {[
                                  'Weekday mornings (6am-12pm)',
                                  'Weekday afternoons (12pm-5pm)',
                                  'Weekday evenings (5pm-10pm)',
                                  'Weekend mornings',
                                  'Weekend afternoons', 
                                  'Weekend evenings',
                                  'Late night (10pm-12am)'
                                ].map((timeSlot) => (
                                  <div key={timeSlot} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={timeSlot}
                                      checked={field.value?.includes(timeSlot)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, timeSlot]);
                                        } else {
                                          field.onChange(current.filter((item) => item !== timeSlot));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={timeSlot}
                                      className="text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      {timeSlot}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coachingExpertise"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-blue-600" />
                              <span>Areas of Coaching Expertise</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                                {[
                                  'Life transitions',
                                  'Career development', 
                                  'Relationship coaching',
                                  'Stress management',
                                  'Anxiety & worry',
                                  'Depression & mood',
                                  'Self-esteem & confidence',
                                  'Work-life balance',
                                  'Parenting & family',
                                  'Grief & loss',
                                  'Trauma & PTSD',
                                  'Addiction recovery',
                                  'LGBTQ+ issues',
                                  'Cultural/diversity issues',
                                  'Executive coaching',
                                  'Health & wellness',
                                  'Financial coaching',
                                  'Spiritual growth'
                                ].map((expertise) => (
                                  <div key={expertise} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={expertise}
                                      checked={field.value?.includes(expertise)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, expertise]);
                                        } else {
                                          field.onChange(current.filter((item) => item !== expertise));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={expertise}
                                      className="text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      {expertise}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Advanced Filters Reset */}
                  <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setSearchQuery('');
                        setPriceRange([0, 500]);
                        setSelectedFilters(new Set());
                        setFilteredCoaches(allCoaches);
                      }}
                      className="flex items-center space-x-2 px-6 py-2 border-2 rounded-lg touch-manipulation"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset All Filters</span>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div className="px-2 sm:px-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'saved' ? 'Your Saved Coaches' : 'Available Coaches'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
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
                {showForm ? <X className="w-4 h-4 dark:text-white" /> : <Filter className="w-4 h-4 dark:text-white" />}
                <span className="text-gray-900 dark:text-white">{showForm ? 'Hide' : 'Show'} Filters</span>
              </Button>
            )}
          </div>

          {/* No Results Message */}
          {filteredCoaches.length === 0 && !isLoading && (
            <Card className="p-6 sm:p-12 text-center bg-white dark:bg-gray-800 mx-2 sm:mx-0">
              <div className="max-w-md mx-auto">
                {activeTab === 'saved' ? (
                  <>
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Saved Coaches Yet</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
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
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Coaches Found</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
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
