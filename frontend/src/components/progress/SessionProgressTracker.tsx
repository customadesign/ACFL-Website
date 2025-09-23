'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  TrendingUp,
  Target,
  CheckCircle,
  Star,
  BookOpen,
  MessageSquare,
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

interface ProgressGoal {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface SessionProgress {
  id: string;
  session_id: string;
  goal_id?: string;
  progress_rating: number;
  achievements: string;
  challenges: string;
  next_session_focus: string;
  homework_assigned: string;
  coach_notes: string;
  client_reflection: string;
  created_at: string;
  updated_at: string;
}

interface SessionProgressTrackerProps {
  sessionId: string;
  clientId: string;
  clientName: string;
  userRole: 'coach' | 'client';
  onProgressSaved?: () => void;
}

const SessionProgressTracker: React.FC<SessionProgressTrackerProps> = ({
  sessionId,
  clientId,
  clientName,
  userRole,
  onProgressSaved
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableGoals, setAvailableGoals] = useState<ProgressGoal[]>([]);
  const [existingProgress, setExistingProgress] = useState<SessionProgress | null>(null);
  const [progressData, setProgressData] = useState({
    goal_id: 'none',
    progress_rating: [7],
    achievements: '',
    challenges: '',
    next_session_focus: '',
    homework_assigned: '',
    coach_notes: '',
    client_reflection: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchAvailableGoals();
      fetchExistingProgress();
    }
  }, [isOpen, sessionId, clientId]);

  const fetchAvailableGoals = async () => {
    try {
      const response = await fetch(`/api/progress/goals?client_id=${clientId}&status=active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableGoals(data.goals || []);
      } else if (response.status === 501) {
        // Mock data for demo
        setAvailableGoals([
          {
            id: 'goal-1',
            title: 'Improve Daily Mindfulness Practice',
            category: 'mindfulness',
            status: 'active'
          },
          {
            id: 'goal-2',
            title: 'Reduce Work-Related Stress',
            category: 'stress_management',
            status: 'active'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchExistingProgress = async () => {
    try {
      const response = await fetch(`/api/progress/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          setExistingProgress(data.progress);
          setProgressData({
            goal_id: data.progress.goal_id || 'none',
            progress_rating: [data.progress.progress_rating || 7],
            achievements: data.progress.achievements || '',
            challenges: data.progress.challenges || '',
            next_session_focus: data.progress.next_session_focus || '',
            homework_assigned: data.progress.homework_assigned || '',
            coach_notes: data.progress.coach_notes || '',
            client_reflection: data.progress.client_reflection || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing progress:', error);
    }
  };

  const saveProgress = async () => {
    try {
      setIsLoading(true);

      const payload = {
        session_id: sessionId,
        goal_id: progressData.goal_id === 'none' ? null : progressData.goal_id || null,
        progress_rating: progressData.progress_rating[0],
        achievements: progressData.achievements.trim(),
        challenges: progressData.challenges.trim(),
        next_session_focus: progressData.next_session_focus.trim(),
        homework_assigned: progressData.homework_assigned.trim(),
        coach_notes: progressData.coach_notes.trim(),
        client_reflection: progressData.client_reflection.trim()
      };

      const url = existingProgress
        ? `/api/progress/session/${existingProgress.id}`
        : '/api/progress/session';

      const method = existingProgress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setExistingProgress(result.progress);
        toast.success('Session progress saved successfully');
        onProgressSaved?.();
        setIsOpen(false);
      } else if (response.status === 501) {
        // Mock success for demo
        toast.success('Session progress saved successfully (Demo mode)');
        onProgressSaved?.();
        setIsOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save progress');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingText = (rating: number) => {
    if (rating >= 9) return 'Excellent Progress';
    if (rating >= 7) return 'Good Progress';
    if (rating >= 5) return 'Moderate Progress';
    if (rating >= 3) return 'Some Progress';
    return 'Minimal Progress';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-blue-600';
    if (rating >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <TrendingUp className="w-4 h-4 mr-2" />
          {existingProgress ? 'View/Edit Progress' : 'Track Session Progress'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Session Progress Tracker
            {existingProgress && (
              <Badge variant="secondary">Previously Recorded</Badge>
            )}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Track progress for {userRole === 'coach' ? clientName : 'your session'}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Link to Goal */}
          <div>
            <Label htmlFor="goal">Related Goal (Optional)</Label>
            <Select
              value={progressData.goal_id}
              onValueChange={(value) => setProgressData({ ...progressData, goal_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a goal this session relates to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific goal</SelectItem>
                {availableGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{goal.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress Rating */}
          <div>
            <Label>Overall Session Progress Rating</Label>
            <div className="mt-2 space-y-3">
              <Slider
                value={progressData.progress_rating}
                onValueChange={(value) => setProgressData({ ...progressData, progress_rating: value })}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">1 (Minimal)</span>
                <span className={`text-sm font-medium ${getRatingColor(progressData.progress_rating[0])}`}>
                  {progressData.progress_rating[0]}/10 - {getRatingText(progressData.progress_rating[0])}
                </span>
                <span className="text-sm text-gray-500">10 (Excellent)</span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div>
            <Label htmlFor="achievements" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Key Achievements & Breakthroughs
            </Label>
            <Textarea
              id="achievements"
              value={progressData.achievements}
              onChange={(e) => setProgressData({ ...progressData, achievements: e.target.value })}
              placeholder="What did the client accomplish or realize during this session?"
              rows={3}
            />
          </div>

          {/* Challenges */}
          <div>
            <Label htmlFor="challenges" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Challenges & Areas for Improvement
            </Label>
            <Textarea
              id="challenges"
              value={progressData.challenges}
              onChange={(e) => setProgressData({ ...progressData, challenges: e.target.value })}
              placeholder="What challenges came up? What areas need more work?"
              rows={3}
            />
          </div>

          {/* Next Session Focus */}
          {userRole === 'coach' && (
            <div>
              <Label htmlFor="next_focus" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Next Session Focus
              </Label>
              <Textarea
                id="next_focus"
                value={progressData.next_session_focus}
                onChange={(e) => setProgressData({ ...progressData, next_session_focus: e.target.value })}
                placeholder="What should be the focus for the next session?"
                rows={2}
              />
            </div>
          )}

          {/* Homework */}
          {userRole === 'coach' && (
            <div>
              <Label htmlFor="homework" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Homework & Action Items
              </Label>
              <Textarea
                id="homework"
                value={progressData.homework_assigned}
                onChange={(e) => setProgressData({ ...progressData, homework_assigned: e.target.value })}
                placeholder="What exercises, practices, or actions should the client work on?"
                rows={3}
              />
            </div>
          )}

          {/* Coach Notes */}
          {userRole === 'coach' && (
            <div>
              <Label htmlFor="coach_notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Private Coach Notes
              </Label>
              <Textarea
                id="coach_notes"
                value={progressData.coach_notes}
                onChange={(e) => setProgressData({ ...progressData, coach_notes: e.target.value })}
                placeholder="Private notes about the session, client's state, observations..."
                rows={3}
              />
            </div>
          )}

          {/* Client Reflection */}
          {userRole === 'client' && (
            <div>
              <Label htmlFor="client_reflection" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Your Reflection
              </Label>
              <Textarea
                id="client_reflection"
                value={progressData.client_reflection}
                onChange={(e) => setProgressData({ ...progressData, client_reflection: e.target.value })}
                placeholder="How do you feel about this session? What insights did you gain?"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProgress} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {existingProgress ? 'Update Progress' : 'Save Progress'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionProgressTracker;