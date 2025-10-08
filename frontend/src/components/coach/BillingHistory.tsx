'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  CalendarIcon,
  Download,
  Filter,
  Search,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { getApiUrl } from '@/lib/api';

interface BillingTransaction {
  id: string;
  transaction_type: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
  updated_at: string;
}

interface TransactionFilters {
  start_date?: Date;
  end_date?: Date;
  transaction_types?: string[];
  status?: string[];
  min_amount_cents?: number;
  max_amount_cents?: number;
  search_term?: string;
}

interface CoachBillingHistoryProps {
  coachId: string;
}

export default function CoachBillingHistory({ coachId }: CoachBillingHistoryProps) {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter states
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const transactionTypes = ['payment', 'payout', 'refund', 'credit', 'debit', 'fee'];
  const statusOptions = ['pending', 'completed', 'failed', 'cancelled'];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const queryParams = new URLSearchParams();

      if (filters.start_date) queryParams.append('start_date', filters.start_date.toISOString());
      if (filters.end_date) queryParams.append('end_date', filters.end_date.toISOString());
      if (filters.transaction_types?.length) queryParams.append('transaction_types', filters.transaction_types.join(','));
      if (filters.status?.length) queryParams.append('status', filters.status.join(','));
      if (filters.min_amount_cents) queryParams.append('min_amount_cents', filters.min_amount_cents.toString());
      if (filters.max_amount_cents) queryParams.append('max_amount_cents', filters.max_amount_cents.toString());
      if (filters.search_term) queryParams.append('search_term', filters.search_term);

      const response = await fetch(`${API_URL}/api/billing/transactions/${coachId}/coach?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [coachId, filters]);

  const applyFilters = () => {
    const newFilters: TransactionFilters = {
      start_date: startDate,
      end_date: endDate,
      search_term: searchTerm || undefined,
      transaction_types: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      min_amount_cents: minAmount ? parseFloat(minAmount) * 100 : undefined,
      max_amount_cents: maxAmount ? parseFloat(maxAmount) * 100 : undefined,
    };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setMinAmount('');
    setMaxAmount('');
    setFilters({});
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
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment':
        return '💰';
      case 'payout':
        return '💸';
      case 'refund':
        return '↩️';
      case 'credit':
        return '➕';
      case 'debit':
        return '➖';
      case 'fee':
        return '🏦';
      default:
        return '📄';
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Description', 'Amount', 'Status'].join(','),
      ...transactions.map(t => [
        format(new Date(t.created_at), 'yyyy-MM-dd'),
        t.transaction_type,
        `"${t.description}"`,
        (t.amount_cents / 100).toString(),
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  if (loading && !transactions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin dark:text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Billing History</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 dark:text-white"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={exportTransactions}
            className="flex items-center gap-2 dark:text-white"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center gap-2 dark:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Range ($)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <Input
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <Button onClick={applyFilters} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Transactions ({transactions.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              Date {sortOrder === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
              <Button onClick={fetchTransactions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {!error && (
            <div className="space-y-4">
              {sortedTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  No transactions found
                </div>
              ) : (
                sortedTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-800/30">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize text-gray-900 dark:text-gray-100">
                            {transaction.transaction_type.replace('_', ' ')}
                          </span>
                          <Badge variant={getStatusBadgeVariant(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground dark:text-gray-300">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            {format(new Date(transaction.created_at), 'PPP p')}
                          </p>
                          {transaction.reference_id && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400">
                              Ref: {transaction.reference_id.slice(-8)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        transaction.transaction_type === 'payment' ? 'text-green-600 dark:text-green-400' :
                        transaction.transaction_type === 'refund' ? 'text-red-600 dark:text-red-400' :
                        transaction.transaction_type === 'payout' ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-600 dark:text-gray-400'
                      )}>
                        {['refund', 'payout', 'debit', 'fee'].includes(transaction.transaction_type) ? '-' : '+'}
                        {formatCurrency(transaction.amount_cents)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}