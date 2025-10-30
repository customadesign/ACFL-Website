'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
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
  metadata?: {
    payment_count?: number;
    rejection_reason?: string;
  };
}

interface PendingEarnings {
  totalEarnings: number;
  paymentCount: number;
}

interface CoachPayoutRequestProps {
  coachId: string;
}

export default function CoachPayoutRequest({ coachId }: CoachPayoutRequestProps) {
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarnings>({ totalEarnings: 0, paymentCount: 0 });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const token = localStorage.getItem('token');

      // Fetch pending earnings
      const earningsResponse = await fetch(`${API_URL}/api/billing/payouts/pending-earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setPendingEarnings(earningsData);
      }

      // Fetch payout requests
      const payoutsResponse = await fetch(`${API_URL}/api/billing/payouts/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (payoutsResponse.ok) {
        const payoutsData = await payoutsResponse.json();
        setPayoutRequests(payoutsData);
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

    if (pendingEarnings.totalEarnings <= 0) {
      setError('No earnings available for payout');
      return;
    }

    // Validate custom amount if enabled
    let amountCents: number | undefined = undefined;
    if (useCustomAmount) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount greater than zero');
        return;
      }
      amountCents = Math.round(amount * 100);

      if (amountCents > pendingEarnings.totalEarnings) {
        setError(`Amount cannot exceed available earnings: ${formatCurrency(pendingEarnings.totalEarnings)}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const API_URL = getApiUrl();
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/billing/payouts/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: notes || undefined,
          amount_cents: amountCents
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit payout request');
      }

      const payoutData = await response.json();
      setSuccess(`Payout request submitted successfully! Amount: ${formatCurrency(payoutData.amount_cents)}`);

      // Reset form
      setNotes('');
      setCustomAmount('');
      setUseCustomAmount(false);

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
      case 'rejected':
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
      case 'rejected':
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
            Pending Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(pendingEarnings.totalEarnings)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            From {pendingEarnings.paymentCount} completed payment{pendingEarnings.paymentCount !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
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
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {useCustomAmount ? 'You will request a custom payout amount:' : 'You will request a payout for your full pending balance:'}
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {useCustomAmount && customAmount ? formatCurrency(Math.round(parseFloat(customAmount) * 100)) : formatCurrency(pendingEarnings.totalEarnings)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {useCustomAmount ? `From available balance: ${formatCurrency(pendingEarnings.totalEarnings)}` : `${pendingEarnings.paymentCount} payment${pendingEarnings.paymentCount !== 1 ? 's' : ''} will be included`}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useCustomAmount"
                  checked={useCustomAmount}
                  onChange={(e) => {
                    setUseCustomAmount(e.target.checked);
                    if (!e.target.checked) {
                      setCustomAmount('');
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="useCustomAmount" className="font-normal cursor-pointer">
                  Request a custom amount (partial payout)
                </Label>
              </div>

              {useCustomAmount && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="customAmount">Amount (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="customAmount"
                      step="0.01"
                      min="0.01"
                      max={(pendingEarnings.totalEarnings / 100).toFixed(2)}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={useCustomAmount}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Maximum: {formatCurrency(pendingEarnings.totalEarnings)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payout request..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || pendingEarnings.totalEarnings <= 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 text-base"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Payout Request'
              )}
            </Button>

            {pendingEarnings.totalEarnings <= 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No earnings available. Complete sessions to earn money.
              </p>
            )}
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
                          Bank Transfer
                        </span>
                        <Badge variant={getStatusBadgeVariant(payout.status)}>
                          {payout.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                      {payout.metadata?.payment_count && (
                        <p className="text-sm text-muted-foreground">
                          {payout.metadata.payment_count} payment{payout.metadata.payment_count !== 1 ? 's' : ''}
                        </p>
                      )}
                      {payout.status === 'rejected' && payout.metadata?.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {payout.metadata.rejection_reason}
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
