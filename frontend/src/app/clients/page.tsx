'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

function ClientRedirect() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Redirect authenticated clients to search coaches page
    if (user) {
      router.replace('/clients/search-coaches')
    }
  }, [user, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Taking you to find coaches...</p>
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <ClientRedirect />
    </ProtectedRoute>
  )
}