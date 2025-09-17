'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'capture_failed';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
  showIcon?: boolean;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true
}) => {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          description: 'Payment is being processed'
        };
      case 'authorized':
        return {
          label: 'Authorized',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: CreditCard,
          description: 'Payment authorized, will be charged after session'
        };
      case 'succeeded':
        return {
          label: 'Paid',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          description: 'Payment completed successfully'
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          description: 'Payment failed'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: XCircle,
          description: 'Payment cancelled before capture'
        };
      case 'refunded':
        return {
          label: 'Refunded',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: RefreshCw,
          description: 'Payment fully refunded'
        };
      case 'partially_refunded':
        return {
          label: 'Partially Refunded',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: RefreshCw,
          description: 'Payment partially refunded'
        };
      case 'capture_failed':
        return {
          label: 'Capture Failed',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: AlertCircle,
          description: 'Failed to capture authorized payment'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle,
          description: 'Unknown payment status'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      className={`${config.color} ${className} flex items-center gap-1 px-2 py-1`}
      title={config.description}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </Badge>
  );
};

export default PaymentStatusBadge;