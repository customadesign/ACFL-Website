import { getApiUrl } from '@/lib/api'

const API_URL = getApiUrl()
const USE_MOCK = false // Using real VideoSDK credentials now

export interface MeetingConfig {
  meetingId: string
  token: string
  name: string
  micEnabled: boolean
  webcamEnabled: boolean
  mode: 'CONFERENCE' | 'VIEWER'
}

export interface CreateMeetingResponse {
  meetingId: string
  token: string
}

/**
 * Generate auth token for VideoSDK
 */
export async function generateToken(appointmentId: string, userRole: 'coach' | 'client'): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/meetings/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        appointmentId,
        role: userRole 
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate meeting token')
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('Error generating token:', error)
    throw error
  }
}

/**
 * Create or get meeting room
 */
export async function createOrGetMeeting(appointmentId: string, isHost: boolean): Promise<CreateMeetingResponse> {
  // Mock is disabled - always use real VideoSDK
  if (USE_MOCK) {
    console.log('Mock mode is disabled - using real VideoSDK')
  }

  try {
    const response = await fetch(`${API_URL}/api/meetings/create-or-get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        appointmentId,
        isHost 
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create/get meeting')
    }

    const data = await response.json()
    return {
      meetingId: data.meetingId,
      token: data.token
    }
  } catch (error) {
    console.error('Error creating/getting meeting:', error)
    throw error
  }
}

/**
 * Validate meeting before joining
 */
export async function validateMeeting(meetingId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/meetings/validate/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.isValid
  } catch (error) {
    console.error('Error validating meeting:', error)
    return false
  }
}

/**
 * End meeting (host only)
 */
export async function endMeeting(meetingId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/meetings/end/${meetingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to end meeting')
    }
  } catch (error) {
    console.error('Error ending meeting:', error)
    throw error
  }
}

/**
 * Update meeting participant status
 */
export async function updateParticipantStatus(
  meetingId: string, 
  status: 'joined' | 'left' | 'waiting'
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/meetings/participant-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        meetingId,
        status 
      })
    })
  } catch (error) {
    console.error('Error updating participant status:', error)
  }
}