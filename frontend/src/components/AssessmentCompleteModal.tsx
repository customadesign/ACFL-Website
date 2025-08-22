'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, UserPlus, LogIn } from 'lucide-react';

interface AssessmentCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssessmentCompleteModal({ isOpen, onClose }: AssessmentCompleteModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    router.push('/login?from=assessment&redirect=/clients/search-coaches');
  };

  const handleRegister = () => {
    router.push('/register/client?from=assessment');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Assessment Complete!</CardTitle>
          <CardDescription className="text-lg">
            We've found coaches that match your needs. Sign in or create an account to view your personalized matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600 mb-4">
            Your assessment results have been saved and will be available after you sign in.
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRegister}
              className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white"
              size="lg"
            >
              <UserPlus className="mr-2 w-5 h-5" />
              Create New Account
            </Button>
            
            <Button 
              onClick={handleLogin}
              variant="outline"
              className="w-full border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
              size="lg"
            >
              <LogIn className="mr-2 w-5 h-5" />
              Sign In to Existing Account
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 mt-4">
            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Continue browsing
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}