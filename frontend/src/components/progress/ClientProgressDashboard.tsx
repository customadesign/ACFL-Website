'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Target,
  TrendingUp,
  Calendar,
  Heart,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Star,
  Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import WellnessCheckInComponent from './WellnessCheckIn';
import { getApiUrl } from '@/lib/api';

interface ProgressGoal {
  id: string;
  title: string;
  description?: string;
  category: string;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  current_progress?: number;
  progress_percentage?: number;
  created_at: string;
  updated_at: string;
}

interface WellnessData {
  checkin_date: string;
  mood_rating: number;
  energy_level: number;
  stress_level: number;
  sleep_quality: number;
  exercise_frequency: number;
  nutrition_quality: number;
  social_connection: number;
  overall_wellbeing: number;
}

interface ProgressMilestone {
  id: string;
  title: string;
  description?: string;
  achievement_date: string;
  significance: 'low' | 'medium' | 'high';
  coach_notes?: string;
  client_reflection?: string;
}

interface ClientProgressDashboardProps {
  clientId: string;
  userRole: 'coach' | 'client';
}

const ClientProgressDashboard: React.FC<ClientProgressDashboardProps> = ({
  clientId,
  userRole
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [wellnessHistory, setWellnessHistory] = useState<WellnessData[]>([]);
  const [milestones, setMilestones] = useState<ProgressMilestone[]>([]);
  const [progressStats, setProgressStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
    completionRate: 0,
    avgWellness: 0,
    improvementTrend: 'stable'
  });

  useEffect(() => {
    fetchProgressData();
  }, [clientId]);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchGoals(),
        fetchWellnessHistory(),
        fetchMilestones()
      ]);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/progress/goals?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      } else if (response.status === 501) {
        // Mock data
        const mockGoals: ProgressGoal[] = [
          {
            id: 'goal-1',
            title: 'Daily Mindfulness Practice',
            description: 'Establish a consistent 10-minute daily meditation routine',
            category: 'mindfulness',
            target_value: 30,
            target_unit: 'days',
            target_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high',
            status: 'active',
            current_progress: 18,
            progress_percentage: 60,
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'goal-2',
            title: 'Work-Life Balance',
            description: 'Improve work-life boundaries and reduce overtime',
            category: 'stress_management',
            target_value: 8,
            target_unit: 'techniques',
            target_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'medium',
            status: 'active',
            current_progress: 5,
            progress_percentage: 62,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'goal-3',
            title: 'Social Confidence',
            description: 'Build confidence in social situations',
            category: 'relationships',
            target_value: 10,
            target_unit: 'sessions',
            priority: 'medium',
            status: 'completed',
            current_progress: 10,
            progress_percentage: 100,
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setGoals(mockGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchWellnessHistory = async () => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/progress/wellness?client_id=${clientId}&limit=30`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWellnessHistory(data.checkIns || []);
      } else if (response.status === 501) {
        // Mock wellness data for the last 14 days
        const mockWellnessData: WellnessData[] = [];
        for (let i = 13; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          mockWellnessData.push({
            checkin_date: date.toISOString().split('T')[0],
            mood_rating: Math.floor(Math.random() * 3) + 6 + (i % 3), // 6-9 range with some variation
            energy_level: Math.floor(Math.random() * 3) + 5 + (i % 4), // 5-8 range
            stress_level: Math.floor(Math.random() * 3) + 3 + (i % 3), // 3-6 range (lower is better)
            sleep_quality: Math.floor(Math.random() * 3) + 6 + (i % 3), // 6-9 range
            exercise_frequency: Math.floor(Math.random() * 4) + 2, // 2-5 days
            nutrition_quality: Math.floor(Math.random() * 3) + 6 + (i % 3), // 6-9 range
            social_connection: Math.floor(Math.random() * 3) + 5 + (i % 4), // 5-8 range
            overall_wellbeing: Math.floor(Math.random() * 3) + 6 + (i % 3) // 6-9 range
          });
        }
        setWellnessHistory(mockWellnessData);
      }
    } catch (error) {
      console.error('Error fetching wellness history:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/progress/milestones?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      } else if (response.status === 501) {
        // Mock milestones
        const mockMilestones: ProgressMilestone[] = [
          {
            id: 'milestone-1',
            title: 'First Successful Week of Meditation',
            description: 'Completed 7 consecutive days of mindfulness practice',
            achievement_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            significance: 'high',
            coach_notes: 'Great breakthrough in establishing routine!',
            client_reflection: 'I feel much calmer and more focused'
          },
          {
            id: 'milestone-2',
            title: 'Successful Social Interaction',
            description: 'Initiated conversation with new colleague',
            achievement_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            significance: 'medium',
            coach_notes: 'Building social confidence',
            client_reflection: 'Felt nervous but proud of myself'
          }
        ];
        setMilestones(mockMilestones);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  // Calculate stats when data changes
  useEffect(() => {
    if (goals.length > 0) {
      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const activeGoals = goals.filter(g => g.status === 'active').length;
      const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      setProgressStats(prev => ({
        ...prev,
        totalGoals,
        completedGoals,
        activeGoals,
        completionRate
      }));
    }

    if (wellnessHistory.length > 0) {
      const avgWellness = wellnessHistory.reduce((sum, w) => sum + w.overall_wellbeing, 0) / wellnessHistory.length;
      const recent5 = wellnessHistory.slice(-5);
      const early5 = wellnessHistory.slice(0, 5);

      let improvementTrend = 'stable';
      if (recent5.length >= 3 && early5.length >= 3) {
        const recentAvg = recent5.reduce((sum, w) => sum + w.overall_wellbeing, 0) / recent5.length;
        const earlyAvg = early5.reduce((sum, w) => sum + w.overall_wellbeing, 0) / early5.length;

        if (recentAvg > earlyAvg + 0.5) improvementTrend = 'improving';
        else if (recentAvg < earlyAvg - 0.5) improvementTrend = 'declining';
      }

      setProgressStats(prev => ({
        ...prev,
        avgWellness,
        improvementTrend
      }));
    }
  }, [goals, wellnessHistory]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return { icon: TrendingUp, color: 'text-green-600' };
      case 'declining': return { icon: TrendingUp, color: 'text-red-600 transform rotate-180' };
      default: return { icon: TrendingUp, color: 'text-gray-600' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Goals</p>
                <p className="text-2xl font-bold dark:text-white">{progressStats.totalGoals}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{progressStats.completedGoals}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round(progressStats.completionRate)}%</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Wellness Trend</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold dark:text-white">{Math.round(progressStats.avgWellness * 10) / 10}</p>
                  {(() => {
                    const { icon: Icon, color } = getTrendIcon(progressStats.improvementTrend);
                    return <Icon className={`w-6 h-6 ${color}`} />;
                  })()}
                </div>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="wellness" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Wellness
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold dark:text-white">Progress Goals</h3>
            {userRole === 'client' && (
              <WellnessCheckInComponent
                clientId={clientId}
                userRole={userRole}
                onCheckInSaved={fetchWellnessHistory}
              />
            )}
          </div>

          <div className="grid gap-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold dark:text-white">{goal.title}</h4>
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{goal.description}</p>
                      )}
                    </div>
                  </div>

                  {goal.target_value && goal.current_progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Progress</span>
                        <span>{goal.current_progress} / {goal.target_value} {goal.target_unit}</span>
                      </div>
                      <Progress value={goal.progress_percentage || 0} className="h-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {goal.progress_percentage || 0}% complete
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {goal.target_date
                          ? `Due: ${new Date(goal.target_date).toLocaleDateString()}`
                          : 'No due date'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wellness" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold dark:text-white">Wellness Tracking</h3>
            {userRole === 'client' && (
              <WellnessCheckInComponent
                clientId={clientId}
                userRole={userRole}
                onCheckInSaved={fetchWellnessHistory}
              />
            )}
          </div>

          {wellnessHistory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm dark:text-white">Wellness Trends (14 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={wellnessHistory.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="checkin_date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis domain={[1, 10]} />
                      <Tooltip
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="overall_wellbeing"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Overall Wellbeing"
                      />
                      <Line
                        type="monotone"
                        dataKey="mood_rating"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Mood"
                      />
                      <Line
                        type="monotone"
                        dataKey="stress_level"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Stress Level"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm dark:text-white">Latest Wellness Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  {wellnessHistory.length > 0 && (
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={[
                        {
                          subject: 'Mood',
                          value: wellnessHistory[wellnessHistory.length - 1]?.mood_rating || 0
                        },
                        {
                          subject: 'Energy',
                          value: wellnessHistory[wellnessHistory.length - 1]?.energy_level || 0
                        },
                        {
                          subject: 'Sleep',
                          value: wellnessHistory[wellnessHistory.length - 1]?.sleep_quality || 0
                        },
                        {
                          subject: 'Social',
                          value: wellnessHistory[wellnessHistory.length - 1]?.social_connection || 0
                        },
                        {
                          subject: 'Nutrition',
                          value: wellnessHistory[wellnessHistory.length - 1]?.nutrition_quality || 0
                        },
                        {
                          subject: 'Low Stress',
                          value: 11 - (wellnessHistory[wellnessHistory.length - 1]?.stress_level || 5)
                        }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 10]} />
                        <Radar
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Achievements & Milestones</h3>

          <div className="space-y-4">
            {milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      milestone.significance === 'high' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      milestone.significance === 'medium' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Award className={`w-6 h-6 ${
                        milestone.significance === 'high' ? 'text-yellow-600 dark:text-yellow-400' :
                        milestone.significance === 'medium' ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-600 dark:text-gray-300'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold dark:text-white">{milestone.title}</h4>
                        <Badge className={
                          milestone.significance === 'high' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          milestone.significance === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }>
                          {milestone.significance} impact
                        </Badge>
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(milestone.achievement_date).toLocaleDateString()}</span>
                      </div>
                      {milestone.client_reflection && (
                        <blockquote className="text-sm italic text-gray-700 dark:text-gray-300 border-l-4 border-blue-200 pl-3 py-1">
                          "{milestone.client_reflection}"
                        </blockquote>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Progress Insights</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm dark:text-white">Goal Categories Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={
                    Object.entries(
                      goals.reduce((acc, goal) => {
                        const category = goal.category.replace('_', ' ');
                        if (!acc[category]) acc[category] = { category, total: 0, completed: 0 };
                        acc[category].total++;
                        if (goal.status === 'completed') acc[category].completed++;
                        return acc;
                      }, {} as Record<string, { category: string; total: number; completed: number }>)
                    ).map(([_, data]) => ({
                      ...data,
                      completion_rate: data.total > 0 ? (data.completed / data.total) * 100 : 0
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#e5e7eb" name="Total Goals" />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm dark:text-white">Weekly Wellness Average</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={
                    wellnessHistory
                      .slice(-14)
                      .reduce((weeks, data, index) => {
                        const weekIndex = Math.floor(index / 7);
                        if (!weeks[weekIndex]) {
                          weeks[weekIndex] = {
                            week: `Week ${weekIndex + 1}`,
                            mood: 0,
                            energy: 0,
                            stress: 0,
                            overall: 0,
                            count: 0
                          };
                        }
                        weeks[weekIndex].mood += data.mood_rating;
                        weeks[weekIndex].energy += data.energy_level;
                        weeks[weekIndex].stress += (11 - data.stress_level); // Inverted for better visualization
                        weeks[weekIndex].overall += data.overall_wellbeing;
                        weeks[weekIndex].count++;
                        return weeks;
                      }, [] as any[])
                      .map(week => ({
                        ...week,
                        mood: Math.round(week.mood / week.count),
                        energy: Math.round(week.energy / week.count),
                        stress: Math.round(week.stress / week.count),
                        overall: Math.round(week.overall / week.count)
                      }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[1, 10]} />
                    <Tooltip />
                    <Bar dataKey="mood" fill="#10b981" name="Mood" />
                    <Bar dataKey="energy" fill="#3b82f6" name="Energy" />
                    <Bar dataKey="overall" fill="#8b5cf6" name="Overall" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {goals.filter(g => g.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Goals</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {wellnessHistory.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Wellness Check-ins</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {milestones.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Milestones Achieved</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientProgressDashboard;