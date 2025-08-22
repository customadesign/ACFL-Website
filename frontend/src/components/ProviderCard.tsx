'use client';

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import Link from 'next/link';

function getMatchStyles(matchScore: number, isBestMatch?: boolean) {
  return isBestMatch 
    ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200"
    : "hidden";
}

export interface ProviderCardProps {
  id?: string;
  name: string;
  matchScore: number;
  specialties: string[];
  modalities?: string[];
  languages: string[];
  bio: string;
  sessionRate: string;
  experience: string;
  rating: number;
  virtualAvailable: boolean;
  email?: string;
  isBestMatch?: boolean;
  onSaveChange?: () => void;
  initialIsSaved?: boolean; // Pass saved state from parent
}

export const ProviderCard = ({
  id,
  name,
  matchScore,
  specialties,
  languages,
  modalities,
  bio,
  sessionRate,
  experience,
  rating,
  virtualAvailable,
  email,
  isBestMatch,
  onSaveChange,
  initialIsSaved = false
}: ProviderCardProps) => {
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [showAllModalities, setShowAllModalities] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const safeSpecialties = specialties || [];
  const initialSpecialties = safeSpecialties.slice(0, 4);
  const remainingSpecialties = safeSpecialties.slice(4);
  const safeModalities = modalities || [];
  const initialModalities = safeModalities.slice(0, 4);
  const remainingModalities = safeModalities.slice(4);

  // Use initialIsSaved prop from parent (which comes from database) and sync with localStorage
  useEffect(() => {
    setIsSaved(initialIsSaved)
    
    // Also update localStorage to sync with database state
    try {
      const coachId = id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const savedCoaches = JSON.parse(localStorage.getItem('savedCoaches') || '[]')
      
      if (initialIsSaved) {
        // Ensure it's in localStorage
        const exists = savedCoaches.some((coach: any) => coach.id === coachId)
        if (!exists) {
          const coachData = {
            id: coachId,
            name,
            specialties,
            modalities,
            languages,
            bio,
            sessionRate,
            experience,
            rating,
            matchScore,
            virtualAvailable,
            email
          }
          savedCoaches.push(coachData)
          localStorage.setItem('savedCoaches', JSON.stringify(savedCoaches))
        }
      } else {
        // Ensure it's not in localStorage
        const updatedCoaches = savedCoaches.filter((coach: any) => coach.id !== coachId)
        if (updatedCoaches.length !== savedCoaches.length) {
          localStorage.setItem('savedCoaches', JSON.stringify(updatedCoaches))
        }
      }
    } catch (error) {
      console.error('Error syncing saved coaches:', error)
    }
  }, [initialIsSaved, id, name, specialties, modalities, languages, bio, sessionRate, experience, rating, matchScore, virtualAvailable, email])

  const handleSaveToggle = async () => {
    try {
      const coachId = id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const API_URL = getApiUrl()
      
      if (isSaved) {
        // Remove from saved
        const response = await fetch(`${API_URL}/api/client/saved-coaches/${coachId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          setIsSaved(false)
          // Update localStorage
          const savedCoaches = JSON.parse(localStorage.getItem('savedCoaches') || '[]')
          const updatedCoaches = savedCoaches.filter((coach: any) => coach.id !== coachId)
          localStorage.setItem('savedCoaches', JSON.stringify(updatedCoaches))
          onSaveChange?.()
        }
      } else {
        // Add to saved
        const response = await fetch(`${API_URL}/api/client/saved-coaches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ coachId })
        })
        
        if (response.ok) {
          setIsSaved(true)
          // Update localStorage
          const savedCoaches = JSON.parse(localStorage.getItem('savedCoaches') || '[]')
          const coachData = {
            id: coachId,
            name,
            specialties,
            modalities,
            languages,
            bio,
            sessionRate,
            experience,
            rating,
            matchScore,
            virtualAvailable,
            email
          }
          savedCoaches.push(coachData)
          localStorage.setItem('savedCoaches', JSON.stringify(savedCoaches))
          onSaveChange?.()
        } else if (response.status === 409) {
          // Duplicate key error - coach is already saved
          console.log('Coach already saved, updating UI state')
          setIsSaved(true)
          // Make sure localStorage is synced
          const savedCoaches = JSON.parse(localStorage.getItem('savedCoaches') || '[]')
          const exists = savedCoaches.some((coach: any) => coach.id === coachId)
          if (!exists) {
            const coachData = {
              id: coachId,
              name,
              specialties,
              modalities,
              languages,
              bio,
              sessionRate,
              experience,
              rating,
              matchScore,
              virtualAvailable,
              email
            }
            savedCoaches.push(coachData)
            localStorage.setItem('savedCoaches', JSON.stringify(savedCoaches))
          }
          onSaveChange?.()
        } else {
          throw new Error(`Failed to save coach: ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Error saving coach:', error)
    }
  }
  const hasMoreSpecialties = safeSpecialties.length > 4;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl p-6 transition-all duration-300 hover:transform hover:scale-[1.01] border-0",
      "flex flex-col md:flex-row md:items-start md:space-x-6 md:space-y-0 space-y-4",
      isBestMatch && "ring-2 ring-blue-500 dark:ring-blue-400 ring-opacity-50 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-white dark:to-gray-800"
    )}>
      {/* Left side - Main info (takes more space on large screens) */}
      <div className="flex-1 md:flex-[2]">
        {isBestMatch && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-xs font-semibold inline-block mb-4">
            🏆 Best Match
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
          <div className="flex-1">
            <Link href={`/clients/coach-profile/${id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">{name}</h3>
            </Link>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-xl inline-block">
              <span className="text-sm font-semibold">{matchScore}% Match</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{bio}</p>
        </div>
        
        <div className="space-y-3 md:space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Specialties</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(initialSpecialties || []).map((specialty) => (
                <span
                  key={specialty}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md"
                >
                  {specialty}
                </span>
              ))}
              {showAllSpecialties && (remainingSpecialties || []).map((specialty) => (
                <span
                  key={specialty}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md"
                >
                  {specialty}
                </span>
              ))}
            </div>
            {hasMoreSpecialties && (
              <button
                onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 mt-1 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {showAllSpecialties ? (
                  <>Show less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>See {remainingSpecialties.length} more <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            )}
          </div>

          {safeModalities.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Therapy Modalities</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(initialModalities || []).map((modality) => (
                  <span
                    key={modality}
                    className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-md"
                  >
                    {modality}
                  </span>
                ))}
                {showAllModalities && (remainingModalities || []).map((modality) => (
                  <span
                    key={modality}
                    className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-md"
                  >
                    {modality}
                  </span>
                ))}
              </div>
              {safeModalities.length > 4 && (
                <button
                  onClick={() => setShowAllModalities(!showAllModalities)}
                  className="flex items-center gap-1 text-sm text-purple-700 dark:text-purple-400 mt-1 hover:text-purple-900 dark:hover:text-purple-300"
                >
                  {showAllModalities ? (
                    <>Show less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>See {remainingModalities.length} more <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              )}
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Languages</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(languages || []).map((language) => (
                <span
                  key={language}
                  className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-1 rounded-md border border-orange-200 dark:border-orange-800"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Provider details and actions (sidebar on large screens) */}
      <div className="md:flex-1 md:min-w-0 space-y-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 rounded-xl p-4">
          <p className="text-sm font-medium mb-3 text-gray-800 dark:text-gray-200">Provider Details</p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{experience}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">⭐ {rating}/5</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Session Rate</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{sessionRate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Session Format</p>
              <div className="flex gap-1 mt-1">
                {virtualAvailable && (
                  <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-md">
                    Video Sessions
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
          
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2">
          <Link href={`/clients/coach-profile/${id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="flex-1">
            <button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
              View Full Profile
            </button>
          </Link>
          <button
            onClick={handleSaveToggle}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-colors font-medium ${
              isSaved
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save coach'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="text-sm">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  )
} 