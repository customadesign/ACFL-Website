'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';

interface Payment {
  id: string;
  client_name: string;
  coach_name: string;
  amount_cents: number;
  status: string;
  description: string;
  created_at: string;
  paid_at: string;
}

interface RefundManagerProps {
  payment: Payment;
  onRefundComplete?: (refundId: string) => void;
  onClose?: () => void;
}

type RefundReason = 
  | 'duplicate' 
  | 'fraudulent' 
  | 'requested_by_customer' 
  | 'admin_initiated' 
  | 'coach_requested' 
  | 'auto_cancellation';

const RefundManager: React.FC<RefundManagerProps> = ({
  payment,
  onRefundComplete,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [refundData, setRefundData] = useState({
    amount_cents: payment.amount_cents,
    reason: '' as RefundReason | '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!refundData.reason) {
      toast.error('Please select a refund reason');
      return;
    }

    if (refundData.amount_cents <= 0 || refundData.amount_cents > payment.amount_cents) {
      toast.error('Invalid refund amount');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/payments/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: payment.id,
          amount_cents: refundData.amount_cents,
          reason: refundData.reason,
          description: refundData.description,
        }),
      });

      if (response.ok) {
        const refund = await response.json();
        toast.success('Refund initiated successfully');
        onRefundComplete?.(refund.refund_id);
        onClose?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRefundImpact = () => {
    const isPartialRefund = refundData.amount_cents < payment.amount_cents;
    const refundPercentage = (refundData.amount_cents / payment.amount_cents) * 100;
    
    return {
      isPartial: isPartialRefund,
      percentage: Math.round(refundPercentage),
      clientRefund: formatPrice(refundData.amount_cents),
      remainingCharge: isPartialRefund ? formatPrice(payment.amount_cents - refundData.amount_cents) : '$0.00',
    };
  };

  const impact = getRefundImpact();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">Client</div>
                <div className="font-medium">{payment.client_name}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">Coach</div>
                <div className="font-medium">{payment.coach_name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">Amount</div>
                <div className="font-semibold text-green-600">
                  {formatPrice(payment.amount_cents)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">Payment Date</div>
                <div>{formatDate(payment.paid_at || payment.created_at)}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <Badge className={getStatusColor(payment.status)}>
              {payment.status}
            </Badge>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Description</div>
            <div>{payment.description}</div>
          </div>
        </CardContent>
      </Card>

      {/* Refund Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Process Refund
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Refund Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={refundData.amount_cents / 100}
                  onChange={(e) => setRefundData(prev => ({
                    ...prev,
                    amount_cents: Math.round(parseFloat(e.target.value || '0') * 100)
                  }))}
                  min="0.01"
                  max={payment.amount_cents / 100}
                  step="0.01"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Maximum: {formatPrice(payment.amount_cents)}
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Select 
                  value={refundData.reason} 
                  onValueChange={(value: RefundReason) => 
                    setRefundData(prev => ({ ...prev, reason: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select refund reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested_by_customer">Customer Request</SelectItem>
                    <SelectItem value="admin_initiated">Admin Decision</SelectItem>
                    <SelectItem value="coach_requested">Coach Cancellation</SelectItem>
                    <SelectItem value="auto_cancellation">Automatic Cancellation</SelectItem>
                    <SelectItem value="duplicate">Duplicate Payment</SelectItem>
                    <SelectItem value="fraudulent">Fraudulent Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Notes (Optional)</Label>
              <Textarea
                id="description"
                value={refundData.description}
                onChange={(e) => setRefundData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                placeholder="Additional details about the refund..."
                rows={3}
              />
            </div>

            {/* Refund Impact Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Refund Impact</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Refund Type:</span>
                  <span className="font-medium">
                    {impact.isPartial ? `Partial (${impact.percentage}%)` : 'Full Refund'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Client Refund:</span>
                  <span className="font-medium text-green-600">{impact.clientRefund}</span>
                </div>
                {impact.isPartial && (
                  <div className="flex justify-between">
                    <span>Remaining Charge:</span>
                    <span className="font-medium">{impact.remainingCharge}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading || !refundData.reason}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Processing...' : 'Process Refund'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-semibold mb-1">Important Notice</p>
              <p>
                Processing this refund will immediately return the funds to the customer's 
                original payment method. This action cannot be undone. The coach will be 
                notified of the refund based on the selected reason.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundManager;