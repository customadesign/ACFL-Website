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
    setIsInMeeting(inMeeting);
    setCurrentMeetingId(meetingId);
  };

  const canJoinMeeting = (meetingId: string) => {
    // Allow joining if not in any meeting, or if trying to rejoin the same meeting
    return !isInMeeting || currentMeetingId === meetingId;
  };

  return (
    <MeetingContext.Provider value={{ isInMeeting, currentMeetingId, setMeetingState, canJoinMeeting }}>
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