'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MeetingContextType {
  isInMeeting: boolean;
  currentMeetingId: string | null;
  setMeetingState: (isInMeeting: boolean, meetingId: string | null) => void;
  canJoinMeeting: (meetingId: string) => boolean;
  registerMeetingAttempt: (meetingId: string) => boolean;
  unregisterMeetingAttempt: (meetingId: string) => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [activeMeetingAttempts, setActiveMeetingAttempts] = useState<Set<string>>(new Set());

  const setMeetingState = (inMeeting: boolean, meetingId: string | null) => {
    setIsInMeeting(inMeeting);
    setCurrentMeetingId(meetingId);
  };

  const canJoinMeeting = (meetingId: string) => {
    // Allow joining if not in any meeting, or if trying to rejoin the same meeting
    return !isInMeeting || currentMeetingId === meetingId;
  };

  const registerMeetingAttempt = (meetingId: string): boolean => {
    // Check if user can join before registering
    if (!canJoinMeeting(meetingId)) {
      return false;
    }
    
    // If already attempting this same meeting, allow it (rejoin case)
    if (activeMeetingAttempts.has(meetingId)) {
      return true;
    }
    
    // If already in a different meeting or attempting a different meeting, reject
    if (isInMeeting || (activeMeetingAttempts.size > 0 && !activeMeetingAttempts.has(meetingId))) {
      return false;
    }
    
    // Register the meeting attempt
    setActiveMeetingAttempts(prev => new Set(prev).add(meetingId));
    return true;
  };

  const unregisterMeetingAttempt = (meetingId: string) => {
    setActiveMeetingAttempts(prev => {
      const newSet = new Set(prev);
      newSet.delete(meetingId);
      return newSet;
    });
  };

  return (
    <MeetingContext.Provider value={{ 
      isInMeeting, 
      currentMeetingId, 
      setMeetingState, 
      canJoinMeeting,
      registerMeetingAttempt,
      unregisterMeetingAttempt 
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