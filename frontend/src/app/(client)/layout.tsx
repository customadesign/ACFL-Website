'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Search & Save Coaches', href: '/search-coaches' },
    { name: 'Appointments', href: '/appointments' },
    { name: 'Messages', href: '/messages' },
    { name: 'Profile', href: '/profile' },
  ]

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img
                  src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
                  alt="ACT Coaching For Life Logo"
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-semibold text-gray-900">ACT Coaching For Life</h1>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-gray-500">Welcome, {user?.firstName || 'Client'}!</span>
                <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navItems.map(item => (
                <Link key={item.href} href={item.href} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${pathname === item.href ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  )
}


