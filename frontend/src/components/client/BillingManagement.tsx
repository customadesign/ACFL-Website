'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  CreditCard,
  History,
  RefreshCw,
  FileText,
  TrendingDown
} from 'lucide-react';
import ClientBillingDashboard from './BillingDashboard';
import ClientBillingHistory from './BillingHistory';
import RefundRequest from './RefundRequest';

interface ClientBillingManagementProps {
  clientId: string;
}

export default function ClientBillingManagement({ clientId }: ClientBillingManagementProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground">
            Manage your payments, credits, and refund requests
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refunds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ClientBillingDashboard clientId={clientId} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ClientBillingHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <RefundRequest clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}