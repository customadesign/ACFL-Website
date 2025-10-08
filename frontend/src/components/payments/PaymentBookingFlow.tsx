'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, CreditCard } from 'lucide-react';
import StripeProvider from './StripeProvider';
import PaymentForm from './PaymentForm';
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
}

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
}

interface PaymentBookingFlowProps {
  coachId: string;
  selectedDate?: string;
  selectedTime?: string;
  onBookingComplete?: (bookingId: string) => void;
}

const PaymentBookingFlow: React.FC<PaymentBookingFlowProps> = ({
  coachId,
  selectedDate,
  selectedTime,
  onBookingComplete
}) => {
  const [step, setStep] = useState<'select_rate' | 'payment' | 'success'>('select_rate');
  const [coach, setCoach] = useState<Coach | null>(null);
  const [rates, setRates] = useState<CoachRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CoachRate | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCoachAndRates();
  }, [coachId]);

  const fetchCoachAndRates = async () => {
    try {
      setIsLoading(true);
      
      // Fetch coach info and rates in parallel
      const [coachResponse, ratesResponse] = await Promise.all([
        fetch(`/api/coaches/${coachId}`),
        fetch(`/api/payments/public/coaches/${coachId}/rates`)
      ]);

      if (coachResponse.ok) {
        const coachData = await coachResponse.json();
        setCoach(coachData);
      }

      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();
        setRates(ratesData.filter((rate: CoachRate) => rate.is_active));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load booking information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelect = async (rate: CoachRate) => {
    try {
      setSelectedRate(rate);
      setIsLoading(true);

      // Create payment authorization (not immediate capture)
      const response = await fetch('/api/payments/v2/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: coachId,
          coach_rate_id: rate.id,
          session_date: selectedDate,
          session_time: selectedTime,
          description: `${rate.title} with ${coach?.first_name} ${coach?.last_name}`,
          metadata: {
            selected_date: selectedDate,
            selected_time: selectedTime,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.client_secret);
        setPaymentIntentId(data.payment_intent_id);
        setStep('payment');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to create payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      if (paymentIntentId) {
        // Note: Payment is authorized but not captured yet
        // In the authorization/capture flow, payment will be captured after session completion
        setStep('success');
        onBookingComplete?.(paymentIntentId);
        
        toast.success('Payment authorized! Your session is booked.');
        toast.info('Payment will be processed after your session is completed.');
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      toast.error('Payment processing failed');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setStep('select_rate');
    setSelectedRate(null);
    setClientSecret(null);
    setPaymentIntentId(null);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Session Booked!</h2>
          <p className="text-gray-600 mb-4">
            Your session with {coach?.first_name} {coach?.last_name} has been reserved.
            Payment is authorized and will be processed after your session is completed.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 text-left">
              <li>• Your payment method is authorized but not charged yet</li>
              <li>• You will be charged automatically after session completion</li>
              <li>• If you need to cancel, contact your coach or support</li>
              <li>• You'll receive email confirmations for all updates</li>
            </ul>
          </div>
          <Button onClick={() => window.location.href = '/clients/appointments'}>
            View Appointments
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'payment' && selectedRate && clientSecret) {
    return (
      <StripeProvider clientSecret={clientSecret}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setStep('select_rate')}
              className="mb-4"
            >
              ← Back to Rate Selection
            </Button>
            
            {/* Session Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{coach?.first_name} {coach?.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{selectedRate.duration_minutes} minutes</span>
                  </div>
                  {selectedDate && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <span>{selectedDate} at {selectedTime}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-green-600">
                      {formatPrice(selectedRate.rate_cents)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <PaymentForm
            amount={selectedRate.rate_cents}
            coachName={`${coach?.first_name} ${coach?.last_name}`}
            sessionTitle={selectedRate.title}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </StripeProvider>
    );
  }

  // Rate Selection Step
  return (
    <div className="max-w-4xl mx-auto">
      {coach && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Book a Session</CardTitle>
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {coach.first_name} {coach.last_name}
                </h3>
                {selectedDate && selectedTime && (
                  <p className="text-gray-600">
                    {selectedDate} at {selectedTime}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          {coach.bio && (
            <CardContent>
              <p className="text-gray-600">{coach.bio}</p>
            </CardContent>
          )}
        </Card>
      )}

      <h2 className="text-xl font-semibold mb-4">Select Session Type</h2>
      
      {rates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No session rates available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rates.map((rate) => (
            <Card 
              key={rate.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRateSelect(rate)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">{rate.title}</h3>
                  <Badge className={getSessionTypeBadgeColor(rate.session_type)}>
                    {rate.session_type}
                  </Badge>
                </div>
                
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {formatPrice(rate.rate_cents)}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p><strong>Duration:</strong> {rate.duration_minutes} minutes</p>
                  {rate.session_type === 'package' && rate.max_sessions && (
                    <p><strong>Sessions:</strong> {rate.max_sessions}</p>
                  )}
                  {rate.validity_days && (
                    <p><strong>Valid for:</strong> {rate.validity_days} days</p>
                  )}
                  {rate.discount_percentage && (
                    <p className="text-green-600">
                      <strong>Save {rate.discount_percentage}%</strong>
                    </p>
                  )}
                </div>
                
                {rate.description && (
                  <p className="text-gray-600 text-sm mb-4">{rate.description}</p>
                )}
                
                <Button className="w-full" onClick={() => handleRateSelect(rate)}>
                  Select This Rate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentBookingFlow;