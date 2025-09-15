'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CoachPageWrapper from '@/components/CoachPageWrapper';
import ProfileCardSkeleton from '@/components/ProfileCardSkeleton';
import SessionNotesModal from '@/components/SessionNotesModal';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  MessageCircle, 
  FileText, 
  History,
  Heart,
  Globe,
  Users,
  Target,
  ChevronLeft,
  Video,
  Edit
} from 'lucide-react';
import axios from 'axios';

interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  gender_identity?: string;
  ethnic_identity?: string;
  religious_background?: string;
  language?: string;
  area_of_concern?: string[];
  availability?: string[];
  therapist_gender?: string;
  bio?: string;
  profile_photo?: string;
  created_at: string;
  users?: {
    email: string;
  };
}

interface Session {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes?: string;
  session_notes?: any;
}

interface ClientStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
  memberSince: string;
  lastSession?: string;
  nextSession?: string;
  averageSessionLength: number;
}

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const API_URL = getApiUrl();
  const clientId = params.id as string;

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading client data for ID:', clientId);
      console.log('🔍 API URL:', `${API_URL}/api/coach/client-profile/${clientId}`);

      // Load client profile
      const profileResponse = await axios.get(`${API_URL}/api/coach/client-profile/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (profileResponse.data.success) {
        setClient(profileResponse.data.data.client);
        setSessions(profileResponse.data.data.sessions || []);
        
        // Calculate stats from sessions
        const sessions = profileResponse.data.data.sessions || [];
        const now = new Date();
        
        const completedSessions = sessions.filter((s: Session) => s.status === 'completed');
        const upcomingSessions = sessions.filter((s: Session) => 
          s.status === 'scheduled' || s.status === 'confirmed'
        );
        const cancelledSessions = sessions.filter((s: Session) => s.status === 'cancelled');
        
        const lastCompletedSession = completedSessions
          .sort((a: Session, b: Session) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0];
        
        const nextUpcomingSession = upcomingSessions
          .filter((s: Session) => new Date(s.starts_at) > now)
          .sort((a: Session, b: Session) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
        
        // Calculate average session length
        const sessionLengths = completedSessions.map((s: Session) => 
          (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / (1000 * 60)
        );
        const avgLength = sessionLengths.length > 0 
          ? Math.round(sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length)
          : 60;

        setStats({
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          upcomingSessions: upcomingSessions.length,
          cancelledSessions: cancelledSessions.length,
          memberSince: profileResponse.data.data.client.created_at,
          lastSession: lastCompletedSession?.starts_at,
          nextSession: nextUpcomingSession?.starts_at,
          averageSessionLength: avgLength
        });
      }
    } catch (error: any) {
      console.error('Error loading client data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to load client profile';
      
      if (error.response?.status === 404) {
        errorMessage = 'Client not found. This client may not exist in the system.';
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || 'You do not have permission to view this client profile.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <CoachPageWrapper title="Client Profile" description="Loading client information...">
        <ProfileCardSkeleton />
      </CoachPageWrapper>
    );
  }

  if (error || !client) {
    return (
      <CoachPageWrapper title="Client Profile" description="Error loading client">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Client not found'}</p>
            <Button onClick={() => router.push('/coaches/appointments')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Appointments
            </Button>
          </CardContent>
        </Card>
      </CoachPageWrapper>
    );
  }

  return (
    <CoachPageWrapper 
      title={`${client.first_name} ${client.last_name}'s Profile`}
      description="View client information and session history"
    >
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/coaches/appointments')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Appointments
        </Button>
      </div>

      {/* Client Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {client.profile_photo ? (
                <img
                  src={client.profile_photo}
                  alt={`${client.first_name} ${client.last_name}`}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {client.first_name} {client.last_name}
                </h1>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    {client.email || client.users?.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </div>
                  )}
                  {client.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {client.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/coaches/messages?conversation_with=${client.id}&partner_name=${encodeURIComponent(`${client.first_name} ${client.last_name}`)}`}>
                <Button variant="outline" size="sm">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </Link>
              <Link href={`/coaches/appointments`}>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Sessions
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                </div>
                <History className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedSessions}</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcomingSessions}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-bold">{stats.averageSessionLength}m</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="sessions">Session History</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Client's profile details and background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bio */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About</h3>
                <p className="text-gray-900 dark:text-gray-100">{client.bio || 'No bio provided'}</p>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender Identity</h3>
                  <p className="text-gray-900 dark:text-gray-100">{client.gender_identity || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ethnic Identity</h3>
                  <p className="text-gray-900 dark:text-gray-100">{client.ethnic_identity || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Religious Background</h3>
                  <p className="text-gray-900 dark:text-gray-100">{client.religious_background || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Language</h3>
                  <p className="text-gray-900 dark:text-gray-100">{client.language || 'N/A'}</p>
                </div>

                {client.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</h3>
                    <p className="text-gray-900 dark:text-gray-100">{client.location || 'N/A'}</p>
                  </div>
                )}
              </div>

              {/* Areas of Concern */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Areas of Concern</h3>
                {client.area_of_concern && client.area_of_concern.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {client.area_of_concern.map((concern, index) => (
                      <Badge key={index} variant="secondary">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No areas of concern specified</p>
                )}
              </div>

              {/* Member Since */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Member Since</h3>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(client.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session History Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>All sessions with this client</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No sessions yet with this client
                </p>
              ) : (
                <div className="space-y-4">
                  {sessions
                    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
                    .map((session) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                              {session.status}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(session.starts_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(session.starts_at)} - {formatTime(session.ends_at)}
                            </div>
                            <div>
                              Duration: {Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / (1000 * 60))} minutes
                            </div>
                          </div>
                          {session.notes && (
                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                              Notes: {session.notes}
                            </p>
                          )}
                        </div>
                        {session.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSession(session);
                              setShowNotesModal(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Session Notes
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Client Preferences</CardTitle>
              <CardDescription>Scheduling and therapist preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Availability */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Availability</h3>
                {client.availability && client.availability.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {client.availability.map((time, index) => (
                      <Badge key={index} variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        {time}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No availability preferences specified</p>
                )}
              </div>

              {/* Therapist Gender Preference */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Therapist Gender Preference</h3>
                <p className="text-gray-900 dark:text-gray-100">{client.therapist_gender || 'No preference specified'}</p>
              </div>

              {/* Session Stats */}
              {stats && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.lastSession && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Last Session</p>
                        <p className="font-medium">{formatDate(stats.lastSession)}</p>
                      </div>
                    )}
                    {stats.nextSession && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Next Session</p>
                        <p className="font-medium">{formatDate(stats.nextSession)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cancellation Rate</p>
                      <p className="font-medium">
                        {stats.totalSessions > 0 
                          ? `${Math.round((stats.cancelledSessions / stats.totalSessions) * 100)}%`
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                      <p className="font-medium">
                        {stats.totalSessions > 0 
                          ? `${Math.round((stats.completedSessions / stats.totalSessions) * 100)}%`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Notes Modal */}
      {showNotesModal && selectedSession && (
        <SessionNotesModal
          appointmentId={selectedSession.id}
          clientName={`${client.first_name} ${client.last_name}`}
          sessionDate={selectedSession.starts_at}
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedSession(null);
          }}
          readonly={false}
        />
      )}
    </CoachPageWrapper>
  );
}