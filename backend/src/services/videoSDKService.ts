import jwt = require('jsonwebtoken')
import axios from 'axios'

const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY
const VIDEOSDK_SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY
const VIDEOSDK_API_ENDPOINT = 'https://api.videosdk.live/v2'

interface CreateMeetingResponse {
  meetingId: string
  roomId: string
}

/**
 * Generate JWT token for VideoSDK authentication
 */
export function generateVideoSDKToken(
  permissions: string[] = ['allow_join'],
  expiresIn: string | number = '24h'
): string {
  if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
    throw new Error('VideoSDK credentials not configured')
  }

  const payload = {
    apikey: VIDEOSDK_API_KEY,
    permissions,
    version: 2
  }

  return jwt.sign(payload, VIDEOSDK_SECRET_KEY as string, {
    algorithm: 'HS256',
    expiresIn: expiresIn
  } as any)
}

/**
 * Create a new VideoSDK meeting room
 */
export async function createVideoSDKMeeting(): Promise<CreateMeetingResponse> {
  try {
    const token = generateVideoSDKToken(['allow_join', 'allow_mod'])
    
    const response = await axios.post(
      `${VIDEOSDK_API_ENDPOINT}/rooms`,
      {},
      {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      meetingId: response.data.roomId,
      roomId: response.data.roomId
    }
  } catch (error: any) {
    console.error('Error creating VideoSDK meeting:', error.response?.data || error.message)
    throw new Error('Failed to create VideoSDK meeting')
  }
}

/**
 * Validate a VideoSDK meeting room
 */
export async function validateVideoSDKMeeting(meetingId: string): Promise<boolean> {
  try {
    const token = generateVideoSDKToken()
    
    const response = await axios.get(
      `${VIDEOSDK_API_ENDPOINT}/rooms/validate/${meetingId}`,
      {
        headers: {
          'Authorization': token
        }
      }
    )

    return response.data.roomId === meetingId
  } catch (error) {
    console.error('Error validating VideoSDK meeting:', error)
    return false
  }
}

/**
 * Generate token for a specific participant with custom permissions
 */
export function generateParticipantToken(
  permissions: string[] = ['allow_join'],
  participantRole: 'host' | 'participant' = 'participant'
): string {
  const tokenPermissions = participantRole === 'host' 
    ? ['allow_join', 'allow_mod'] 
    : ['allow_join']

  return generateVideoSDKToken(tokenPermissions)
}

/**
 * End a VideoSDK meeting (host only)
 */
export async function endVideoSDKMeeting(meetingId: string): Promise<void> {
  try {
    const token = generateVideoSDKToken(['allow_mod'])
    
    await axios.post(
      `${VIDEOSDK_API_ENDPOINT}/rooms/end`,
      { roomId: meetingId },
      {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error: any) {
    console.error('Error ending VideoSDK meeting:', error.response?.data || error.message)
    throw new Error('Failed to end VideoSDK meeting')
  }
}