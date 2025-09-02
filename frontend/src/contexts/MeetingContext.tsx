'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MeetingContextType {
  isInMeeting: boolean;
  currentMeetingId: string | null;
  setMeetingState: (isInMeeting: boolean, meetingId: string | null) => void;
  canJoinMeeting: (meetingId: string) => boolean;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);

  const setMeetingState = (inMeeting: boolean, meetingId: string | null) => {
    console.log('🔄 Meeting state change:', { inMeeting, meetingId, currentMeetingId });
    setIsInMeeting(inMeeting);
    setCurrentMeetingId(meetingId);
  };

  const canJoinMeeting = (meetingId: string) => {
    // Simple logic: Allow joining if not in any meeting, or if trying to rejoin the same meeting
    const canJoin = !isInMeeting || currentMeetingId === meetingId;
    console.log('🔍 Can join meeting check:', { meetingId, currentMeetingId, isInMeeting, canJoin });
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