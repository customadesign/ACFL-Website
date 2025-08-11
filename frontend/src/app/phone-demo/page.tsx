'use client';

import { useState } from 'react';
import { PhoneInput } from '@/components/PhoneInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PhoneDemo() {
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Phone Input Component Demo
          </h1>
          <p className="text-gray-600">
            Test the international phone number input with country selection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Phone Number Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Current Value:</h3>
              <p className="text-sm text-gray-600 font-mono">
                {phoneNumber || 'No phone number entered'}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Country selection with flags and dial codes</li>
                <li>• Search countries by name, code, or dial code</li>
                <li>• Automatic phone number formatting</li>
                <li>• International format support</li>
                <li>• Click outside to close dropdown</li>
                <li>• Auto-detection of country from existing number</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
