'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Monitor, Shield, Trash2, Check } from 'lucide-react';

export default function ThemeSettings() {
  const { theme, toggleTheme, hasStorageConsent, revokeStorageConsent } = useTheme();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Theme & Display Settings
        </CardTitle>
        <CardDescription>
          Customize how the app looks and manage your privacy preferences
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-medium mb-3">Appearance</h3>
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => theme !== 'light' && toggleTheme()}
              className="flex-1 flex items-center gap-2 h-12"
            >
              <Sun className="h-4 w-4" />
              Light Mode
              {theme === 'light' && <Check className="h-4 w-4 ml-auto" />}
            </Button>
            
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => theme !== 'dark' && toggleTheme()}
              className="flex-1 flex items-center gap-2 h-12"
            >
              <Moon className="h-4 w-4" />
              Dark Mode
              {theme === 'dark' && <Check className="h-4 w-4 ml-auto" />}
            </Button>
          </div>
        </div>

        {/* Storage Consent Status */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Storage
          </h3>
          
          <div className={`p-4 rounded-lg border ${
            hasStorageConsent 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded-full ${
                hasStorageConsent 
                  ? 'bg-green-100 dark:bg-green-800' 
                  : 'bg-yellow-100 dark:bg-yellow-800'
              }`}>
                {hasStorageConsent ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Monitor className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className={`font-medium ${
                  hasStorageConsent 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  {hasStorageConsent 
                    ? 'Theme preferences are being saved' 
                    : 'Theme preferences are not being saved'
                  }
                </div>
                
                <div className={`text-sm mt-1 ${
                  hasStorageConsent 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {hasStorageConsent 
                    ? 'Your theme choice is remembered between visits and stored only on your device.'
                    : 'Your theme will reset to light mode each time you visit the app.'
                  }
                </div>
              </div>
            </div>
          </div>

          {hasStorageConsent && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={revokeStorageConsent}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Stop Saving Theme Preferences
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This will clear your saved theme preference and reset to light mode
              </p>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-3">About Theme Storage</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>• Theme preferences are stored locally on your device only</p>
            <p>• No personal data is collected or sent to our servers</p>
            <p>• You can change or revoke consent at any time</p>
            <p>• Clearing your browser data will reset these preferences</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}