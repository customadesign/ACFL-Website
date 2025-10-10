'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  History,
  CreditCard,
  FileText,
  TrendingUp
} from 'lucide-react';
import CoachBillingDashboard from './BillingDashboard';
import CoachBillingHistory from './BillingHistory';
import BankAccountManagement from './BankAccountManagement';

interface CoachBillingManagementProps {
  coachId: string;
}

export default function CoachBillingManagement({ coachId }: CoachBillingManagementProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-0">
      

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
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