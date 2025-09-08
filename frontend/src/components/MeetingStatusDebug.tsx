'use client'

import React, { useMemo } from 'react'
import { useMeeting } from '@/contexts/MeetingContext'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

/**
 * Debug component to show current meeting status - Remove in production
 */
export default function MeetingStatusDebug() {
  const { isInMeeting, currentMeetingId, canJoinMeeting } = useMeeting()

  // Memoize the function calls to prevent infinite loops
  const canJoinNew = useMemo(() => canJoinMeeting('test-meeting'), [canJoinMeeting])
  const canRejoinSame = useMemo(() => 
    currentMeetingId ? canJoinMeeting(currentMeetingId) : false, 
    [canJoinMeeting, currentMeetingId]
  )

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs font-mono z-50">
      <h3 className="text-yellow-400 font-bold mb-2">🔧 Meeting Debug (Dev Only)</h3>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {isInMeeting ? (
            <AlertCircle className="w-3 h-3 text-red-400" />
          ) : (
            <CheckCircle className="w-3 h-3 text-green-400" />
          )}
          <span>In Meeting: {isInMeeting ? 'Yes' : 'No'}</span>
        </div>
        
        {currentMeetingId && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>Meeting ID: {currentMeetingId.substring(0, 12)}...</span>
          </div>
        )}
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="text-green-400">
            ✅ Can join new: {canJoinNew ? 'Yes' : 'No'}
          </div>
          {currentMeetingId && (
            <div className="text-blue-400">
              🔄 Can rejoin same: {canRejoinSame ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}