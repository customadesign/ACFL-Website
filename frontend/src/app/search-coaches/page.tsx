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
  paymentOptions,
} from "@/constants/formOptions";
import { LANGUAGES } from "@/constants/languages";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { findMatches, getAllCoaches, getSavedCoaches } from "@/lib/api";
import axios from 'axios';
import { getApiUrl } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Enhanced form validation schema
const searchFormSchema = z.object({
  areaOfConcern: z
    .array(z.string())
    .min(1, "Please select at least one area of concern"),
  location: z.string().min(1, "Please select your location"),
  availability_options: z
    .array(z.string())
    .min(1, "Please select at least one availability option"),
  therapistGender: z.string().optional().or(z.literal("any")),
  language: z.string().optional().or(z.literal("any")),
  maxPrice: z.number().optional(),
  experience: z.string().optional(),
  modalities: z.array(z.string()).optional(),
  insurance: z.array(z.string()).optional(),
});

type SearchFormData = z.infer<typeof searchFormSchema>;

interface Coach {
  id: string;
  name: string;
  specialties: string[];
  modalities?: string[];
  languages: string[];
  bio: string;
  sessionRate: string;
  experience: string;
  rating: number;
  matchScore: number;
  virtualAvailable: boolean;
  inPersonAvailable: boolean;
  email?: string;
  // Additional fields that might be returned from database
  location?: string[];
  availableTimes?: string[];
  certifications?: string[];
  insuranceAccepted?: string[];
  demographics?: {
    gender: string;
    ethnicity: string;
    religious_background: string;
  };
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
      areaOfConcern: [],
      location: '',
      availability_options: [],
      therapistGender: 'any',
      language: 'any',
      maxPrice: 500,
      experience: 'any',
      modalities: [],
      insurance: [],
    },
  });

  const watchedExperience = form.watch('experience');

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

  // Quick search without form submission
  const handleQuickSearch = () => {
    if (searchQuery.trim()) {
      const filtered = allCoaches.filter(coach => 
        coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        coach.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCoaches(filtered);
      setHasSearched(true);
    } else {
      setFilteredCoaches(allCoaches);
      setHasSearched(false);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle form submission
  const handleSubmit = async (data: SearchFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the findMatches API for advanced search
      const result = await findMatches(data);
      const incoming = (result && (result as any).matches) ? (result as any).matches : (result as any) || [];
      let processed = incoming;
      if (data.experience && data.experience !== 'any') {
        const minYears = parseInt(data.experience, 10) || 0;
        processed = incoming.filter((coach: any) => {
          const years = parseInt((coach.experience || '').replace(/[^0-9]/g, '')) || 0;
          return years >= minYears;
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

  // Apply real-time filters
  const applyFilters = () => {
    let filtered = allCoaches;

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(coach => 
        coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        coach.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price filter
    filtered = filtered.filter(coach => {
      const price = parseInt(coach.sessionRate.replace(/[^0-9]/g, ''));
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply selected filters
    // Remove virtual/verified/accepts-insurance quick filters

    // Apply experience filter (minimum years)
    const minExpStr = form.getValues().experience;
    if (minExpStr && minExpStr !== 'any') {
      const minYears = parseInt(minExpStr, 10) || 0;
      filtered = filtered.filter(coach => {
        const years = parseInt((coach.experience || '').replace(/[^0-9]/g, '')) || 0;
        return years >= minYears;
      });
    }

    setFilteredCoaches(filtered);
    setCurrentPage(1);
  };

  // Load data on component mount
  useEffect(() => {
    loadUserPreferences();
    loadSavedCoaches(); // Only load saved coaches initially
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, priceRange, selectedFilters, watchedExperience]);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Saved Coaches
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View and manage your favorite coaches. Use the search tab to find new coaches to save.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('saved');
                // Show saved coaches when switching to saved tab
                setFilteredCoaches(savedCoaches);
                setHasSearched(false);
              }}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              Saved Coaches ({savedCoaches.length})
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
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search New Coaches
            </button>
          </div>
          {/* Refresh button for saved coaches */}
          {activeTab === 'saved' && (
            <Button
              onClick={refreshSavedCoaches}
              variant="outline"
              className="ml-4 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">
              {hasSearched
                ? "Finding your perfect coach matches..."
                : "Loading coaches from database..."}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Search Form - Only show when on search tab */}
        {activeTab === 'search' && showForm && (
          <Card className="mb-8 shadow-lg border-0">
            <CardContent className="p-6">
              {/* Modern Search Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <SlidersHorizontal className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Smart Search Filters</h2>
                    <p className="text-sm text-gray-600">Find coaches that match your preferences</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2 bg-white hover:bg-gray-50"
                >
                  {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{showAdvancedFilters ? "Hide" : "Show"} Advanced</span>
                </Button>
              </div>

              {/* Quick Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by name, specialty, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Filter Chips removed per requirements */}

              {/* Price Range Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="w-24"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
                    className="w-24"
                  />
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Basic Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="areaOfConcern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>Areas of Concern</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {concernOptions.map((concern) => (
                                <div key={concern.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={concern.id}
                                    checked={field.value?.includes(concern.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, concern.id]);
                                      } else {
                                        field.onChange(current.filter((item) => item !== concern.id));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={concern.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {concern.label}
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
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>Location</span>
                          </FormLabel>
                          <FormControl>
                            <Popover
                              modal={false}
                              open={openLocation}
                              onOpenChange={(open) => {
                                setOpenLocation(open)
                                if (open) setLocationQuery("")
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openLocation}
                                  className="w-full justify-between bg-white"
                                >
                                  {field.value ? (STATE_NAMES as any)[field.value] || "Select your state" : "Select your state"}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                          aria-selected={field.value === code}
                                          className={`w-full cursor-pointer text-left px-3 py-2 rounded hover:bg-accent ${field.value === code ? 'bg-accent' : ''}`}
                                          onPointerDown={(e) => {
                                            e.preventDefault()
                                            field.onChange(code)
                                            setOpenLocation(false)
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault()
                                              field.onChange(code)
                                              setOpenLocation(false)
                                            }
                                          }}
                                          onClick={() => {
                                            field.onChange(code)
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availability_options"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>Availability</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {availabilityOptions.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={option.id}
                                    checked={field.value?.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, option.id]);
                                      } else {
                                        field.onChange(current.filter((item) => item !== option.id));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={option.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {option.label}
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

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                      <FormField
                        control={form.control}
                        name="therapistGender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span>Preferred Coach Gender</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Any gender" />
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

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Languages className="w-4 h-4 text-blue-600" />
                              <span>Preferred Language</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Any language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any language</SelectItem>
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

                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>Years of Experience (min)</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || 'any'}>
                              <FormControl>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                <SelectItem value="1">1+ years</SelectItem>
                                <SelectItem value="3">3+ years</SelectItem>
                                <SelectItem value="5">5+ years</SelectItem>
                                <SelectItem value="10">10+ years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="modalities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-blue-600" />
                              <span>Therapy Modalities</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {therapyModalityOptions.map((modality) => (
                                  <div key={modality.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={modality.id}
                                      checked={field.value?.includes(modality.id)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, modality.id]);
                                        } else {
                                          field.onChange(current.filter((item) => item !== modality.id));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={modality.id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {modality.label}
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

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleQuickSearch}
                        className="flex items-center space-x-2"
                      >
                        <Search className="w-4 h-4" />
                        <span>Quick Search</span>
                      </Button>
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
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset All</span>
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Find Matches
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'saved' ? 'Your Saved Coaches' : 'Available Coaches'}
              </h2>
              <p className="text-gray-600">
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
                className="flex items-center space-x-2"
              >
                {showForm ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                <span>{showForm ? 'Hide' : 'Show'} Filters</span>
              </Button>
            )}
          </div>

          {/* No Results Message */}
          {filteredCoaches.length === 0 && !isLoading && (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                {activeTab === 'saved' ? (
                  <>
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Coaches Yet</h3>
                    <p className="text-gray-600 mb-4">
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
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Coaches Found</h3>
                    <p className="text-gray-600 mb-4">
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
            <div className="grid grid-cols-1 gap-6">
              {getCurrentCoaches().map((coach) => (
                <ProviderCard
                  key={coach.id}
                  id={coach.id}
                  name={coach.name}
                  matchScore={coach.matchScore}
                  specialties={coach.specialties}
                  modalities={(() => {
                    const raw = (coach as any).modalities || (coach as any).therapy_modalities
                    if (!Array.isArray(raw)) return []
                    return raw.map((m: any) => {
                      if (typeof m !== 'string') return null
                      const match = therapyModalityOptions.find(o => o.id === m)
                      return match ? match.label : m
                    }).filter(Boolean) as string[]
                  })()}
                  languages={coach.languages}
                  bio={coach.bio}
                  sessionRate={coach.sessionRate}
                  experience={coach.experience}
                  rating={coach.rating}
                  virtualAvailable={coach.virtualAvailable}
                  email={coach.email}
                  isBestMatch={coach.matchScore >= 90}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    onClick={() => handlePageChange(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchCoaches() {
  return (
    <ProtectedRoute>
      <SearchCoachesContent />
    </ProtectedRoute>
  );
}
