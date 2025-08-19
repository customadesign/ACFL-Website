'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugAppointments() {
  const [testAppointments, setTestAppointments] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    loadDebugInfo()
  }, [])

  const loadDebugInfo = () => {
    const appointments = JSON.parse(localStorage.getItem('testAppointments') || '[]')
    const now = Date.now()
    
    const debug = {
      currentTime: new Date().toISOString(),
      currentTimeMs: now,
      totalAppointments: appointments.length,
      appointments: appointments.map((apt: any) => {
        const startTime = new Date(apt.starts_at).getTime()
        const isUpcoming = startTime > now - 24 * 60 * 60 * 1000
        const isPast = startTime <= now
        
        return {
          ...apt,
          startTimeMs: startTime,
          timeDiffMs: startTime - now,
          timeDiffHours: (startTime - now) / (1000 * 60 * 60),
          isUpcoming,
          isPast,
          wouldShowInUpcoming: isUpcoming,
          wouldShowInPast: isPast
        }
      })
    }
    
    setTestAppointments(appointments)
    setDebugInfo(debug)
    console.log('Debug Info:', debug)
  }

  const clearTestData = () => {
    localStorage.removeItem('testAppointments')
    loadDebugInfo()
  }

  const createTestAppointment = () => {
    const now = new Date()
    const startTime = new Date(now.getTime() + 15 * 60 * 1000) // Start in 15 minutes
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration
    
    const testAppointment = {
      id: `test-${Date.now()}`,
      client_id: 'test-client',
      coach_id: '8b2e5710-e8c8-4010-ab8c-0eba0fd1f0ed',
      starts_at: startTime.toISOString(),
      ends_at: endTime.toISOString(),
      status: 'confirmed',
      notes: 'Debug test appointment',
      meeting_id: `meeting_${Math.random().toString(36).substring(2, 15)}`,
      session_type: 'session',
      duration: 60,
      created_at: new Date().toISOString(),
      // For client view
      coaches: {
        id: '8b2e5710-e8c8-4010-ab8c-0eba0fd1f0ed',
        first_name: 'Test',
        last_name: 'Coach',
        specialties: ['ACT', 'Mindfulness'],
        users: {
          email: 'test.coach@example.com'
        }
      },
      // For coach view
      clients: {
        first_name: 'Test',
        last_name: 'Client',
        phone: '+1234567890',
        email: 'test.client@example.com',
        users: {
          email: 'test.client@example.com'
        }
      }
    }

    const existingAppointments = JSON.parse(localStorage.getItem('testAppointments') || '[]')
    existingAppointments.push(testAppointment)
    localStorage.setItem('testAppointments', JSON.stringify(existingAppointments))
    
    loadDebugInfo()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Appointments</h1>
        
        <div className="flex gap-4 mb-8">
          <Button onClick={loadDebugInfo}>Refresh Debug Info</Button>
          <Button onClick={createTestAppointment} className="bg-green-600 hover:bg-green-700">
            Create Test Appointment
          </Button>
          <Button onClick={clearTestData} variant="destructive">
            Clear Test Data
          </Button>
        </div>

        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current State</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Current Time:</strong> {debugInfo.currentTime}</p>
              <p><strong>Current Time (ms):</strong> {debugInfo.currentTimeMs}</p>
              <p><strong>Total Test Appointments:</strong> {debugInfo.totalAppointments}</p>
              <p><strong>localStorage Key:</strong> testAppointments</p>
              <p><strong>Raw Data Length:</strong> {testAppointments.length}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Appointments Analysis</h2>
            {debugInfo.appointments?.map((apt: any, index: number) => (
              <div key={index} className="border-b pb-4 mb-4 last:border-b-0">
                <h3 className="font-medium text-lg mb-2">Appointment {index + 1}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>ID:</strong> {apt.id}</p>
                    <p><strong>Status:</strong> {apt.status}</p>
                    <p><strong>Start Time:</strong> {apt.starts_at}</p>
                    <p><strong>Start Time (ms):</strong> {apt.startTimeMs}</p>
                  </div>
                  <div>
                    <p><strong>Time Diff (ms):</strong> {apt.timeDiffMs}</p>
                    <p><strong>Time Diff (hours):</strong> {apt.timeDiffHours?.toFixed(2)}</p>
                    <p><strong>Would show in Upcoming:</strong> {apt.wouldShowInUpcoming ? 'YES' : 'NO'}</p>
                    <p><strong>Would show in Past:</strong> {apt.wouldShowInPast ? 'YES' : 'NO'}</p>
                  </div>
                </div>
              </div>
            ))}
            {debugInfo.appointments?.length === 0 && (
              <p className="text-gray-600">No appointments found in localStorage</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Raw localStorage Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(testAppointments, null, 2)}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  )
}