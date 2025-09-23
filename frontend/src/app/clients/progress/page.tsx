'use client';

import React from 'react';
import ClientPageWrapper from '@/components/ClientPageWrapper';
import ClientProgressDashboard from '@/components/progress/ClientProgressDashboard';
import { useAuth } from '@/contexts/AuthContext';

const ClientProgressPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <ClientPageWrapper title="My Progress" description="Track your coaching journey and wellness">
      <ClientProgressDashboard
        clientId={user?.id || ''}
        userRole="client"
      />
    </ClientPageWrapper>
  );
};

export default ClientProgressPage;