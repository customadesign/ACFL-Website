'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SavedCoachesRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the combined search page with saved tab active
    router.replace('/search-coaches?saved=true')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Redirecting to Search & Save Coaches...</p>
      </div>
    </div>
  )
} 