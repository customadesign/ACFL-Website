'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  CreditCard,
  User,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react';
import PaymentStatusBadge, { PaymentStatus } from './PaymentStatusBadge';
import { toast } from 'react-toastify';

interface Payment {
  id: string;
  client_id: string;
  coach_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;
  platform_fee_cents: number;
  coach_earnings_cents: number;
  session_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  captured_at?: string;
  cancelled_at?: string;
  failed_at?: string;
  cancellation_reason?: string;
  metadata?: Record<string, any>;
  // Related data
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  coach?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  session?: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
  };
  refunds?: Array<{
    id: string;
    amount_cents: number;
    reason: string;
    status: string;
    created_at: string;
  }>;
}

interface PaymentDetailsProps {
  payment: Payment;
  onCapturePayment?: (paymentId: string) => Promise<void>;
  onCancelPayment?: (paymentId: string, reason: string) => Promise<void>;
  onRefundPayment?: (paymentId: string, amount?: number, reason?: string) => Promise<void>;
  showActions?: boolean;
  isAdmin?: boolean;
  className?: string;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  payment,
  onCapturePayment,
  onCancelPayment,
  onRefundPayment,
  showActions = false,
  isAdmin = false,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(payment.amount_cents);
  const [refundReason, setRefundReason] = useState('');

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCapturePayment = async () => {
    if (!onCapturePayment) return;

    setIsProcessing(true);
    try {
      await onCapturePayment(payment.id);
      toast.success('Payment captured successfully');
    } catch (error) {
      toast.error('Failed to capture payment');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!onCancelPayment || !cancelReason.trim()) return;

    setIsProcessing(true);
    try {
      await onCancelPayment(payment.id, cancelReason);
      toast.success('Payment cancelled successfully');
      setShowCancelForm(false);
      setCancelReason('');
    } catch (error) {
      toast.error('Failed to cancel payment');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundPayment = async () => {
    if (!onRefundPayment || !refundReason.trim()) return;

    setIsProcessing(true);
    try {
      await onRefundPayment(payment.id, refundAmount, refundReason);
      toast.success('Refund initiated successfully');
      setShowRefundForm(false);
      setRefundReason('');
    } catch (error) {
      toast.error('Failed to initiate refund');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canCapture = payment.status === 'authorized';
  const canCancel = payment.status === 'authorized';
  const canRefund = payment.status === 'succeeded' || payment.status === 'partially_refunded';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Details
          </CardTitle>
          <PaymentStatusBadge status={payment.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Payment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Amount:</span>
              <span className="text-lg font-semibold text-green-600">
                {formatPrice(payment.amount_cents)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Payment ID:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {payment.id.slice(-8)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(payment.id, 'Payment ID')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>

            {payment.stripe_payment_intent_id && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Square Payment ID:</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {payment.stripe_payment_intent_id.slice(-8)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(payment.stripe_payment_intent_id!, 'Square Payment ID')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm">{formatDate(payment.created_at)}</span>
            </div>

            {payment.paid_at && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Paid:</span>
                <span className="text-sm">{formatDate(payment.paid_at)}</span>
              </div>
            )}

            {payment.cancelled_at && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Cancelled:</span>
                <span className="text-sm">{formatDate(payment.cancelled_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Client and Coach Information */}
        {(payment.client || payment.coach) && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Participants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {payment.client && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-sm font-medium">Client:</span>
                    <div className="text-sm text-gray-600">
                      {payment.client.first_name} {payment.client.last_name}
                      <br />
                      {payment.client.email}
                    </div>
                  </div>
                </div>
              )}

              {payment.coach && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500" />
                  <div>
                    <span className="text-sm font-medium">Coach:</span>
                    <div className="text-sm text-gray-600">
                      {payment.coach.first_name} {payment.coach.last_name}
                      <br />
                      {payment.coach.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Information */}
        {payment.session && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Session Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Scheduled:</span>
                <span className="text-sm">{formatDate(payment.session.scheduled_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Duration:</span>
                <span className="text-sm">{payment.session.duration_minutes} minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Financial Breakdown */}
        {isAdmin && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Financial Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">{formatPrice(payment.amount_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span>{formatPrice(payment.platform_fee_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Coach Earnings:</span>
                <span>{formatPrice(payment.coach_earnings_cents)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Refunds */}
        {payment.refunds && payment.refunds.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Refunds</h4>
            <div className="space-y-2">
              {payment.refunds.map((refund) => (
                <div key={refund.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{formatPrice(refund.amount_cents)}</div>
                    <div className="text-sm text-gray-600">{refund.reason}</div>
                    <div className="text-xs text-gray-500">{formatDate(refund.created_at)}</div>
                  </div>
                  <Badge
                    className={
                      refund.status === 'succeeded'
                        ? 'bg-green-100 text-green-800'
                        : refund.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {refund.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {payment.description && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-gray-600">{payment.description}</p>
          </div>
        )}

        {/* Cancellation Reason */}
        {payment.cancellation_reason && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Cancellation Reason</h4>
            <p className="text-sm text-gray-600">{payment.cancellation_reason}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && isAdmin && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {canCapture && (
                <Button
                  onClick={handleCapturePayment}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Capture Payment
                </Button>
              )}

              {canCancel && (
                <Button
                  onClick={() => setShowCancelForm(true)}
                  disabled={isProcessing}
                  variant="destructive"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Cancel Authorization
                </Button>
              )}

              {canRefund && (
                <Button
                  onClick={() => setShowRefundForm(true)}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Issue Refund
                </Button>
              )}
            </div>

            {/* Cancel Form */}
            {showCancelForm && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h5 className="font-medium mb-2">Cancel Payment Authorization</h5>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="w-full p-2 border border-gray-300 rounded mb-3"
                  rows={3}
                  required
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelPayment}
                    disabled={isProcessing || !cancelReason.trim()}
                    variant="destructive"
                    size="sm"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Confirm Cancel
                  </Button>
                  <Button
                    onClick={() => setShowCancelForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Refund Form */}
            {showRefundForm && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium mb-2">Issue Refund</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Refund Amount</label>
                    <input
                      type="number"
                      value={refundAmount / 100}
                      onChange={(e) => setRefundAmount(Math.round(parseFloat(e.target.value) * 100))}
                      min="0"
                      max={payment.amount_cents / 100}
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Max: {formatPrice(payment.amount_cents)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reason</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason for refund..."
                      className="w-full p-2 border border-gray-300 rounded"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefundPayment}
                      disabled={isProcessing || !refundReason.trim() || refundAmount <= 0}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Issue Refund
                    </Button>
                    <Button
                      onClick={() => setShowRefundForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentDetails;