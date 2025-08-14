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
  onSaveChange
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

  // Check if coach is saved on component mount
  useEffect(() => {
    const checkIfSaved = () => {
      try {
        const savedCoaches = localStorage.getItem('savedCoaches')
        if (savedCoaches) {
          const coaches = JSON.parse(savedCoaches)
          const coachId = id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          setIsSaved(coaches.some((coach: any) => coach.id === coachId))
        }
      } catch (error) {
        console.error('Error checking saved coaches:', error)
      }
    }
    
    checkIfSaved()
  }, [id, name])

  const handleSaveToggle = async () => {
    try {
      const coachId = id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const API_URL = getApiUrl()
      
      if (isSaved) {
        // Remove from saved
        await fetch(`${API_URL}/api/client/saved-coaches/${coachId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        setIsSaved(false)
        // Update localStorage
        const savedCoaches = JSON.parse(localStorage.getItem('savedCoaches') || '[]')
        const updatedCoaches = savedCoaches.filter((coach: any) => coach.id !== coachId)
        localStorage.setItem('savedCoaches', JSON.stringify(updatedCoaches))
      } else {
        // Add to saved
        await fetch(`${API_URL}/api/client/saved-coaches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ coachId })
        })
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
      }
    } catch (error) {
      console.error('Error saving coach:', error)
    }
  }
  const hasMoreSpecialties = safeSpecialties.length > 4;

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-xl hover:shadow-2xl p-6 transition-all duration-300 hover:transform hover:scale-[1.01] border-0",
      "flex flex-col md:flex-row md:items-start md:space-x-6 md:space-y-0 space-y-4",
      isBestMatch && "ring-2 ring-blue-500 ring-opacity-50 bg-gradient-to-br from-blue-50 to-white"
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
            <Link href={`/coach/${id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer transition-colors">{name}</h3>
            </Link>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-xl inline-block">
              <span className="text-sm font-semibold">{matchScore}% Match</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">{bio}</p>
        </div>
        
        <div className="space-y-3 md:space-y-2">
          <div>
            <p className="text-sm font-medium">Specialties</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(initialSpecialties || []).map((specialty) => (
                <span
                  key={specialty}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md"
                >
                  {specialty}
                </span>
              ))}
              {showAllSpecialties && (remainingSpecialties || []).map((specialty) => (
                <span
                  key={specialty}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md"
                >
                  {specialty}
                </span>
              ))}
            </div>
            {hasMoreSpecialties && (
              <button
                onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                className="flex items-center gap-1 text-sm text-blue-600 mt-1 hover:text-blue-800"
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
              <p className="text-sm font-medium">Therapy Modalities</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(initialModalities || []).map((modality) => (
                  <span
                    key={modality}
                    className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md"
                  >
                    {modality}
                  </span>
                ))}
                {showAllModalities && (remainingModalities || []).map((modality) => (
                  <span
                    key={modality}
                    className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md"
                  >
                    {modality}
                  </span>
                ))}
              </div>
              {safeModalities.length > 4 && (
                <button
                  onClick={() => setShowAllModalities(!showAllModalities)}
                  className="flex items-center gap-1 text-sm text-purple-700 mt-1 hover:text-purple-900"
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
            <p className="text-sm font-medium">Languages</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(languages || []).map((language) => (
                <span
                  key={language}
                  className="bg-[#F4B183]/20 text-[#96551C] text-xs px-2 py-1 rounded-md border border-[#F4B183]/30"
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
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
          <p className="text-sm font-medium mb-3">Provider Details</p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-gray-500">Experience</p>
              <p className="text-sm font-medium">{experience}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rating</p>
              <p className="text-sm font-medium">⭐ {rating}/5</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Session Rate</p>
              <p className="text-sm font-medium">{sessionRate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Session Format</p>
              <div className="flex gap-1 mt-1">
                {virtualAvailable && (
                  <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md">
                    Video Sessions
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
          
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2">
          <Link href={`/coach/${id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="flex-1">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
              View Full Profile
            </button>
          </Link>
          <button
            onClick={handleSaveToggle}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-colors font-medium ${
              isSaved
                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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