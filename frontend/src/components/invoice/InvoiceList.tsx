import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import InvoiceCard from './InvoiceCard';
import CreateInvoiceModal from './CreateInvoiceModal';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  total_cents: number;
  balance_due_cents: number;
  status: string;
  issue_date: string;
  due_date: string;
  is_overdue: boolean;
}

interface InvoiceListProps {
  coachId: string;
  userRole: string;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ coachId, userRole }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    if (userRole === 'coach') {
      fetchClients();
    }
  }, [coachId]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  const fetchInvoices = async () => {
    try {
      const endpoint = userRole === 'coach'
        ? `/api/coaches/${coachId}/invoices`
        : `/api/clients/${coachId}/invoices`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();
      setInvoices(data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`/api/coaches/${coachId}/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch clients');

      const data = await response.json();
      const clientList = data.map((client: any) => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`
      }));
      setClients(clientList);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        filtered = filtered.filter(invoice => invoice.is_overdue);
      } else {
        filtered = filtered.filter(invoice => invoice.status === statusFilter);
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(invoice => {
        const issueDate = new Date(invoice.issue_date);
        switch (dateFilter) {
          case 'this_month':
            return issueDate.getMonth() === now.getMonth() &&
                   issueDate.getFullYear() === now.getFullYear();
          case 'last_month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            return issueDate.getMonth() === lastMonth.getMonth() &&
                   issueDate.getFullYear() === lastMonth.getFullYear();
          case 'this_year':
            return issueDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredInvoices(filtered);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to send invoice');

      toast({
        title: 'Success',
        description: 'Invoice sent successfully'
      });

      fetchInvoices(); // Refresh list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invoice',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to download invoice');

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      });
    }
  };

  const getInvoiceStats = () => {
    const total = invoices.length;
    const paid = invoices.filter(inv => inv.status === 'paid').length;
    const overdue = invoices.filter(inv => inv.is_overdue).length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_cents, 0);
    const outstanding = invoices.reduce((sum, inv) => sum + inv.balance_due_cents, 0);

    return { total, paid, overdue, totalAmount, outstanding };
  };

  const stats = getInvoiceStats();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage your invoices and payments</p>
        </div>
        {userRole === 'coach' && (
          <CreateInvoiceModal
            clients={clients}
            coachId={coachId}
            onSuccess={fetchInvoices}
          />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-gray-600">Total Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-gray-600">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-gray-600">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${(stats.totalAmount / 100).toFixed(0)}</div>
            <p className="text-gray-600">Total Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">${(stats.outstanding / 100).toFixed(0)}</div>
            <p className="text-gray-600">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No invoices found</p>
            {userRole === 'coach' && (
              <CreateInvoiceModal
                trigger={
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first invoice
                  </Button>
                }
                clients={clients}
                coachId={coachId}
                onSuccess={fetchInvoices}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onSend={handleSendInvoice}
              onDownload={handleDownloadInvoice}
              showActions={userRole === 'coach'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;