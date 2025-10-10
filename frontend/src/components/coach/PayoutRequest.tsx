'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import {
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface PayoutRequest {
  id: string;
  coach_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  payout_method: string;
  payout_date?: string;
  fees_cents: number;
  net_amount_cents: number;
  failure_reason?: string;
  created_at: string;
}

interface UserCredit {
  id: string;
  user_id: string;
  user_type: string;
  balance_cents: number;
  currency: string;
  updated_at: string;
}

interface CoachPayoutRequestProps {
  coachId: string;
}

export default function CoachPayoutRequest({ coachId }: CoachPayoutRequestProps) {
  const [availableBalance, setAvailableBalance] = useState<UserCredit | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [requestAmount, setRequestAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('');
  const [notes, setNotes] = useState('');

  const payoutMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'square_payout', label: 'Square Payout' },
    { value: 'manual', label: 'Manual Processing' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = getApiUrl();

      // Fetch available balance
      const balanceResponse = await fetch(`${API_URL}/api/billing/credits/${coachId}/coach`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setAvailableBalance(balanceData);
      }

      // Fetch recent payout requests
      const payoutsResponse = await fetch(`${API_URL}/api/billing/payouts?status=pending,processing,completed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (payoutsResponse.ok) {
        const payoutsData = await payoutsResponse.json();
        // Filter for current coach's payouts
        const coachPayouts = payoutsData.filter((p: PayoutRequest) => p.coach_id === coachId);
        setPayoutRequests(coachPayouts);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [coachId]);

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payoutMethod) {
      setError('Please select a payout method');
      return;
    }

    const amountCents = requestAmount ? Math.round(parseFloat(requestAmount) * 100) : undefined;

    if (amountCents && availableBalance && amountCents > availableBalance.balance_cents) {
      setError('Requested amount exceeds available balance');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/billing/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coach_id: coachId,
          amount_cents: amountCents,
          payout_method: payoutMethod,
          notes: notes || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit payout request');
      }

      const payout = await response.json();
      setSuccess('Payout request submitted successfully!');

      // Reset form
      setRequestAmount('');
      setPayoutMethod('');
      setNotes('');

      // Refresh data
      await fetchData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payout request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(availableBalance?.balance_cents || 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Available for withdrawal
          </p>
        </CardContent>
      </Card>

      {/* Payout Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmitPayout} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={availableBalance ? (availableBalance.balance_cents / 100) : undefined}
                  placeholder="Enter amount or leave blank for full balance"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to request full available balance
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    {payoutMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes for the payout request..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !payoutMethod || (availableBalance?.balance_cents || 0) <= 0}
              className="w-full"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Payout Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payout requests found
            </div>
          ) : (
            <div className="space-y-4">
              {payoutRequests.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(payout.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {payout.payout_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge variant={getStatusBadgeVariant(payout.status)}>
                          {payout.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                      {payout.payout_date && (
                        <p className="text-sm text-muted-foreground">
                          Processed: {new Date(payout.payout_date).toLocaleDateString()}
                        </p>
                      )}
                      {payout.failure_reason && (
                        <p className="text-sm text-red-600">
                          Reason: {payout.failure_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(payout.amount_cents)}
                    </p>
                    {payout.fees_cents > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Fee: {formatCurrency(payout.fees_cents)}
                      </p>
                    )}
                    <p className="text-sm font-medium text-green-600">
                      Net: {formatCurrency(payout.net_amount_cents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}