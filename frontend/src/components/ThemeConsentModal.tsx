'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Palette, Shield } from 'lucide-react';

interface ThemeConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ThemeConsentModal({ isOpen, onAccept, onDecline }: ThemeConsentModalProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
    }
  }, [isOpen]);

  if (!showModal) return null;

  const handleAccept = () => {
    setShowModal(false);
    onAccept();
  };

  const handleDecline = () => {
    setShowModal(false);
    onDecline();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10003] p-4">
      <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-2xl border-0">
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-3">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full">
              <Palette className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <Sun className="h-5 w-5 text-yellow-500" />
              <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Personalize Your Experience
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Would you like us to remember your theme preference?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-1">What this means:</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• We'll remember if you prefer light or dark mode</li>
                  <li>• Your choice will persist when you visit again</li>
                  <li>• This setting is stored only on your device</li>
                  <li>• You can change this anytime in settings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              No, Don't Remember
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Yes, Remember My Choice
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Choosing "No" means your theme will reset to light mode each time you visit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}