"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CoachPageWrapper from '@/components/CoachPageWrapper'
import CoachBillingManagement from '@/components/coach/BillingManagement'

export default function CoachBillingPage() {
  const { user } = useAuth()
  const [coachId, setCoachId] = useState<string>('')

  useEffect(() => {
    if (user?.id) {
      setCoachId(user.id)
    }
  }, [user])

  if (!coachId) {
    return (
      <CoachPageWrapper title="Billing & Earnings" description="Manage your earnings, payouts, and financial history">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </CoachPageWrapper>
    )
  }

  return (

    
    <div id='coach-billing-page' className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
    <CoachPageWrapper title="Billing & Earnings" description="Manage your earnings, payouts, and financial history" >
      <CoachBillingManagement coachId={coachId} />
    </CoachPageWrapper>
    </div>
  )
}