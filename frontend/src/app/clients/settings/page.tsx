'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/lib/api'
import { Download, FileText, FileImage, Trash2, AlertTriangle, ArrowLeft, Calendar, Shield, UserX, CheckCircle, XCircle, Clock } from 'lucide-react'

interface DeletionStatus {
  isActive: boolean
  deactivatedAt: string | null
  hasPendingDeletion: boolean
  deletion: {
    id: string
    scheduled_deletion_at: string
    deactivated_at: string
    status: string
    reason: string | null
  } | null
}

function SettingsContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletionReason, setDeletionReason] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  useEffect(() => {
    fetchDeletionStatus()
  }, [])

  const fetchDeletionStatus = async () => {
    try {
      setLoadingStatus(true)
      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/deletion-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeletionStatus(data.data)
      } else {
        console.error('Failed to fetch deletion status')
      }
    } catch (error) {
      console.error('Error fetching deletion status:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/export-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ format })
      })

      if (response.ok) {
        // Create a blob from the response and trigger download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `client-data-export-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        setSuccess(`Your data export (${format.toUpperCase()}) has been downloaded successfully.`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to export data')
      }
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestDeletion = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/request-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: deletionReason })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account deletion has been scheduled. Your account is now deactivated and will be permanently deleted in 30 days.')
        setShowDeleteDialog(false)
        setDeletionReason('')
        await fetchDeletionStatus()
      } else {
        setError(data.message || 'Failed to request account deletion')
      }
    } catch (error) {
      console.error('Deletion request error:', error)
      setError('Failed to request account deletion. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelDeletion = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const API_URL = getApiUrl()
      const response = await fetch(`${API_URL}/api/client/cancel-deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account deletion has been cancelled. Your account has been reactivated.')
        await fetchDeletionStatus()
      } else {
        setError(data.message || 'Failed to cancel account deletion')
      }
    } catch (error) {
      console.error('Cancel deletion error:', error)
      setError('Failed to cancel account deletion. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilDeletion = (deletionDate: string) => {
    const days = Math.ceil((new Date(deletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                  <p className="text-gray-600 dark:text-gray-300">Manage your data and account preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Alerts */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Account Status */}
          {!loadingStatus && deletionStatus && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Account Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account Status:</span>
                    <div className="flex items-center space-x-2">
                      {deletionStatus.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">Deactivated</span>
                        </>
                      )}
                    </div>
                  </div>

                  {deletionStatus.hasPendingDeletion && deletionStatus.deletion && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-800 mb-2">Account Deletion Scheduled</h4>
                          <div className="space-y-2 text-sm text-red-700">
                            <p>
                              <strong>Deactivated:</strong> {formatDate(deletionStatus.deletion.deactivated_at)}
                            </p>
                            <p>
                              <strong>Scheduled Deletion:</strong> {formatDate(deletionStatus.deletion.scheduled_deletion_at)}
                            </p>
                            <p>
                              <strong>Days Remaining:</strong> {getDaysUntilDeletion(deletionStatus.deletion.scheduled_deletion_at)} days
                            </p>
                            {deletionStatus.deletion.reason && (
                              <p>
                                <strong>Reason:</strong> {deletionStatus.deletion.reason}
                              </p>
                            )}
                          </div>
                          <div className="mt-4">
                            <Button
                              onClick={handleCancelDeletion}
                              disabled={isLoading}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isLoading ? 'Cancelling...' : 'Cancel Deletion'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Export */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Your Data</span>
              </CardTitle>
              <CardDescription>
                Download a copy of all your personal data, including profile information, session history, messages, and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-semibold mb-2">CSV Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download your data in CSV format, suitable for spreadsheet applications.
                    </p>
                    <Button
                      onClick={() => handleExportData('csv')}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Generating...' : 'Download CSV'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <FileImage className="w-12 h-12 mx-auto mb-4 text-red-600" />
                    <h3 className="font-semibold mb-2">PDF Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a comprehensive PDF report of your data.
                    </p>
                    <Button
                      onClick={() => handleExportData('pdf')}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      {isLoading ? 'Generating...' : 'Download PDF'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Account Deletion */}
          {deletionStatus && !deletionStatus.hasPendingDeletion && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <UserX className="w-5 h-5" />
                  <span>Delete Account</span>
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">What happens when you delete your account:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      <li>Your account will be immediately deactivated</li>
                      <li>You will lose access to all your data and sessions</li>
                      <li>Your data will be permanently deleted after 30 days</li>
                      <li>You can cancel the deletion within 30 days by contacting support</li>
                      <li>This action cannot be undone after the 30-day period</li>
                    </ul>
                  </div>

                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete My Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete your account? This will immediately deactivate your account and schedule it for permanent deletion in 30 days.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reason">Reason for deletion (optional)</Label>
                          <Textarea
                            id="reason"
                            placeholder="Let us know why you're deleting your account..."
                            value={deletionReason}
                            onChange={(e) => setDeletionReason(e.target.value)}
                            maxLength={500}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleRequestDeletion}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Deleting...' : 'Delete Account'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function ClientSettings() {
  return <SettingsContent />
}