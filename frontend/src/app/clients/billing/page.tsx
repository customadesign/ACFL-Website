"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ClientBillingManagement from '@/components/client/BillingManagement'

export default function ClientBillingPage() {
  const { user } = useAuth()
  const [clientId, setClientId] = useState<string>('')

  useEffect(() => {
    if (user?.id) {
      setClientId(user.id)
    }
  }, [user])

  if (!clientId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return <ClientBillingManagement clientId={clientId} />
}