'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, TestTube, ArrowRight } from 'lucide-react'

/**
 * Test instructions for meeting restrictions - Remove in production
 */
export default function TestInstructions() {
  const [isOpen, setIsOpen] = useState(false)

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-orange-600 hover:bg-orange-700"
        size="sm"
      >
        <TestTube className="w-4 h-4 mr-2" />
        Test Guide
      </Button>
    )
  }

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 bg-white shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-orange-600">
            🧪 Meeting Restrictions Test Guide
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs space-y-3">
        <div className="bg-blue-50 p-2 rounded">
          <h4 className="font-semibold text-blue-800 mb-1">✅ How to Test:</h4>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Click "Book Test Meeting" button</li>
            <li>Choose to open the test meeting</li>
            <li>Try to navigate to other pages</li>
            <li>Try to book another meeting</li>
            <li>Try to join different appointments</li>
          </ol>
        </div>
        
        <div className="bg-green-50 p-2 rounded">
          <h4 className="font-semibold text-green-800 mb-1">🔒 Expected Behavior:</h4>
          <ul className="list-disc list-inside space-y-1 text-green-700">
            <li>Search coaches page should be blocked</li>
            <li>Book session page should be blocked</li>
            <li>Appointments pages remain accessible</li>
            <li>Can only join same meeting or end current one</li>
            <li>Other appointments show "Already in meeting"</li>
          </ul>
        </div>
        
        <div className="bg-amber-50 p-2 rounded">
          <h4 className="font-semibold text-amber-800 mb-1">🔍 Check Debug Panel:</h4>
          <p className="text-amber-700">
            Look at bottom-left debug panel for current meeting state
          </p>
        </div>

        <div className="bg-red-50 p-2 rounded">
          <h4 className="font-semibold text-red-800 mb-1">🗑️ To Reset:</h4>
          <p className="text-red-700">
            End the meeting or refresh the page to clear state
          </p>
        </div>
      </CardContent>
    </Card>
  )
}