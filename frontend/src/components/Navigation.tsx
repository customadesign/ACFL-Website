"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import MobileNav from '@/components/MobileNav'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  variant?: 'default' | 'transparent'
}

export default function Navigation({ variant = 'default' }: NavigationProps) {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname === path
  }

  const getNavBackground = () => {
    return variant === 'transparent' 
      ? 'bg-white/95 backdrop-blur-md' 
      : 'bg-white'
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ]

  // Home page specific navigation items
  const homePageItems = [
    { href: '#quick-assessment', label: 'Find a Coach', isAnchor: true },
    { href: '#how-it-works', label: 'How it Works', isAnchor: true },
  ]

  return (
    <nav className={`sticky top-0 z-50 border-b border-gray-200 shadow-sm ${getNavBackground()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <Logo size={32} />
            <span className="hidden sm:block text-xl font-bold text-ink-dark">ACT Coaching For Life</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Navigation Links */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-teal font-semibold'
                    : 'text-gray-600 hover:text-brand-teal'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Home page specific links */}
            {pathname === '/' && homePageItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-brand-teal transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
            
            {/* Action Buttons */}
            <Link href="/login">
              <Button variant="outline" className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
                Login
              </Button>
            </Link>
            <a href="/#quick-assessment">
              <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                Get Started
              </Button>
            </a>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </nav>
  )
} 