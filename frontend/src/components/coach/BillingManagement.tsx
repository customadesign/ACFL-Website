'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  History,
  CreditCard,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import CoachBillingDashboard from './BillingDashboard';
import CoachBillingHistory from './BillingHistory';
import BankAccountManagement from './BankAccountManagement';
import CoachPayoutRequest from './PayoutRequest';

interface CoachBillingManagementProps {
  coachId: string;
}

export default function CoachBillingManagement({ coachId }: CoachBillingManagementProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-0">


      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="bank-accounts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Bank Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <CoachBillingDashboard coachId={coachId} />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <CoachPayoutRequest coachId={coachId} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <CoachBillingHistory coachId={coachId} />
        </TabsContent>

        <TabsContent value="bank-accounts" className="space-y-6">
          <BankAccountManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
