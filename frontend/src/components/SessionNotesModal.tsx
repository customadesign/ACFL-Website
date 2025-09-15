'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Save, Edit, Clock, FileText, Target, ArrowRight } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { apiGet, apiPost } from '@/lib/api-client';

interface SessionNote {
  id?: string;
  appointment_id: string;
  notes?: string;
  goals_met?: string[];
  next_steps?: string;
  created_at?: string;
  updated_at?: string;
}

interface SessionNotesModalProps {
  appointmentId: string;
  clientName: string;
  sessionDate: string;
  isOpen: boolean;
  onClose: () => void;
  readonly?: boolean;
}

export default function SessionNotesModal({
  appointmentId,
  clientName,
  sessionDate,
  isOpen,
  onClose,
  readonly = false
}: SessionNotesModalProps) {
  const [notes, setNotes] = useState<SessionNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    notes: '',
    goals_met: [] as string[],
    next_steps: ''
  });
  
  const [newGoal, setNewGoal] = useState('');
  
  const API_URL = getApiUrl();

  useEffect(() => {
    if (isOpen && appointmentId) {
      loadSessionNotes();
    }
  }, [isOpen, appointmentId]);

  const loadSessionNotes = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`${API_URL}/api/coach/session-notes/${appointmentId}`);
      
      if (response.data.success && response.data.data.length > 0) {
        const latestNote = response.data.data[0];
        setNotes(latestNote);
        setFormData({
          notes: latestNote.notes || '',
          goals_met: latestNote.goals_met || [],
          next_steps: latestNote.next_steps || ''
        });
      } else {
        // No notes exist yet
        setNotes(null);
        setFormData({
          notes: '',
          goals_met: [],
          next_steps: ''
        });
        if (!readonly) {
          setIsEditing(true); // Start in edit mode for new notes
        }
      }
    } catch (error) {
      console.error('Error loading session notes:', error);
      setError('Failed to load session notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await apiPost(`${API_URL}/api/coach/session-notes`, {
        appointment_id: appointmentId,
        ...formData
      });
      
      if (response.data.success) {
        setNotes(response.data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving session notes:', error);
      setError('Failed to save session notes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setFormData({
        ...formData,
        goals_met: [...formData.goals_met, newGoal.trim()]
      });
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setFormData({
      ...formData,
      goals_met: formData.goals_met.filter((_, i) => i !== index)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              Session Notes
            </CardTitle>
            <CardDescription>
              {clientName} - {new Date(sessionDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!readonly && !isEditing && notes && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading notes...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Session Notes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Session Notes
                </h3>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter session notes..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    rows={6}
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {notes?.notes || 'No notes recorded for this session.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Goals Met */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Goals Met
                </h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                        placeholder="Add a goal that was met..."
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      />
                      <Button
                        onClick={handleAddGoal}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.goals_met.map((goal, index) => (
                        <div key={index} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                          <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{goal}</span>
                          <button
                            onClick={() => handleRemoveGoal(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notes?.goals_met && notes.goals_met.length > 0 ? (
                      notes.goals_met.map((goal, index) => (
                        <div key={index} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                          <span className="text-sm text-gray-900 dark:text-gray-100">{goal}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No goals recorded.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Next Steps
                </h3>
                {isEditing ? (
                  <textarea
                    value={formData.next_steps}
                    onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                    placeholder="Enter next steps for the client..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    rows={3}
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {notes?.next_steps || 'No next steps recorded.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Last Updated */}
              {notes?.updated_at && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Last updated: {new Date(notes.updated_at).toLocaleString()}
                </div>
              )}

              {/* Actions */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data to original notes
                      if (notes) {
                        setFormData({
                          notes: notes.notes || '',
                          goals_met: notes.goals_met || [],
                          next_steps: notes.next_steps || ''
                        });
                      }
                    }}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}