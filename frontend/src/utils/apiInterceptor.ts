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
        toast.error('Your account is deactivated. Please reactivate it to continue.', {
          duration: 5000,
          icon: '🚫'
        })

        // Redirect to settings page
        const userRole = localStorage.getItem('userRole') || 'client'
        window.location.href = `/${userRole}/settings`

        throw new Error('ACCOUNT_DEACTIVATED')
      }

      throw new Error(errorData.message || 'API request failed')
    }

    return response
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
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