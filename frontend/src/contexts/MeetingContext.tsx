'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MeetingContextType {
  isInMeeting: boolean;
  currentMeetingId: string | null;
  setMeetingState: (isInMeeting: boolean, meetingId: string | null) => void;
  canJoinMeeting: (meetingId: string) => boolean;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

const MEETING_STATE_KEY = 'acfl_meeting_state';
const MEETING_TIMESTAMP_KEY = 'acfl_meeting_timestamp';
const MEETING_TIMEOUT = 5 * 60 * 1000; // 5 minutes - stale meeting state timeout

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedState = localStorage.getItem(MEETING_STATE_KEY);
      const savedTimestamp = localStorage.getItem(MEETING_TIMESTAMP_KEY);

      if (savedState && savedTimestamp) {
        const timestamp = parseInt(savedTimestamp, 10);
        const now = Date.now();

        // If saved state is older than MEETING_TIMEOUT, clear it (stale session)
        if (now - timestamp > MEETING_TIMEOUT) {
          console.log('🧹 Clearing stale meeting state (older than 5 minutes)');
          localStorage.removeItem(MEETING_STATE_KEY);
          localStorage.removeItem(MEETING_TIMESTAMP_KEY);
        } else {
          const state = JSON.parse(savedState);
          console.log('🔄 Restoring meeting state from localStorage:', state);
          setIsInMeeting(state.isInMeeting);
          setCurrentMeetingId(state.currentMeetingId);
        }
      }
    } catch (error) {
      console.error('Failed to restore meeting state:', error);
      localStorage.removeItem(MEETING_STATE_KEY);
      localStorage.removeItem(MEETING_TIMESTAMP_KEY);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      if (isInMeeting && currentMeetingId) {
        const state = { isInMeeting, currentMeetingId };
        localStorage.setItem(MEETING_STATE_KEY, JSON.stringify(state));
        localStorage.setItem(MEETING_TIMESTAMP_KEY, Date.now().toString());
        console.log('💾 Saved meeting state to localStorage:', state);
      } else {
        // Clear storage when not in meeting
        localStorage.removeItem(MEETING_STATE_KEY);
        localStorage.removeItem(MEETING_TIMESTAMP_KEY);
        console.log('🧹 Cleared meeting state from localStorage');
      }
    } catch (error) {
      console.error('Failed to save meeting state:', error);
    }
  }, [isInMeeting, currentMeetingId, isInitialized]);

  const setMeetingState = (inMeeting: boolean, meetingId: string | null) => {
    console.log('🔄 Meeting state change:', { inMeeting, meetingId, currentMeetingId });
    setIsInMeeting(inMeeting);
    setCurrentMeetingId(meetingId);
  };

  const canJoinMeeting = (meetingId: string) => {
    // Simple logic: Allow joining if not in any meeting, or if trying to rejoin the same meeting
    const canJoin = !isInMeeting || currentMeetingId === meetingId;
    // Only log for real meeting IDs, not test ones
    if (meetingId !== 'test-meeting') {
      console.log('🔍 Can join meeting check:', { meetingId, currentMeetingId, isInMeeting, canJoin });
    }
    return canJoin;
  };

  return (
    <MeetingContext.Provider value={{
      isInMeeting,
      currentMeetingId,
      setMeetingState,
      canJoinMeeting
    }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}