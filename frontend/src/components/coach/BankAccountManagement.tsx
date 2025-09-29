'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Trash2, CreditCard, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BankAccount {
  id: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string; // Masked
  routing_number: string;
  account_type: 'checking' | 'savings';
  country: string;
  currency: string;
  is_verified: boolean;
  is_default: boolean;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_method?: 'micro_deposits' | 'plaid' | 'manual';
  created_at: string;
}

interface BankAccountFormData {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: 'checking' | 'savings';
  is_default: boolean;
}

export default function BankAccountManagement() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BankAccountFormData>({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    routing_number: '',
    account_type: 'checking',
    is_default: false
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/billing/bank-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bank accounts');
      }

      const data = await response.json();
      setBankAccounts(data);
    } catch (error) {
      setError('Failed to load bank accounts');
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/billing/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add bank account');
      }

      await fetchBankAccounts();
      setShowAddForm(false);
      setFormData({
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        routing_number: '',
        account_type: 'checking',
        is_default: false
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add bank account');
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/billing/bank-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete bank account');
      }

      await fetchBankAccounts();
    } catch (error) {
      setError('Failed to delete bank account');
      console.error('Error deleting bank account:', error);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const response = await fetch(`/api/billing/bank-accounts/${accountId}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to set default account');
      }

      await fetchBankAccounts();
    } catch (error) {
      setError('Failed to set default account');
      console.error('Error setting default account:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bank Account Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bank Account Management</CardTitle>
            <CardDescription>
              Manage your bank accounts for receiving direct payments when sessions are completed
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Bank Account
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Bank Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account_holder_name">Account Holder Name</Label>
                      <Input
                        id="account_holder_name"
                        value={formData.account_holder_name}
                        onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        type="password"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="routing_number">Routing Number</Label>
                      <Input
                        id="routing_number"
                        value={formData.routing_number}
                        onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                        pattern="[0-9]{9}"
                        maxLength={9}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_type">Account Type</Label>
                      <Select
                        value={formData.account_type}
                        onValueChange={(value: 'checking' | 'savings') =>
                          setFormData({ ...formData, account_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_default">Set as default account</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Add Account</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No bank accounts</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add a bank account to receive direct payments from your coaching sessions
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                Add Your First Bank Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{account.bank_name}</h3>
                          <div className="flex gap-2">
                            {account.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            {account.is_verified ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {account.verification_status === 'pending' ? 'Pending' : 'Failed'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p>{account.account_holder_name}</p>
                          <p>
                            {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                            {' '}••••{account.account_number.slice(-4)}
                          </p>
                          <p>Routing: {account.routing_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!account.is_default && account.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(account.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {!account.is_verified && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          This account needs to be verified before you can receive payouts.
                          {account.verification_method === 'micro_deposits' &&
                            ' Check for micro deposits in your account and verify them.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {bankAccounts.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Payments are automatically sent to your default verified bank account
                when a coaching session is completed. Transfers typically arrive within 1-3 business days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}