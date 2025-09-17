'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CalendarDays,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-toastify';

interface BookingRequest {
  id: string;
  client_id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  area_of_focus?: string;
  status: 'pending' | 'coach_accepted' | 'payment_required' | 'paid_confirmed' | 'rejected' | 'cancelled';
  created_at: string;
  expires_at?: string;
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CoachRate {
  id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  rate_cents: number;
  title: string;
  description?: string;
  is_active: boolean;
}

const BookingRequestManager: React.FC = () => {
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [coachRates, setCoachRates] = useState<CoachRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Form state for accepting booking
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');

  useEffect(() => {
    fetchBookingRequests();
    fetchCoachRates();
  }, []);

  const fetchBookingRequests = async () => {
    try {
      const response = await fetch('/api/bookings/coach/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookingRequests(data);
      } else {
        throw new Error('Failed to fetch booking requests');
      }
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast.error('Failed to load booking requests');
    }
  };

  const fetchCoachRates = async () => {
    try {
      // Get current user ID - you might need to adjust this based on your auth setup
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const coachId = user?.id;

      if (!coachId) {
        throw new Error('Coach ID not found');
      }

      const response = await fetch(`/api/payments/coaches/${coachId}/rates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoachRates(data.filter((rate: CoachRate) => rate.is_active));
      }
    } catch (error) {
      console.error('Error fetching coach rates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAccept = (request: BookingRequest) => {
    setAcceptingRequest(request.id);

    // Find matching rate based on session type and duration
    const matchingRate = coachRates.find(rate =>
      rate.session_type === request.session_type &&
      rate.duration_minutes === request.duration_minutes
    );

    if (matchingRate) {
      setSelectedRateId(matchingRate.id);
      setFinalPrice(matchingRate.rate_cents / 100); // Convert cents to dollars for display
    } else {
      // Default pricing based on session type
      const defaultPrice = request.session_type === 'individual' ? 150 :
                          request.session_type === 'group' ? 75 : 200;
      setFinalPrice(defaultPrice);
    }

    setCoachNotes('');
  };

  const handleCancelAccept = () => {
    setAcceptingRequest(null);
    setFinalPrice(0);
    setSelectedRateId('');
    setCoachNotes('');
  };

  const handleAcceptBooking = async (requestId: string) => {
    if (!finalPrice || finalPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setProcessingRequest(requestId);

      const response = await fetch(`/api/bookings/coach/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          final_price_cents: Math.round(finalPrice * 100), // Convert to cents
          coach_rate_id: selectedRateId || null,
          coach_notes: coachNotes.trim() || null,
          confirm_schedule: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Booking request accepted! Client will be notified to complete payment.');

        // Remove the accepted request from the list
        setBookingRequests(prev => prev.filter(req => req.id !== requestId));
        handleCancelAccept();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept booking request');
      }
    } catch (error) {
      console.error('Error accepting booking request:', error);
      toast.error((error as Error).message);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectBooking = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejecting this booking request (optional):');

    try {
      setProcessingRequest(requestId);

      const response = await fetch(`/api/bookings/coach/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: reason?.trim() || null
        })
      });

      if (response.ok) {
        toast.success('Booking request rejected. Client will be notified.');

        // Remove the rejected request from the list
        setBookingRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject booking request');
      }
    } catch (error) {
      console.error('Error rejecting booking request:', error);
      toast.error((error as Error).message);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRateSelect = (rateId: string) => {
    const rate = coachRates.find(r => r.id === rateId);
    if (rate) {
      setSelectedRateId(rateId);
      setFinalPrice(rate.rate_cents / 100);
    }
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'To be scheduled';

    try {
      const dateObj = new Date(`${date}T${time}:00`);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return `${date} at ${time}`;
    }
  };

  const getSessionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'package': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'coach_accepted': return 'bg-green-100 text-green-800';
      case 'payment_required': return 'bg-blue-100 text-blue-800';
      case 'paid_confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Booking Requests</h1>
        <Button
          onClick={() => {
            fetchBookingRequests();
            fetchCoachRates();
          }}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {bookingRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Booking Requests</h3>
            <p className="text-gray-500">
              You'll see new booking requests from clients here. They'll be waiting for your approval and pricing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookingRequests.map((request) => (
            <Card key={request.id} className={`${isExpired(request.expires_at) ? 'opacity-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {request.clients?.first_name} {request.clients?.last_name}
                      {isExpired(request.expires_at) && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>{request.clients?.email}</span>
                      <Badge className={getSessionTypeBadgeColor(request.session_type)}>
                        {request.session_type}
                      </Badge>
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{request.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span>{formatDateTime(request.preferred_date, request.preferred_time)}</span>
                  </div>
                </div>

                {request.area_of_focus && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Area of Focus:</p>
                    <p className="text-sm text-gray-600">{request.area_of_focus}</p>
                  </div>
                )}

                {request.notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Client Notes:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.notes}</p>
                  </div>
                )}

                {acceptingRequest === request.id ? (
                  // Accept form
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-green-800">Set Final Price & Accept Booking</h4>

                    {/* Rate Selection */}
                    {coachRates.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Use Existing Rate (Optional)
                        </label>
                        <Select value={selectedRateId} onValueChange={handleRateSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a rate or set custom price" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Custom Price</SelectItem>
                            {coachRates
                              .filter(rate =>
                                rate.session_type === request.session_type ||
                                rate.session_type === 'individual'
                              )
                              .map((rate) => (
                                <SelectItem key={rate.id} value={rate.id}>
                                  {rate.title} - ${(rate.rate_cents / 100).toFixed(2)} ({rate.duration_minutes}min)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Final Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Price (USD) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={finalPrice}
                          onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                          className="pl-10"
                          placeholder="150.00"
                        />
                      </div>
                    </div>

                    {/* Coach Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes for Client (Optional)
                      </label>
                      <Textarea
                        value={coachNotes}
                        onChange={(e) => setCoachNotes(e.target.value)}
                        placeholder="Any additional notes or instructions for the client..."
                        rows={3}
                        maxLength={500}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptBooking(request.id)}
                        disabled={processingRequest === request.id || finalPrice <= 0}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {processingRequest === request.id ? 'Processing...' : 'Accept & Send Payment Request'}
                      </Button>
                      <Button
                        onClick={handleCancelAccept}
                        variant="outline"
                        disabled={processingRequest === request.id}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Action buttons
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartAccept(request)}
                      disabled={isExpired(request.expires_at) || processingRequest === request.id}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept with Pricing
                    </Button>
                    <Button
                      onClick={() => handleRejectBooking(request.id)}
                      variant="outline"
                      disabled={isExpired(request.expires_at) || processingRequest === request.id}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Request Metadata */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Requested: {new Date(request.created_at).toLocaleDateString()}</span>
                    {request.expires_at && (
                      <span>Expires: {new Date(request.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingRequestManager;