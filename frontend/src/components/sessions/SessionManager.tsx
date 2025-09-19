'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarDays, Clock, User, CreditCard, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import CoachRating from '@/components/coach/CoachRating';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Session {
  id: string;
  coach_id: string;
  client_id: string;
  payment_id?: string;
  session_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  session_notes?: string;
  completion_confirmed_by?: string;
  completed_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

interface SessionManagerProps {
  userRole: 'coach' | 'client' | 'admin';
  userId: string;
}

const SessionManager: React.FC<SessionManagerProps> = ({ userRole, userId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [completingSession, setCompletingSession] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sessionToRate, setSessionToRate] = useState<Session | null>(null);
  const [hasRated, setHasRated] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/v2/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else if (response.status === 501) {
        // Service not implemented yet, use mock data for demo
        setSessions([
          {
            id: 'session-1',
            coach_id: 'coach-123',
            client_id: 'client-456',
            payment_id: 'payment-789',
            session_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 60,
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
        toast.info('Using demo data - session management not fully implemented yet');
      } else {
        toast.error('Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async (sessionId: string, autoCapturePayment = true) => {
    try {
      setCompletingSession(sessionId);
      
      const response = await fetch('/api/payments/v2/sessions/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          session_notes: sessionNotes[sessionId] || '',
          auto_capture_payment: autoCapturePayment,
        }),
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
        toast.success('Session completed! Payment has been processed.');

        // Show rating modal for clients after session completion
        if (userRole === 'client') {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            setSessionToRate(session);
            setShowRatingModal(true);
          }
        }
      } else if (response.status === 501) {
        // Service not implemented yet, simulate completion
        setSessions(prev => prev.map(s =>
          s.id === sessionId
            ? { ...s, status: 'completed' as const, completed_at: new Date().toISOString() }
            : s
        ));
        toast.success('Session completed! (Demo mode - payment would be captured in production)');

        // Show rating modal for clients after session completion (demo mode)
        if (userRole === 'client') {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            setSessionToRate(session);
            setShowRatingModal(true);
          }
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to complete session');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    } finally {
      setCompletingSession(null);
    }
  };

  const cancelSession = async (sessionId: string, reason: string) => {
    try {
      const response = await fetch(`/api/payments/v2/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancellation_reason: reason,
          auto_refund: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { ...s, status: 'cancelled' as const, cancelled_at: new Date().toISOString(), cancellation_reason: reason }
            : s
        ));
        toast.success('Session cancelled. Refund processed according to policy.');
      } else if (response.status === 501) {
        // Service not implemented yet, simulate cancellation
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { ...s, status: 'cancelled' as const, cancelled_at: new Date().toISOString(), cancellation_reason: reason }
            : s
        ));
        toast.success('Session cancelled! (Demo mode - refund would be processed in production)');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to cancel session');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  };

  const getStatusBadge = (status: Session['status']) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Scheduled' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
      'no-show': { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'No Show' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {userRole === 'coach' ? 'My Sessions' : userRole === 'client' ? 'My Appointments' : 'All Sessions'}
        </h2>
        <div className="text-sm text-gray-500">
          Authorization/Capture Payment Flow Demo
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Authorization/Capture Flow</h3>
        <p className="text-sm text-blue-700">
          This demonstrates the new payment flow where payments are authorized when booking 
          and captured only after session completion. This protects both coaches and clients.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No sessions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Session on {formatDate(session.session_date)}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.duration_minutes} minutes
                      </div>
                      {session.payment_id && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          Payment: {session.payment_id.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                {session.status === 'scheduled' && userRole === 'coach' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`notes-${session.id}`}>Session Notes (Optional)</Label>
                      <Textarea
                        id={`notes-${session.id}`}
                        value={sessionNotes[session.id] || ''}
                        onChange={(e) => setSessionNotes(prev => ({
                          ...prev,
                          [session.id]: e.target.value
                        }))}
                        placeholder="Add notes about the session..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => completeSession(session.id)}
                        disabled={completingSession === session.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {completingSession === session.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Session & Capture Payment
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Please provide a reason for cancellation:');
                          if (reason) {
                            cancelSession(session.id, reason);
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Session
                      </Button>
                    </div>
                  </div>
                )}

                {session.status === 'scheduled' && userRole === 'client' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        Your payment is authorized but not yet charged. You will only be charged 
                        after your coach confirms the session is completed.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const reason = prompt('Please provide a reason for cancellation:');
                        if (reason) {
                          cancelSession(session.id, reason);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Session
                    </Button>
                  </div>
                )}

                {session.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Session Completed</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Payment has been captured and processed.
                      {session.completed_at && ` Completed on ${formatDate(session.completed_at)}`}
                    </p>
                    {session.session_notes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-800">Session Notes:</p>
                        <p className="text-sm text-green-700">{session.session_notes}</p>
                      </div>
                    )}
                    {userRole === 'client' && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSessionToRate(session);
                            setShowRatingModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {hasRated[session.id] ? 'Update Rating' : 'Rate Coach'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {session.status === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-800">Session Cancelled</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Refund processed according to cancellation policy.
                      {session.cancelled_at && ` Cancelled on ${formatDate(session.cancelled_at)}`}
                    </p>
                    {session.cancellation_reason && (
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {session.cancellation_reason}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Coach</DialogTitle>
            <DialogDescription>
              Please share your experience with this session to help other clients and improve our service.
            </DialogDescription>
          </DialogHeader>
          {sessionToRate && (
            <CoachRating
              coachId={sessionToRate.coach_id}
              clientId={sessionToRate.client_id}
              sessionId={sessionToRate.id}
              onRatingSubmit={(rating, comment) => {
                setHasRated(prev => ({ ...prev, [sessionToRate.id]: true }));
                setShowRatingModal(false);
                toast.success('Thank you for your feedback!');
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManager;