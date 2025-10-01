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
import { getApiUrl } from '@/lib/api';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  Search
} from 'lucide-react';

interface Payment {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  description?: string;
  created_at: string;
  paid_at?: string;
}

interface RefundRequest {
  id: string;
  payment_id: string;
  amount_cents: number;
  reason: string;
  description?: string;
  status: string;
  refund_method: string;
  created_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

interface ClientRefundRequestProps {
  clientId: string;
}

export default function ClientRefundRequest({ clientId }: ClientRefundRequestProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const refundReasons = [
    { value: 'requested_by_customer', label: 'Customer Request' },
    { value: 'session_cancelled', label: 'Session Cancelled' },
    { value: 'unsatisfactory_service', label: 'Unsatisfactory Service' },
    { value: 'duplicate', label: 'Duplicate Payment' },
    { value: 'auto_cancellation', label: 'Auto Cancellation' }
  ];

  const refundMethods = [
    { value: 'original_payment', label: 'Original Payment Method' },
    { value: 'manual', label: 'Manual Processing' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = getApiUrl();

      // Fetch client's payments
      const paymentsResponse = await fetch(`${API_URL}/api/billing/transactions/${clientId}/client?transaction_types=payment&status=completed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        // Convert billing transactions to payment format for refund purposes
        const formattedPayments = paymentsData.map((transaction: any) => ({
          id: transaction.reference_id || transaction.id,
          amount_cents: transaction.amount_cents,
          currency: transaction.currency,
          status: transaction.status,
          description: transaction.description,
          created_at: transaction.created_at,
          paid_at: transaction.created_at
        }));
        setPayments(formattedPayments);
      }

      // Fetch client's refund requests
      const refundsResponse = await fetch(`${API_URL}/api/billing/refunds`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (refundsResponse.ok) {
        const refundsData = await refundsResponse.json();
        // Filter for current client's refunds
        const clientRefunds = refundsData.filter((r: RefundRequest) =>
          payments.some(p => p.id === r.payment_id)
        );
        setRefundRequests(clientRefunds);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment || !refundReason) {
      setError('Please select a payment and reason for refund');
      return;
    }

    const payment = payments.find(p => p.id === selectedPayment);
    if (!payment) {
      setError('Selected payment not found');
      return;
    }

    const amountCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : payment.amount_cents;

    if (amountCents > payment.amount_cents) {
      setError('Refund amount cannot exceed payment amount');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/billing/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          payment_id: selectedPayment,
          amount_cents: amountCents,
          reason: refundReason,
          description: description || undefined,
          refund_method: refundMethod,
          requestedBy: clientId,
          requestedByType: 'client'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit refund request');
      }

      const refund = await response.json();
      setSuccess('Refund request submitted successfully! We will review your request and get back to you.');

      // Reset form
      setSelectedPayment('');
      setRefundAmount('');
      setRefundReason('');
      setRefundMethod('original_payment');
      setDescription('');
      setShowForm(false);

      // Refresh data
      await fetchData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit refund request');
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
      case 'approved':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin dark:text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Refund Requests</h2>
          <p className="text-muted-foreground">Request refunds for your payments</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Request Refund
        </Button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Refund Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Refund Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-search">Search Payments</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="payment-search"
                    placeholder="Search by payment description or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">Select Payment</Label>
                <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment to refund" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPayments.map((payment) => (
                      <SelectItem key={payment.id} value={payment.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{payment.description || `Payment ${payment.id.slice(-8)}`}</span>
                          <span className="ml-2 font-medium">{formatCurrency(payment.amount_cents)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Refund Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave blank for full amount"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                  {selectedPayment && (
                    <p className="text-xs text-muted-foreground">
                      Maximum: {formatCurrency(payments.find(p => p.id === selectedPayment)?.amount_cents || 0)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Refund</Label>
                  <Select value={refundReason} onValueChange={setRefundReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select refund reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {refundReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Refund Method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {refundMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Details (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Provide additional details about your refund request..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting || !selectedPayment || !refundReason}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Refund Request'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Refund Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Refund History</CardTitle>
        </CardHeader>
        <CardContent>
          {refundRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No refund requests found
            </div>
          ) : (
            <div className="space-y-4">
              {refundRequests.map((refund) => (
                <div key={refund.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(refund.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          Refund Request
                        </span>
                        <Badge variant={getStatusBadgeVariant(refund.status)}>
                          {refund.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reason: {refund.reason.replace(/_/g, ' ')}
                      </p>
                      {refund.description && (
                        <p className="text-sm text-muted-foreground">
                          {refund.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(refund.created_at).toLocaleDateString()}
                        </p>
                        {refund.reviewed_at && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed: {new Date(refund.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {refund.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Rejection Reason: {refund.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(refund.amount_cents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Via {refund.refund_method.replace(/_/g, ' ')}
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