'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Copy, Plus, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface CoachRate {
  id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  rate_cents: number;
  title: string;
  description?: string;
  is_active: boolean;
  max_sessions?: number;
  validity_days?: number;
  discount_percentage?: number;
  created_at: string;
  updated_at: string;
}

interface CoachRateManagerProps {
  coachId: string;
  isEditable?: boolean;
}

const CoachRateManager: React.FC<CoachRateManagerProps> = ({ 
  coachId, 
  isEditable = false 
}) => {
  const [rates, setRates] = useState<CoachRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    session_type: 'individual' as 'individual' | 'group' | 'package',
    duration_minutes: 60,
    rate_cents: 10000,
    title: '',
    description: '',
    max_sessions: '',
    validity_days: '',
    discount_percentage: '',
  });

  useEffect(() => {
    fetchRates();
  }, [coachId]);

  const fetchRates = async () => {
    try {
      const endpoint = isEditable 
        ? `/api/payments/coaches/${coachId}/rates`
        : `/api/payments/public/coaches/${coachId}/rates`;
        
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setRates(data);
      } else {
        toast.error('Failed to fetch coach rates');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch coach rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const payload = {
        ...formData,
        max_sessions: formData.max_sessions ? parseInt(formData.max_sessions) : undefined,
        validity_days: formData.validity_days ? parseInt(formData.validity_days) : undefined,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : undefined,
      };

      const url = editingId 
        ? `/api/payments/rates/${editingId}`
        : `/api/payments/coaches/${coachId}/rates`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingId ? 'Rate updated successfully' : 'Rate created successfully');
        resetForm();
        fetchRates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save rate');
      }
    } catch (error) {
      console.error('Error saving rate:', error);
      toast.error('Failed to save rate');
    }
  };

  const handleEdit = (rate: CoachRate) => {
    setEditingId(rate.id);
    setFormData({
      session_type: rate.session_type,
      duration_minutes: rate.duration_minutes,
      rate_cents: rate.rate_cents,
      title: rate.title,
      description: rate.description || '',
      max_sessions: rate.max_sessions?.toString() || '',
      validity_days: rate.validity_days?.toString() || '',
      discount_percentage: rate.discount_percentage?.toString() || '',
    });
    setShowAddForm(true);
  };

  const handleDuplicate = async (rateId: string) => {
    try {
      const response = await fetch(`/api/payments/rates/${rateId}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Rate duplicated successfully');
        fetchRates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to duplicate rate');
      }
    } catch (error) {
      console.error('Error duplicating rate:', error);
      toast.error('Failed to duplicate rate');
    }
  };

  const handleDeactivate = async (rateId: string) => {
    if (!confirm('Are you sure you want to deactivate this rate?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payments/rates/${rateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Rate deactivated successfully');
        fetchRates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deactivate rate');
      }
    } catch (error) {
      console.error('Error deactivating rate:', error);
      toast.error('Failed to deactivate rate');
    }
  };

  const resetForm = () => {
    setFormData({
      session_type: 'individual',
      duration_minutes: 60,
      rate_cents: 10000,
      title: '',
      description: '',
      max_sessions: '',
      validity_days: '',
      discount_percentage: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getSessionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'package': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          {isEditable ? 'Manage Rates' : 'Session Rates'}
        </h2>
        {isEditable && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Rate
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && isEditable && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Rate' : 'Add New Rate'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session_type">Session Type</Label>
                  <Select 
                    value={formData.session_type} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, session_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="package">Package</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration_minutes: parseInt(e.target.value) || 0 
                    }))}
                    min="15"
                    max="240"
                    step="15"
                  />
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rate_cents">Rate ($)</Label>
                  <Input
                    id="rate_cents"
                    type="number"
                    value={formData.rate_cents / 100}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      rate_cents: Math.round(parseFloat(e.target.value || '0') * 100) 
                    }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {formData.session_type === 'package' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="max_sessions">Number of Sessions</Label>
                    <Input
                      id="max_sessions"
                      type="number"
                      value={formData.max_sessions}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_sessions: e.target.value }))}
                      min="2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="validity_days">Validity (days)</Label>
                    <Input
                      id="validity_days"
                      type="number"
                      value={formData.validity_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, validity_days: e.target.value }))}
                      min="30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount_percentage">Discount (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                      min="0"
                      max="50"
                      step="0.1"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rates List */}
      <div className="grid gap-4">
        {rates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No rates available</p>
            </CardContent>
          </Card>
        ) : (
          rates.map((rate) => (
            <Card key={rate.id} className={!rate.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{rate.title}</h3>
                      <Badge className={getSessionTypeBadgeColor(rate.session_type)}>
                        {rate.session_type}
                      </Badge>
                      {!rate.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {formatPrice(rate.rate_cents)}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Duration:</strong> {rate.duration_minutes} minutes</p>
                      {rate.session_type === 'package' && rate.max_sessions && (
                        <p><strong>Sessions:</strong> {rate.max_sessions}</p>
                      )}
                      {rate.validity_days && (
                        <p><strong>Valid for:</strong> {rate.validity_days} days</p>
                      )}
                      {rate.discount_percentage && (
                        <p><strong>Discount:</strong> {rate.discount_percentage}%</p>
                      )}
                    </div>
                    
                    {rate.description && (
                      <p className="text-gray-600 mt-2">{rate.description}</p>
                    )}
                  </div>

                  {isEditable && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rate)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(rate.id)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Duplicate
                      </Button>
                      {rate.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(rate.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                          Deactivate
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CoachRateManager;