"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function FindCoachRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const fromAssessment = searchParams.get('from') === 'assessment'
    
    if (fromAssessment) {
      // If from assessment, wait a moment then redirect to results
      // This gives users time to see the completion message
      setTimeout(() => {
        router.push('/results')
      }, 2000)
    } else {
      // If accessing directly, redirect to homepage immediately
      router.replace('/')
    }
  }, [router, searchParams])

  const fromAssessment = searchParams.get('from') === 'assessment'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        {fromAssessment ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Finding Your Perfect Coach Matches...</h1>
            <p className="text-gray-600 mb-4">We're analyzing your preferences to find the best coaches for you.</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto"></div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting...</h1>
            <p className="text-gray-600">Taking you back to our homepage...</p>
          </>
        )}
    </div>
  </div>
  )
}