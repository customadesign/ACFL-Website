'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  Send
} from 'lucide-react';
import { toast } from 'react-toastify';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
}

interface BookingRequestFormProps {
  coach: Coach;
  onRequestSent?: (bookingRequestId: string) => void;
  onCancel?: () => void;
}

const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  coach,
  onRequestSent,
  onCancel
}) => {
  const [sessionType, setSessionType] = useState<'individual' | 'group' | 'package'>('individual');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');
  const [areaOfFocus, setAreaOfFocus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingRequestId, setBookingRequestId] = useState<string | null>(null);

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // Generate next 14 days (excluding weekends for simplicity)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

    while (dates.length < 10) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coach_id: coach.id,
          session_type: sessionType,
          duration_minutes: durationMinutes,
          preferred_date: preferredDate || null,
          preferred_time: preferredTime || null,
          notes: notes.trim() || null,
          area_of_focus: areaOfFocus || null,
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBookingRequestId(data.booking_request_id);
        setSuccess(true);
        toast.success('Booking request sent successfully!');
        onRequestSent?.(data.booking_request_id);
      } else {
        throw new Error(data.error || 'Failed to send booking request');
      }
    } catch (error) {
      console.error('Error sending booking request:', error);
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const availableDates = generateAvailableDates();
  const timeSlots = generateTimeSlots();

  const getSessionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'package': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Request Sent!</h2>
          <p className="text-gray-600 mb-4">
            Your booking request has been sent to {coach.first_name} {coach.last_name}.
            They will review your request and respond with final pricing.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Coach will review your request within 24 hours</li>
              <li>• They'll set the final price based on your session requirements</li>
              <li>• You'll receive a notification when they respond</li>
              <li>• If accepted, you'll be prompted to complete payment</li>
              <li>• Your session will be confirmed after payment</li>
            </ul>
          </div>

          {bookingRequestId && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm">
              <p className="text-gray-600">
                <strong>Request ID:</strong> {bookingRequestId.slice(-8)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => window.location.href = '/clients/bookings'}
              className="flex-1"
            >
              View My Booking Requests
            </Button>
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Request Session with {coach.first_name} {coach.last_name}
        </CardTitle>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">How the new booking process works:</p>
          <ol className="text-sm text-blue-700 mt-2 space-y-1">
            <li>1. Send your booking request with session details</li>
            <li>2. Coach reviews and sets final pricing</li>
            <li>3. Complete payment when notified</li>
            <li>4. Session confirmed immediately after payment</li>
          </ol>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['individual', 'group', 'package'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSessionType(type)}
                  className={`p-3 border rounded-lg text-sm transition-colors ${
                    sessionType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <Badge className={`${getSessionTypeBadgeColor(type)} mb-1`}>
                    {type}
                  </Badge>
                  <div className="text-xs text-gray-600">
                    {type === 'individual' && 'One-on-one session'}
                    {type === 'group' && 'Small group session'}
                    {type === 'package' && 'Multiple sessions'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration *
            </label>
            <Select
              value={durationMinutes.toString()}
              onValueChange={(value) => setDurationMinutes(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes (Consultation)</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes (Standard)</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Date (Optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreferredDate('')}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  !preferredDate
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Flexible</div>
                <div className="text-xs">Coach will schedule</div>
              </button>
              {availableDates.map((date) => {
                const dateString = date.toISOString().split('T')[0];
                const isSelected = preferredDate === dateString;
                return (
                  <button
                    key={dateString}
                    type="button"
                    onClick={() => setPreferredDate(dateString)}
                    className={`p-3 text-sm border rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Time */}
          {preferredDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                {timeSlots.map((time) => {
                  const isSelected = preferredTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPreferredTime(time)}
                      className={`p-2 text-sm border rounded transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Area of Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area of Focus (Optional)
            </label>
            <Input
              type="text"
              value={areaOfFocus}
              onChange={(e) => setAreaOfFocus(e.target.value)}
              placeholder="e.g., Anxiety, Career development, Relationship issues..."
              maxLength={100}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics you'd like to discuss, questions you have, or other details the coach should know..."
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/500 characters
            </div>
          </div>

          {/* Coach Info */}
          {coach.bio && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">About {coach.first_name}</h3>
              <p className="text-sm text-gray-600">{coach.bio}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Booking Request
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            The coach will review your request and respond within 24 hours with final pricing.
            You'll only be charged after the coach accepts and you complete payment.
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingRequestForm;