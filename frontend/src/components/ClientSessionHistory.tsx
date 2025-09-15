'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, FileText, ChevronDown, ChevronUp, User } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { apiGet } from '@/lib/api-client';
import SessionNotesModal from './SessionNotesModal';

interface SessionNote {
  id: string;
  notes?: string;
  goals_met?: string[];
  next_steps?: string;
  created_at: string;
  updated_at: string;
}

interface Session {
  id: string;
  client_id: string;
  coach_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes?: string;
  session_notes?: SessionNote[];
}

interface ClientSessionHistoryProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientSessionHistory({
  clientId,
  clientName,
  isOpen,
  onClose
}: ClientSessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  const API_URL = getApiUrl();

  useEffect(() => {
    if (isOpen && clientId) {
      loadSessionHistory();
    }
  }, [isOpen, clientId]);

  const loadSessionHistory = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`${API_URL}/api/coach/clients/${clientId}/sessions`);
      
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading session history:', error);
      setError('Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'confirmed':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const handleViewNotes = (session: Session) => {
    setSelectedSession(session);
    setShowNotesModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Session History
              </CardTitle>
              <CardDescription>
                {clientName} - {sessions.length} total sessions
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading session history...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
                {error}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No sessions found for this client.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-sm">
                                {new Date(session.starts_at).toLocaleDateString()}
                              </span>
                              <Clock className="w-4 h-4 text-gray-500 ml-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(session.starts_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {session.session_notes && session.session_notes.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewNotes(session)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Notes
                            </Button>
                          )}
                          {session.status === 'completed' && (!session.session_notes || session.session_notes.length === 0) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewNotes(session)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Add Notes
                            </Button>
                          )}
                          <button
                            onClick={() => toggleSessionExpand(session.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            {expandedSession === session.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {expandedSession === session.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / (1000 * 60))} minutes
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Session Type</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">Virtual Session</p>
                            </div>
                          </div>
                          
                          {session.notes && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Session Description</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">{session.notes}</p>
                            </div>
                          )}
                          
                          {session.session_notes && session.session_notes.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                Session Notes Preview
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                {session.session_notes[0].notes || 'Notes recorded for this session.'}
                              </p>
                              {session.session_notes[0].goals_met && session.session_notes[0].goals_met.length > 0 && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                  {session.session_notes[0].goals_met.length} goals met
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Notes Modal */}
      {showNotesModal && selectedSession && (
        <SessionNotesModal
          appointmentId={selectedSession.id}
          clientName={clientName}
          sessionDate={selectedSession.starts_at}
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedSession(null);
            loadSessionHistory(); // Reload to get updated notes
          }}
          readonly={selectedSession.status !== 'completed'}
        />
      )}
    </>
  );
}