'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CoachPageWrapper from '@/components/CoachPageWrapper';
import ProgressGoalManager from '@/components/progress/ProgressGoalManager';
import ClientProgressDashboard from '@/components/progress/ClientProgressDashboard';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  TrendingUp,
  Target,
  Search,
  Filter,
  Calendar,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react';
import { toast } from 'react-toastify';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_sessions: number;
  active_goals: number;
  completed_goals: number;
  last_session: string | null;
  progress_trend: 'improving' | 'stable' | 'declining';
  avg_wellness: number;
}

const CoachProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'needs_attention'>('all');
  const [progressStats, setProgressStats] = useState({
    totalClients: 0,
    activeGoals: 0,
    completedGoals: 0,
    avgClientProgress: 0
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coach/clients/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
        calculateStats(data.clients || []);
      } else if (response.status === 501) {
        // Mock data for demo
        const mockClients: Client[] = [
          {
            id: 'client-1',
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah@example.com',
            total_sessions: 8,
            active_goals: 2,
            completed_goals: 1,
            last_session: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            progress_trend: 'improving',
            avg_wellness: 7.5
          },
          {
            id: 'client-2',
            first_name: 'Mike',
            last_name: 'Chen',
            email: 'mike@example.com',
            total_sessions: 12,
            active_goals: 3,
            completed_goals: 2,
            last_session: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            progress_trend: 'stable',
            avg_wellness: 6.8
          },
          {
            id: 'client-3',
            first_name: 'Emily',
            last_name: 'Rodriguez',
            email: 'emily@example.com',
            total_sessions: 6,
            active_goals: 1,
            completed_goals: 0,
            last_session: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            progress_trend: 'declining',
            avg_wellness: 5.2
          }
        ];
        setClients(mockClients);
        calculateStats(mockClients);
        toast.info('Using demo data - progress tracking not fully implemented yet');
      } else {
        toast.error('Failed to load client progress data');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load client progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (clientData: Client[]) => {
    const totalClients = clientData.length;
    const activeGoals = clientData.reduce((sum, client) => sum + client.active_goals, 0);
    const completedGoals = clientData.reduce((sum, client) => sum + client.completed_goals, 0);
    const avgClientProgress = totalClients > 0
      ? clientData.reduce((sum, client) => sum + client.avg_wellness, 0) / totalClients
      : 0;

    setProgressStats({
      totalClients,
      activeGoals,
      completedGoals,
      avgClientProgress
    });
  };

  const getFilteredClients = () => {
    let filtered = clients;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(client => client.active_goals > 0);
        break;
      case 'needs_attention':
        filtered = filtered.filter(client =>
          client.progress_trend === 'declining' ||
          client.avg_wellness < 6 ||
          !client.last_session ||
          new Date(client.last_session) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        );
        break;
    }

    return filtered;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '📊';
    }
  };

  if (isLoading) {
    return (
      <CoachPageWrapper title="Client Progress" description="Track and manage your clients' progress">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </CoachPageWrapper>
    );
  }

  const filteredClients = getFilteredClients();

  if (selectedClient) {
    return (
      <CoachPageWrapper title={`${selectedClient.first_name} ${selectedClient.last_name} - Progress`} description="Detailed progress tracking">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedClient(null)}
            >
              ← Back to All Clients
            </Button>
            <Badge className="text-sm">
              {selectedClient.total_sessions} sessions completed
            </Badge>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dashboard">Progress Dashboard</TabsTrigger>
              <TabsTrigger value="goals">Manage Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <ClientProgressDashboard
                clientId={selectedClient.id}
                userRole="coach"
              />
            </TabsContent>

            <TabsContent value="goals">
              <ProgressGoalManager
                clientId={selectedClient.id}
                clientName={`${selectedClient.first_name} ${selectedClient.last_name}`}
                coachId={user?.id || ''}
                userRole="coach"
              />
            </TabsContent>
          </Tabs>
        </div>
      </CoachPageWrapper>
    );
  }

  return (
    <CoachPageWrapper title="Client Progress" description="Track and manage your clients' progress">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-2xl font-bold">{progressStats.totalClients}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Goals</p>
                  <p className="text-2xl font-bold text-blue-600">{progressStats.activeGoals}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Goals</p>
                  <p className="text-2xl font-bold text-green-600">{progressStats.completedGoals}</p>
                </div>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Wellness</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(progressStats.avgClientProgress * 10) / 10}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search clients by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="active">With Active Goals</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client List */}
        <div className="grid gap-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No clients match your current filters'
                    : 'No clients found'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {client.first_name} {client.last_name}
                        </h3>
                        <span className="text-sm">{getTrendIcon(client.progress_trend)}</span>
                        <span className={`text-sm font-medium ${getTrendColor(client.progress_trend)}`}>
                          {client.progress_trend}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{client.email}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Sessions</p>
                          <p className="font-medium">{client.total_sessions}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Active Goals</p>
                          <p className="font-medium text-blue-600">{client.active_goals}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="font-medium text-green-600">{client.completed_goals}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Wellness</p>
                          <p className="font-medium">{client.avg_wellness}/10</p>
                        </div>
                      </div>

                      {client.last_session && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Last session: {new Date(client.last_session).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => setSelectedClient(client)}
                        className="w-full"
                      >
                        View Progress
                      </Button>
                      {(client.progress_trend === 'declining' ||
                        client.avg_wellness < 6 ||
                        !client.last_session ||
                        new Date(client.last_session) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) && (
                        <Badge variant="destructive" className="text-xs text-center">
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </CoachPageWrapper>
  );
};

export default CoachProgressPage;