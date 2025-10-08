'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, UserX, Download, RefreshCw } from 'lucide-react'

interface DeactivatedAccountGuardProps {
  children: React.ReactNode
}

const DeactivatedAccountGuard: React.FC<DeactivatedAccountGuardProps> = ({ children }) => {
  const { user, logout } = useAuth()
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
        const response = await fetch(`/api/${user.role}/deletion-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setIsDeactivated(data.data?.hasPendingDeletion || !data.data?.isActive)
        }
      } catch (error) {
        console.error('Error checking account status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAccountStatus()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (isDeactivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <UserX className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Account Deactivated</CardTitle>
              <CardDescription>
                Your account has been deactivated and access to most features is restricted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>Limited Access:</strong> You can only access account reactivation and data export functions.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Available Actions:</h3>

                <div className="grid gap-3">
                  <Button
                    onClick={() => router.push(`/${user?.role}/settings`)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Your Data
                  </Button>

                  <Button
                    onClick={() => router.push(`/${user?.role}/settings`)}
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Cancel Account Deletion
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">
                    Need help? Contact our support team for assistance with reactivating your account.
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open('mailto:support@actcoaching.com', '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      Contact Support
                    </Button>

                    <Button
                      onClick={logout}
                      variant="ghost"
                      size="sm"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default DeactivatedAccountGuard