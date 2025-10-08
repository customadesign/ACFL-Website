'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeSquare } from '@/lib/square';

interface SquareContextType {
  payments: any | null;
  isLoaded: boolean;
  error: string | null;
  card: any | null;
  initializeCard: () => Promise<any>;
  tokenize: () => Promise<{ token: string }>;
}

const SquareContext = createContext<SquareContextType | undefined>(undefined);

interface SquareProviderProps {
  children: ReactNode;
}

export function SquareProvider({ children }: SquareProviderProps) {
  const [payments, setPayments] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    const loadSquare = async () => {
      try {
        // Ensure the Square script is loaded first
        if (typeof window !== 'undefined' && !window.Square) {
          // Wait for Square script to load
          await new Promise<void>((resolve) => {
            const checkSquare = setInterval(() => {
              if (window.Square) {
                clearInterval(checkSquare);
                resolve();
              }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkSquare);
              resolve();
            }, 10000);
          });
        }

        const paymentsInstance = await initializeSquare();
        setPayments(paymentsInstance);
        setIsLoaded(true);
      } catch (err) {
        console.error('Square Provider initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Square');
        setIsLoaded(true);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loadSquare();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const initializeCard = async () => {
    if (!payments) {
      throw new Error('Square payments not initialized');
    }

    try {
      const cardInstance = await payments.card({
        style: {
          '.input-container': {
            borderColor: '#e5e7eb',
            borderRadius: '8px',
          },
          '.input-container.is-focus': {
            borderColor: '#3b82f6',
          },
          '.input-container.is-error': {
            borderColor: '#ef4444',
          },
          '.message-text': {
            color: '#ef4444',
          },
          '.message-text.is-error': {
            color: '#ef4444',
          },
          'input': {
            color: '#1f2937',
            backgroundColor: 'transparent',
          },
          'input::placeholder': {
            color: '#9ca3af',
          },
        },
      });

      setCard(cardInstance);
      return cardInstance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize card');
      throw err;
    }
  };

  const tokenize = async () => {
    if (!card) {
      throw new Error('Card not initialized');
    }

    try {
      const tokenResult = await card.tokenize();

      if (tokenResult.status === 'OK') {
        return { token: tokenResult.token };
      } else {
        throw new Error(tokenResult.errors?.[0]?.message || 'Tokenization failed');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Tokenization failed');
    }
  };

  const value: SquareContextType = {
    payments,
    isLoaded,
    error,
    card,
    initializeCard,
    tokenize,
  };

  return (
    <SquareContext.Provider value={value}>
      {children}
    </SquareContext.Provider>
  );
}

export function useSquare() {
  const context = useContext(SquareContext);
  if (context === undefined) {
    throw new Error('useSquare must be used within a SquareProvider');
  }
  return context;
}

export default SquareProvider;