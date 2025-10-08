'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

const PaymentDeploymentCheck: React.FC = () => {
  const [checks, setChecks] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    performChecks();
  }, []);

  const performChecks = async () => {
    const API_URL = getApiUrl();

    const checkResults = {
      environment: process.env.NODE_ENV,
      apiUrl: API_URL,
      squareConfig: {
        appId: !!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
        locationId: !!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT
      },
      apiConnectivity: false,
      squareRatesApi: false,
      paymentAuthApi: false
    };

    try {
      // Test API connectivity
      const healthResponse = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      checkResults.apiConnectivity = healthResponse.ok;
    } catch (error) {
      console.error('API connectivity check failed:', error);
    }

    try {
      // Test Square rates API (no auth required)
      const ratesResponse = await fetch(`${API_URL}/api/payments/public/coaches/test/rates`);
      checkResults.squareRatesApi = ratesResponse.status !== 500; // Even 404 is better than 500
    } catch (error) {
      console.error('Square rates API check failed:', error);
    }

    try {
      // Test payment auth API (with dummy token)
      const authResponse = await fetch(`${API_URL}/api/payments/create-payment-authorization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy-token'
        },
        body: JSON.stringify({ sourceId: 'test' })
      });
      // 401 is expected, 500 indicates server issues
      checkResults.paymentAuthApi = authResponse.status === 401;
    } catch (error) {
      console.error('Payment auth API check failed:', error);
    }

    setChecks(checkResults);
    setIsLoading(false);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading deployment checks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Payment System Deployment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Environment Configuration</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Environment:</span>
                <span className="font-mono">{checks.environment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API URL:</span>
                <span className="font-mono text-xs">{checks.apiUrl}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Square Configuration</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>App ID:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(checks.squareConfig.appId)}
                  <span>{checks.squareConfig.appId ? 'Set' : 'Missing'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Location ID:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(checks.squareConfig.locationId)}
                  <span>{checks.squareConfig.locationId ? 'Set' : 'Missing'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Environment:</span>
                <span className="font-mono">{checks.squareConfig.environment || 'sandbox'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">API Connectivity</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Backend API:</span>
              <div className="flex items-center gap-1">
                {getStatusIcon(checks.apiConnectivity)}
                <span>{checks.apiConnectivity ? 'Connected' : 'Failed'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Square Rates API:</span>
              <div className="flex items-center gap-1">
                {getStatusIcon(checks.squareRatesApi)}
                <span>{checks.squareRatesApi ? 'Working' : 'Failed'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment Auth API:</span>
              <div className="flex items-center gap-1">
                {getStatusIcon(checks.paymentAuthApi)}
                <span>{checks.paymentAuthApi ? 'Working' : 'Failed'}</span>
              </div>
            </div>
          </div>
        </div>

        {(!checks.squareConfig.appId || !checks.squareConfig.locationId || !checks.apiConnectivity) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Critical Issues Detected</p>
                <ul className="text-sm text-red-700 mt-1 space-y-1">
                  {!checks.squareConfig.appId && <li>• Square Application ID is missing</li>}
                  {!checks.squareConfig.locationId && <li>• Square Location ID is missing</li>}
                  {!checks.apiConnectivity && <li>• Backend API is not accessible</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentDeploymentCheck;