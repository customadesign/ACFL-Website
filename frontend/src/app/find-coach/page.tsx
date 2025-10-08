'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function FindCoachPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/clients/search-coaches')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Redirecting...</h2>
        <p className="text-gray-500">Taking you to the coach search page</p>
      </div>
    </div>
  )
}