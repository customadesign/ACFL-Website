'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Settings, Download, RefreshCw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

interface DeletionStatus {
  isActive: boolean
  hasPendingDeletion: boolean
  deletion: {
    scheduled_deletion_at: string
    deactivated_at: string
    reason?: string
  } | null
}

export default function DeactivatedAccountBanner() {
  const { user } = useAuth()
  const router = useRouter()
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeletionStatus = async () => {
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
          setDeletionStatus(data.data)
        }
      } catch (error) {
        console.error('Error fetching deletion status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeletionStatus()
  }, [user])

  const getDaysUntilDeletion = (deletionDate: string) => {
    const days = Math.ceil((new Date(deletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  if (loading || !deletionStatus || (!deletionStatus.hasPendingDeletion && deletionStatus.isActive !== false)) {
    return null
  }

  if (!isVisible) {
    return null
  }

  const daysLeft = deletionStatus.deletion
    ? getDaysUntilDeletion(deletionStatus.deletion.scheduled_deletion_at)
    : 0

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4 relative">
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <strong>Account Deactivated:</strong> Your account access is limited.
            {deletionStatus.hasPendingDeletion && (
              <span className="block sm:inline sm:ml-1">
                Your account will be permanently deleted in <strong>{daysLeft} days</strong>.
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/${user?.role}/settings`)}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <Download className="w-3 h-3 mr-1" />
              Export Data
            </Button>

            {deletionStatus.hasPendingDeletion && (
              <Button
                size="sm"
                onClick={() => router.push(`/${user?.role}/settings`)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Cancel Deletion
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/${user?.role}/settings`)}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </Button>
          </div>
        </AlertDescription>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  )
}