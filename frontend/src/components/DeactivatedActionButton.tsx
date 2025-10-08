'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Settings, RefreshCw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

interface DeactivatedActionButtonProps {
  children: React.ReactNode
  action: string // Description of what the user was trying to do
  fallbackText?: string // Custom message
  className?: string
}

export default function DeactivatedActionButton({
  children,
  action,
  fallbackText,
  className
}: DeactivatedActionButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isDeactivated, setIsDeactivated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccountStatus = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const API_URL = getApiUrl()
        const response = await fetch(`${API_URL}/api/${user.role}/deletion-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setIsDeactivated(data.data?.hasPendingDeletion || data.data?.isActive === false)
        }
      } catch (error) {
        // If API fails, assume account is active to avoid blocking unnecessarily
        console.error('Error checking account status:', error)
        setIsDeactivated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccountStatus()
  }, [user])

  if (loading) {
    return <>{children}</>
  }

  if (isDeactivated) {
    return (
      <div className={className}>
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="text-orange-800">
                <strong>Action Unavailable:</strong> {fallbackText || `You cannot ${action} while your account is deactivated.`}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => router.push(`/${user?.role}/settings`)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reactivate Account
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/${user?.role}/settings`)}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Account Settings
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}

// Hook to check if account is deactivated
export const useAccountDeactivated = () => {
  const { user } = useAuth()
  const [isDeactivated, setIsDeactivated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccountStatus = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const API_URL = getApiUrl()
        const response = await fetch(`${API_URL}/api/${user.role}/deletion-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setIsDeactivated(data.data?.hasPendingDeletion || data.data?.isActive === false)
        }
      } catch (error) {
        console.error('Error checking account status:', error)
        setIsDeactivated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccountStatus()
  }, [user])

  return { isDeactivated, loading }
}