import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CalendarDays, User, DollarSign, FileText, Send, Download } from 'lucide-react';

interface InvoiceCardProps {
  invoice: {
    id: string;
    invoice_number: string;
    client_name: string;
    total_cents: number;
    balance_due_cents: number;
    status: string;
    issue_date: string;
    due_date: string;
    is_overdue: boolean;
  };
  onView?: (invoiceId: string) => void;
  onSend?: (invoiceId: string) => void;
  onDownload?: (invoiceId: string) => void;
  showActions?: boolean;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onView,
  onSend,
  onDownload,
  showActions = true
}) => {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'destructive';

    switch (status) {
      case 'paid': return 'default';
      case 'partially_paid': return 'secondary';
      case 'sent': return 'outline';
      case 'draft': return 'outline';
      case 'cancelled': return 'secondary';
      case 'refunded': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'OVERDUE';
    return status.toUpperCase().replace('_', ' ');
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {invoice.invoice_number}
          </CardTitle>
          <Badge
            variant={getStatusColor(invoice.status, invoice.is_overdue)}
            className={invoice.is_overdue ? 'bg-red-100 text-red-800' : ''}
          >
            {getStatusText(invoice.status, invoice.is_overdue)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium">{invoice.client_name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{formatCurrency(invoice.total_cents)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Issue Date</p>
              <p className="font-medium">{formatDate(invoice.issue_date)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className={`font-medium ${invoice.is_overdue ? 'text-red-600' : ''}`}>
                {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>
        </div>

        {invoice.balance_due_cents > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Balance Due: {formatCurrency(invoice.balance_due_cents)}</strong>
            </p>
          </div>
        )}

        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(invoice.id)}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-1" />
              View
            </Button>

            {['draft', 'pending'].includes(invoice.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSend?.(invoice.id)}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload?.(invoice.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;