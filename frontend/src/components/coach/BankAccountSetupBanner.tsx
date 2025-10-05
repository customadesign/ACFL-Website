'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';

export default function BankAccountSetupBanner() {
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBankAccountStatus();
  }, []);

  const checkBankAccountStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/billing/bank-accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Check if there's at least one verified bank account
        const hasVerifiedAccount = data.some((account: any) => account.is_verified);
        setHasBankAccount(hasVerifiedAccount);
      } else {
        setHasBankAccount(false);
      }
    } catch (error) {
      console.error('Failed to check bank account status:', error);
      setHasBankAccount(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if loading, dismissed, or has bank account
  if (isLoading || isDismissed || hasBankAccount) {
    return null;
  }

  return (
    <div className="mb-6 relative">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-l-4 border-orange-500 dark:border-orange-400 rounded-lg p-4 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              Bank Account Setup Required
            </h3>
            <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
              <p className="mb-2">
                To receive payments from your coaching sessions, you need to set up a bank account.
              </p>
              <p className="font-medium">
                <span className="inline-flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Your profile is hidden from clients until you complete this step.
                </span>
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/coaches/billing"
                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Set Up Bank Account
              </Link>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 ml-4 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
