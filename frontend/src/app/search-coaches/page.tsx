'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ProviderCard } from '@/components/ProviderCard'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Filter, Search, RefreshCw } from 'lucide-react'
import { STATE_NAMES } from '@/constants/states'
import { 
  concernOptions, 
  modalityOptions, 
  genderIdentityOptions, 
  ethnicIdentityOptions, 
  religiousBackgroundOptions, 
  availabilityOptions, 
  paymentOptions 
} from '@/constants/formOptions'
import { LANGUAGES } from '@/constants/languages'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { findMatches, getAllCoaches } from '@/lib/api'

// Simplified form validation schema
const searchFormSchema = z.object({
  areaOfConcern: z.array(z.string()).min(1, 'Please select at least one area of concern'),
  location: z.string().min(1, 'Please select your location'),
  availability: z.array(z.string()).min(1, 'Please select at least one availability option'),
  therapistGender: z.string().optional().or(z.literal('any')),
  language: z.string().optional().or(z.literal('any')),
})

type SearchFormData = z.infer<typeof searchFormSchema>

// Coach interface to match the API response from database
interface Coach {
  id: string
  name: string
  specialties: string[]
  languages: string[]
  bio: string
  sessionRate: string
  experience: string
  rating: number
  matchScore: number
  virtualAvailable: boolean
  inPersonAvailable: boolean
  email?: string
  // Additional fields that might be returned from database
  location?: string[]
  availableTimes?: string[]
  certifications?: string[]
  insuranceAccepted?: string[]
  demographics?: {
    gender: string
    ethnicity: string
    religion: string
  }
}

function SearchCoachesContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState<Coach[]>([])
  const [allCoaches, setAllCoaches] = useState<Coach[]>([])
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortBy, setSortBy] = useState('match')
  const [currentPage, setCurrentPage] = useState(1)
  const coachesPerPage = 9

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      areaOfConcern: [],
      availability: [],
      location: '',
      therapistGender: '',
      language: '',
    },
  })

  // Load user's previous search preferences from localStorage
  useEffect(() => {
    const loadUserPreferences = () => {
      try {
        const savedFormData = localStorage.getItem('formData')
        if (savedFormData) {
          const data = JSON.parse(savedFormData)
          form.setValue('location', data.location || '')
          form.setValue('language', data.language || 'any')
          form.setValue('therapistGender', data.therapistGender || 'any')
          form.setValue('areaOfConcern', data.areaOfConcern || [])
          form.setValue('availability', data.availability || [])
        }
      } catch (error) {
        console.error('Error loading saved preferences:', error)
      }
    }

    loadUserPreferences()
    loadAllCoaches()
  }, [form])

  // Load all coaches for modern search
  const loadAllCoaches = async () => {
    try {
      setIsLoading(true)
      setError(null) // Clear any previous errors
      
      console.log('Loading coaches from database...')
      const coaches = await getAllCoaches()
      
      console.log('Loaded coaches from database:', coaches)
      console.log('Number of coaches loaded:', coaches.length)
      
      setAllCoaches(coaches)
      setFilteredCoaches(coaches)
      
    } catch (error) {
      console.error('Error loading coaches:', error)
      setError(`Failed to load coaches: ${error instanceof Error ? error.message : 'Network error'}`)
      
      // Temporary fallback with test data to show the UI is working
      console.log('Using fallback test data...')
      const fallbackCoaches = [
        {
          id: 'test-1',
          name: 'Dr. Lisa Thompson',
          specialties: ['Anxiety', 'Depression', 'Work Stress'],
          languages: ['English', 'Spanish'],
          bio: 'Dr. Thompson is a licensed clinical psychologist with over 10 years of experience specializing in Acceptance and Commitment Therapy (ACT).',
          sessionRate: '$120/session',
          experience: '10 years',
          rating: 4.8,
          matchScore: 85,
          virtualAvailable: true,
          inPersonAvailable: true,
          email: 'lisa.thompson@example.com'
        },
        {
          id: 'test-2',
          name: 'Dr. James Wilson',
          specialties: ['Trauma', 'PTSD', 'Anxiety'],
          languages: ['English'],
          bio: 'Dr. Wilson specializes in trauma recovery and PTSD treatment using ACT principles.',
          sessionRate: '$110/session',
          experience: '8 years',
          rating: 4.9,
          matchScore: 78,
          virtualAvailable: true,
          inPersonAvailable: false,
          email: 'james.wilson@example.com'
        }
      ]
      setAllCoaches(fallbackCoaches)
      setFilteredCoaches(fallbackCoaches)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle quick search
  const handleQuickSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredCoaches(allCoaches)
      return
    }

    const filtered = allCoaches.filter(coach => 
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specialties.some(specialty => 
        specialty.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      coach.bio.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredCoaches(filtered)
  }

  // Sort coaches
  useEffect(() => {
    const sorted = [...filteredCoaches].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'experience':
          return parseInt(b.experience) - parseInt(a.experience)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'match':
        default:
          return b.matchScore - a.matchScore
      }
    })
    setFilteredCoaches(sorted)
  }, [sortBy, allCoaches])

  // Pagination logic
  const indexOfLastCoach = currentPage * coachesPerPage
  const indexOfFirstCoach = indexOfLastCoach - coachesPerPage
  const currentCoaches = filteredCoaches.slice(indexOfFirstCoach, indexOfLastCoach)
  const totalPages = Math.ceil(filteredCoaches.length / coachesPerPage)

  // Reset to first page when search results change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredCoaches.length])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (data: SearchFormData) => {
    setIsLoading(true)
    setShowForm(false)
    setError(null) // Clear any previous errors
    
    try {
      // Prepare data for API call, converting 'any' to empty strings
      const apiData = {
        ...data,
        language: data.language === 'any' ? '' : data.language,
        therapistGender: data.therapistGender === 'any' ? '' : data.therapistGender,
      }
      
      // Call the real API
      const result = await findMatches(apiData)
      
      setMatches(result.matches)
      setHasSearched(true)
      
      // Save form data to localStorage
      localStorage.setItem('formData', JSON.stringify(data))
      localStorage.setItem('matches', JSON.stringify(result.matches))
      

    } catch (error) {
      console.error('Error searching coaches:', error)
      setError('Failed to search coaches. Please try again.')
      setShowForm(true) // Show form again on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                alt="ACT Coaching For Life Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900">ACT Coaching For Life</h1>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.firstName || user?.email}!
              </span>
              <button
                onClick={loadAllCoaches}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => logout()}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
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
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm whitespace-nowrap">
              Search Coaches
            </button>
            <Link href="/profile">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Profile
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Coach</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete the assessment below to get personalized coach matches based on your goals, preferences, and needs.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">
              {hasSearched ? 'Finding your perfect coach matches...' : 'Loading coaches from database...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        )}



        {/* Error Message */}
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

        {/* Debug Info - Temporary */}
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          <strong>Debug Info:</strong>
          <br />
          All Coaches Count: {allCoaches.length}
          <br />
          Filtered Coaches Count: {filteredCoaches.length}
          <br />
          Current Page: {currentPage}
          <br />
          Coaches Per Page: {coachesPerPage}
          <br />
          Total Pages: {totalPages}
          <br />
          Current Coaches Showing: {currentCoaches.length}
          <br />
          Loading: {isLoading ? 'Yes' : 'No'}
          <br />
          Has Searched: {hasSearched ? 'Yes' : 'No'}
          <br />
          Show Form: {showForm ? 'Yes' : 'No'}
          <br />
          {allCoaches.length > 0 && (
            <>
              First Coach: {allCoaches[0]?.name} (ID: {allCoaches[0]?.id})
              <br />
              Data Source: {allCoaches[0]?.id?.startsWith('test-') ? 'Fallback Test Data' : 'Database'}
            </>
          )}
        </div>

        {/* Modern Search Interface */}
        {showForm && !isLoading && (
          <div className="max-w-6xl mx-auto">
           
            {/* Quick Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by specialty, location, or coach name..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  variant="outline"
                  className="px-6 py-3"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button 
                  onClick={handleQuickSearch}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden mb-8">
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Areas of Concern */}
                        <FormField
                          control={form.control}
                          name="areaOfConcern"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Areas of Concern</FormLabel>
                              <div className="space-y-2 mt-2">
                                {concernOptions.slice(0, 6).map((option) => (
                                  <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="areaOfConcern"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
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
                                        <FormLabel className="font-normal text-xs">
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

                        {/* Location */}
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Location</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your state" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[200px]">
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

                        {/* Availability */}
                        <FormField
                          control={form.control}
                          name="availability"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Availability</FormLabel>
                              <div className="space-y-2 mt-2">
                                {availabilityOptions.slice(0, 4).map((option) => (
                                  <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="availability"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
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
                                        <FormLabel className="font-normal text-xs">
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

                        {/* Coach Gender */}
                        <FormField
                          control={form.control}
                          name="therapistGender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Coach Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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

                        {/* Language */}
                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Language</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Any language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="any">Any language</SelectItem>
                                  {LANGUAGES.slice(0, 8).map((language) => (
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

                        {/* Search Button */}
                        <div className="flex items-end">
                          <Button 
                            type="submit" 
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            🔍 Search Coaches
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Quick Results Preview */}
            {!isLoading && allCoaches.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Available Coaches ({filteredCoaches.length})
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">Best Match</SelectItem>
                        <SelectItem value="rating">Highest Rating</SelectItem>
                        <SelectItem value="experience">Most Experience</SelectItem>
                        <SelectItem value="name">Name A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentCoaches.map((coach, index) => (
                    <div key={coach.id} className="transform transition-all duration-300 hover:scale-[1.02]">
                      <ProviderCard {...coach} isBestMatch={index === 0} />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        className="px-3 py-2"
                      >
                        ← Previous
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              className="px-3 py-2 min-w-[40px]"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        className="px-3 py-2"
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}

                {/* Remove the "View All Coaches" button since we have pagination now */}
              </div>
            )}

            {/* No Coaches Found */}
            {!isLoading && allCoaches.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No coaches found in database</h3>
                <p className="text-gray-600 mb-6">There are currently no coaches available in the system. Please check back later or contact support.</p>
                <Button
                  onClick={loadAllCoaches}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {hasSearched && !isLoading && !showForm && (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Coach Matches</h2>
                <p className="text-lg text-gray-600 mb-2">
                  We found {matches.length} coach{matches.length !== 1 ? 'es' : ''} who match your preferences
                </p>
                {matches.length > 0 && (
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-gray-500">Match Quality:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const excellent = matches.filter(m => m.matchScore >= 90)
                        const good = matches.filter(m => m.matchScore >= 75 && m.matchScore < 90)
                        const fair = matches.filter(m => m.matchScore < 75)
                        const ranges = []
                        if (excellent.length > 0) ranges.push({ label: 'Excellent Match', count: excellent.length, color: 'bg-green-100 text-green-800', range: '90%+' })
                        if (good.length > 0) ranges.push({ label: 'Good Match', count: good.length, color: 'bg-blue-100 text-blue-800', range: '75-89%' })
                        if (fair.length > 0) ranges.push({ label: 'Fair Match', count: fair.length, color: 'bg-orange-100 text-orange-800', range: '<75%' })
                        return ranges.map((range, index) => (
                          <div key={index} className={`${range.color} px-3 py-1 rounded-full text-sm font-medium`}>
                            {range.count} {range.label}{range.count > 1 ? 'es' : ''} ({range.range})
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                New Search
              </Button>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No coaches found</h3>
                <p className="text-gray-600 mb-6">We couldn't find any coaches matching your current preferences. Try adjusting your search criteria for better results.</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Modify Search Criteria
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pagination for search results */}
                {(() => {
                  const searchResultsPerPage = 9
                  const searchIndexOfLastCoach = currentPage * searchResultsPerPage
                  const searchIndexOfFirstCoach = searchIndexOfLastCoach - searchResultsPerPage
                  const currentSearchResults = matches.slice(searchIndexOfFirstCoach, searchIndexOfLastCoach)
                  const searchTotalPages = Math.ceil(matches.length / searchResultsPerPage)

                  return (
                    <>
                      <div className="space-y-6">
                        {currentSearchResults.map((provider, index) => (
                          <div key={provider.id || provider.name} className="transform transition-all duration-300 hover:scale-[1.01]">
                            <ProviderCard {...provider} isBestMatch={index === 0} />
                          </div>
                        ))}
                      </div>

                      {/* Pagination for search results */}
                      {searchTotalPages > 1 && (
                        <div className="flex justify-center mt-8">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              variant="outline"
                              className="px-3 py-2"
                            >
                              ← Previous
                            </Button>
                            
                            {/* Page numbers */}
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: Math.min(5, searchTotalPages) }, (_, i) => {
                                let pageNum
                                if (searchTotalPages <= 5) {
                                  pageNum = i + 1
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1
                                } else if (currentPage >= searchTotalPages - 2) {
                                  pageNum = searchTotalPages - 4 + i
                                } else {
                                  pageNum = currentPage - 2 + i
                                }
                                
                                return (
                                  <Button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    className="px-3 py-2 min-w-[40px]"
                                  >
                                    {pageNum}
                                  </Button>
                                )
                              })}
                            </div>
                            
                            <Button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === searchTotalPages}
                              variant="outline"
                              className="px-3 py-2"
                            >
                              Next →
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchCoaches() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <SearchCoachesContent />
    </ProtectedRoute>
  )
} 