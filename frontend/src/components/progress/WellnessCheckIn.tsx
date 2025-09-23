'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Heart,
  Activity,
  Brain,
  Moon,
  Utensils,
  Users,
  Smile,
  TrendingUp,
  Calendar,
  Save
} from 'lucide-react';
import { toast } from 'react-toastify';

interface WellnessData {
  mood_rating: number;
  energy_level: number;
  stress_level: number;
  sleep_quality: number;
  exercise_frequency: number;
  nutrition_quality: number;
  social_connection: number;
  overall_wellbeing: number;
  notes: string;
}

interface WellnessCheckIn extends WellnessData {
  id: string;
  client_id: string;
  session_id?: string;
  checkin_date: string;
  created_at: string;
}

interface WellnessCheckInProps {
  clientId: string;
  sessionId?: string;
  userRole: 'coach' | 'client';
  trigger?: React.ReactNode;
  onCheckInSaved?: () => void;
}

const WellnessCheckInComponent: React.FC<WellnessCheckInProps> = ({
  clientId,
  sessionId,
  userRole,
  trigger,
  onCheckInSaved
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<WellnessCheckIn[]>([]);
  const [wellnessData, setWellnessData] = useState<WellnessData>({
    mood_rating: 7,
    energy_level: 7,
    stress_level: 5,
    sleep_quality: 7,
    exercise_frequency: 3,
    nutrition_quality: 7,
    social_connection: 7,
    overall_wellbeing: 7,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchRecentCheckIns();
    }
  }, [isOpen, clientId]);

  const fetchRecentCheckIns = async () => {
    try {
      const response = await fetch(`/api/progress/wellness?client_id=${clientId}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentCheckIns(data.checkIns || []);
      } else if (response.status === 501) {
        // Mock data for demo
        const mockCheckIns: WellnessCheckIn[] = [
          {
            id: 'checkin-1',
            client_id: clientId,
            mood_rating: 8,
            energy_level: 7,
            stress_level: 4,
            sleep_quality: 8,
            exercise_frequency: 4,
            nutrition_quality: 7,
            social_connection: 8,
            overall_wellbeing: 8,
            notes: 'Feeling much better this week!',
            checkin_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_at: new Date().toISOString()
          }
        ];
        setRecentCheckIns(mockCheckIns);
      }
    } catch (error) {
      console.error('Error fetching wellness check-ins:', error);
    }
  };

  const saveCheckIn = async () => {
    try {
      setIsLoading(true);

      const payload = {
        client_id: clientId,
        session_id: sessionId || null,
        ...wellnessData,
        checkin_date: new Date().toISOString().split('T')[0]
      };

      const response = await fetch('/api/progress/wellness', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Wellness check-in saved successfully');
        onCheckInSaved?.();
        setIsOpen(false);
        fetchRecentCheckIns();
      } else if (response.status === 501) {
        // Mock success for demo
        toast.success('Wellness check-in saved successfully (Demo mode)');
        onCheckInSaved?.();
        setIsOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save wellness check-in');
      }
    } catch (error) {
      console.error('Error saving wellness check-in:', error);
      toast.error('Failed to save wellness check-in');
    } finally {
      setIsLoading(false);
    }
  };

  const getWellnessLevel = (score: number, reverse: boolean = false) => {
    const actualScore = reverse ? 11 - score : score;
    if (actualScore >= 8) return { text: 'Excellent', color: 'text-green-600' };
    if (actualScore >= 6) return { text: 'Good', color: 'text-blue-600' };
    if (actualScore >= 4) return { text: 'Moderate', color: 'text-yellow-600' };
    return { text: 'Needs Attention', color: 'text-red-600' };
  };

  const wellnessMetrics = [
    {
      key: 'mood_rating',
      label: 'Mood',
      icon: Smile,
      description: 'How would you rate your overall mood today?',
      min: 1,
      max: 10,
      lowLabel: 'Very Low',
      highLabel: 'Very High'
    },
    {
      key: 'energy_level',
      label: 'Energy Level',
      icon: Activity,
      description: 'How energetic do you feel?',
      min: 1,
      max: 10,
      lowLabel: 'Exhausted',
      highLabel: 'Very Energetic'
    },
    {
      key: 'stress_level',
      label: 'Stress Level',
      icon: Brain,
      description: 'How stressed do you feel?',
      min: 1,
      max: 10,
      lowLabel: 'Very Calm',
      highLabel: 'Very Stressed',
      reverse: true
    },
    {
      key: 'sleep_quality',
      label: 'Sleep Quality',
      icon: Moon,
      description: 'How well did you sleep last night?',
      min: 1,
      max: 10,
      lowLabel: 'Very Poor',
      highLabel: 'Excellent'
    },
    {
      key: 'exercise_frequency',
      label: 'Exercise',
      icon: Activity,
      description: 'How many days did you exercise this week?',
      min: 0,
      max: 7,
      lowLabel: '0 days',
      highLabel: '7 days',
      unit: 'days'
    },
    {
      key: 'nutrition_quality',
      label: 'Nutrition',
      icon: Utensils,
      description: 'How would you rate your eating habits?',
      min: 1,
      max: 10,
      lowLabel: 'Very Poor',
      highLabel: 'Excellent'
    },
    {
      key: 'social_connection',
      label: 'Social Connection',
      icon: Users,
      description: 'How connected do you feel to others?',
      min: 1,
      max: 10,
      lowLabel: 'Very Isolated',
      highLabel: 'Very Connected'
    },
    {
      key: 'overall_wellbeing',
      label: 'Overall Wellbeing',
      icon: Heart,
      description: 'How would you rate your overall wellbeing?',
      min: 1,
      max: 10,
      lowLabel: 'Very Poor',
      highLabel: 'Excellent'
    }
  ];

  const defaultTrigger = (
    <Button variant="outline">
      <Heart className="w-4 h-4 mr-2" />
      Wellness Check-In
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Wellness Check-In
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Track your daily wellness across multiple dimensions
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recent Check-ins Summary */}
          {recentCheckIns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Check-In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(recentCheckIns[0].checkin_date).toLocaleDateString()}</span>
                  <Badge className={getWellnessLevel(recentCheckIns[0].overall_wellbeing).color}>
                    Overall: {getWellnessLevel(recentCheckIns[0].overall_wellbeing).text}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wellness Metrics */}
          <div className="grid gap-6">
            {wellnessMetrics.map((metric) => {
              const Icon = metric.icon;
              const value = wellnessData[metric.key as keyof WellnessData] as number;
              const level = getWellnessLevel(value, metric.reverse);

              return (
                <div key={metric.key} className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4" />
                    {metric.label}
                  </Label>
                  <p className="text-xs text-gray-600">{metric.description}</p>

                  <Slider
                    value={[value]}
                    onValueChange={(newValue) =>
                      setWellnessData({
                        ...wellnessData,
                        [metric.key]: newValue[0]
                      })
                    }
                    max={metric.max}
                    min={metric.min}
                    step={1}
                    className="w-full"
                  />

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{metric.lowLabel}</span>
                    <span className={`text-sm font-medium ${level.color}`}>
                      {value}{metric.unit && ` ${metric.unit}`} - {level.text}
                    </span>
                    <span className="text-xs text-gray-500">{metric.highLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={wellnessData.notes}
              onChange={(e) => setWellnessData({ ...wellnessData, notes: e.target.value })}
              placeholder="Any additional thoughts about your wellness today?"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCheckIn} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Check-In
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WellnessCheckInComponent;