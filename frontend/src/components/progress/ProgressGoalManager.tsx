'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  PauseCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

interface ProgressGoal {
  id: string;
  client_id: string;
  coach_id: string;
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

interface ProgressGoalManagerProps {
  clientId: string;
  clientName: string;
  coachId: string;
  userRole: 'coach' | 'client';
}

const ProgressGoalManager: React.FC<ProgressGoalManagerProps> = ({
  clientId,
  clientName,
  coachId,
  userRole
}) => {
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ProgressGoal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal',
    target_value: '',
    target_unit: 'sessions',
    target_date: '',
    priority: 'medium' as const
  });

  useEffect(() => {
    fetchGoals();
  }, [clientId]);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/progress/goals?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      } else if (response.status === 501) {
        // Service not implemented yet, use mock data
        setGoals([
          {
            id: 'goal-1',
            client_id: clientId,
            coach_id: coachId,
            title: 'Improve Daily Mindfulness Practice',
            description: 'Establish a consistent 10-minute daily meditation routine',
            category: 'mindfulness',
            target_value: 30,
            target_unit: 'days',
            target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high',
            status: 'active',
            current_progress: 12,
            progress_percentage: 40,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'goal-2',
            client_id: clientId,
            coach_id: coachId,
            title: 'Reduce Work-Related Stress',
            description: 'Implement stress management techniques during work hours',
            category: 'stress_management',
            target_value: 7,
            target_unit: 'techniques',
            target_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'medium',
            status: 'active',
            current_progress: 3,
            progress_percentage: 43,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        toast.info('Using demo data - progress tracking not fully implemented yet');
      } else {
        toast.error('Failed to load progress goals');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load progress goals');
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async () => {
    try {
      const goalData = {
        ...newGoal,
        client_id: clientId,
        coach_id: coachId,
        target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : null,
        target_date: newGoal.target_date || null
      };

      const response = await fetch('/api/progress/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        const result = await response.json();
        setGoals(prev => [result.goal, ...prev]);
        toast.success('Progress goal created successfully');
        resetForm();
        setShowCreateModal(false);
      } else if (response.status === 501) {
        // Service not implemented, simulate creation
        const mockGoal: ProgressGoal = {
          id: `goal-${Date.now()}`,
          ...goalData,
          status: 'active',
          current_progress: 0,
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setGoals(prev => [mockGoal, ...prev]);
        toast.success('Progress goal created successfully (Demo mode)');
        resetForm();
        setShowCreateModal(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const updateGoalStatus = async (goalId: string, newStatus: ProgressGoal['status']) => {
    try {
      const response = await fetch(`/api/progress/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setGoals(prev => prev.map(goal =>
          goal.id === goalId ? { ...goal, status: newStatus } : goal
        ));
        toast.success(`Goal ${newStatus === 'completed' ? 'completed' : newStatus}`);
      } else if (response.status === 501) {
        // Service not implemented, simulate update
        setGoals(prev => prev.map(goal =>
          goal.id === goalId ? { ...goal, status: newStatus } : goal
        ));
        toast.success(`Goal ${newStatus === 'completed' ? 'completed' : newStatus} (Demo mode)`);
      } else {
        toast.error('Failed to update goal status');
      }
    } catch (error) {
      console.error('Error updating goal status:', error);
      toast.error('Failed to update goal status');
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/progress/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
        toast.success('Goal deleted successfully');
      } else if (response.status === 501) {
        // Service not implemented, simulate deletion
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
        toast.success('Goal deleted successfully (Demo mode)');
      } else {
        toast.error('Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const resetForm = () => {
    setNewGoal({
      title: '',
      description: '',
      category: 'personal',
      target_value: '',
      target_unit: 'sessions',
      target_date: '',
      priority: 'medium'
    });
    setEditingGoal(null);
  };

  const getStatusIcon = (status: ProgressGoal['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: ProgressGoal['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: ProgressGoal['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Progress Goals</h3>
          <p className="text-sm text-gray-500">
            Track {userRole === 'coach' ? `${clientName}'s` : 'your'} progress towards coaching objectives
          </p>
        </div>
        {userRole === 'coach' && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Progress Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="Enter goal title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Describe the goal..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newGoal.category} onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal Growth</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                        <SelectItem value="stress_management">Stress Management</SelectItem>
                        <SelectItem value="relationships">Relationships</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="health">Health & Wellness</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newGoal.priority} onValueChange={(value: any) => setNewGoal({ ...newGoal, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_value">Target Value</Label>
                    <Input
                      id="target_value"
                      type="number"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target_unit">Unit</Label>
                    <Select value={newGoal.target_unit} onValueChange={(value) => setNewGoal({ ...newGoal, target_unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sessions">Sessions</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="techniques">Techniques</SelectItem>
                        <SelectItem value="score">Score</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createGoal} disabled={!newGoal.title.trim()}>
                    Create Goal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No progress goals yet</p>
            {userRole === 'coach' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge className={getStatusColor(goal.status)}>
                        {getStatusIcon(goal.status)}
                        <span className="ml-1 capitalize">{goal.status}</span>
                      </Badge>
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority.toUpperCase()}
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                    )}
                  </div>
                  {userRole === 'coach' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingGoal(goal)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGoal(goal.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goal.target_value && goal.current_progress !== undefined && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">
                          {goal.current_progress} / {goal.target_value} {goal.target_unit}
                        </span>
                      </div>
                      <Progress value={goal.progress_percentage || 0} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {goal.progress_percentage || 0}% complete
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
                      <TrendingUp className="w-4 h-4" />
                      <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {userRole === 'coach' && goal.status === 'active' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateGoalStatus(goal.id, 'completed')}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateGoalStatus(goal.id, 'paused')}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        <PauseCircle className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressGoalManager;