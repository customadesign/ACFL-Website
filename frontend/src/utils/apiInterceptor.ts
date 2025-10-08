import { toast } from 'react-hot-toast'

// Global API error handler for deactivated accounts
export const handleApiError = (error: any, router?: any) => {
  if (error?.response?.status === 403 && error?.response?.data?.code === 'ACCOUNT_DEACTIVATED') {
    toast.error('Account deactivated. Redirecting to settings...', {
      duration: 4000,
      icon: '🚫'
    })

    // Redirect to settings page where they can reactivate
    if (router) {
      const userRole = localStorage.getItem('userRole') || 'client'
      router.push(`/${userRole}/settings`)
    }

    return true // Indicates this was a deactivated account error
  }

  return false // Not a deactivated account error
}

// Fetch wrapper that handles deactivated account errors
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 403 && errorData.code === 'ACCOUNT_DEACTIVATED') {
        // Don't show error toast - let the UI components handle this gracefully
        const error = new Error('Your account is deactivated. Some features are not available until you reactivate your account.')
        ;(error as any).isDeactivated = true
        ;(error as any).code = 'ACCOUNT_DEACTIVATED'
        throw error
      }

      throw new Error(errorData.message || 'API request failed')
    }

    return response
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

// Graceful error handler that shows user-friendly messages
export const handleDeactivatedAccountError = (error: any, actionDescription: string) => {
  if (error.code === 'ACCOUNT_DEACTIVATED' || error.isDeactivated) {
    toast.error(`Cannot ${actionDescription}. Your account is deactivated. Please reactivate it in Account Settings.`, {
      duration: 6000,
      icon: '⚠️'
    })
    return true
  }
  return false
}

// Hook to check if user account is active
export const useAccountStatus = () => {
  const checkAccountStatus = async (userRole: string) => {
    try {
      const response = await apiRequest(`/api/${userRole}/deletion-status`)
      const data = await response.json()

      return {
        isActive: data.data?.isActive !== false,
        hasPendingDeletion: data.data?.hasPendingDeletion || false,
        deletion: data.data?.deletion || null
      }
    } catch (error) {
      console.error('Error checking account status:', error)
      return { isActive: true, hasPendingDeletion: false, deletion: null }
    }
  }

  return { checkAccountStatus }
}