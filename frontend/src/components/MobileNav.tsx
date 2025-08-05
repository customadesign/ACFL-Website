"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import { Menu, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ]

  // Home page specific menu items
  const homePageItems = [
    { href: '#quick-assessment', label: 'Find a Coach', isAnchor: true },
    { href: '#how-it-works', label: 'How it Works', isAnchor: true },
  ]

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-md text-gray-600 hover:text-brand-teal hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeMenu}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Logo size={28} />
                  <span className="text-lg font-bold text-ink-dark">ACT Coaching</span>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-md text-gray-600 hover:text-brand-teal hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-6">
                                <nav className="space-y-4">
                  {menuItems.map((item) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                       <Link
                         href={item.href}
                         onClick={closeMenu}
                         className="flex items-center justify-between w-full p-3 text-left text-gray-700 hover:text-brand-teal hover:bg-gray-50 rounded-lg transition-colors"
                       >
                         <span className="font-medium">{item.label}</span>
                         <ChevronRight className="w-4 h-4" />
                       </Link>
                    </motion.div>
                  ))}
                  
                  {/* Home page specific items */}
                  {pathname === '/' && homePageItems.map((item) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <button
                        onClick={() => {
                          closeMenu()
                          const element = document.querySelector(item.href)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }}
                        className="flex items-center justify-between w-full p-3 text-left text-gray-700 hover:text-brand-teal hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span className="font-medium">{item.label}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </nav>

                {/* Action Buttons */}
                <div className="mt-8 space-y-4">
                  <Link href="/login" onClick={closeMenu}>
                    <Button 
                      variant="outline" 
                      className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                    >
                      Login
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => {
                      closeMenu()
                      const element = document.querySelector('#quick-assessment')
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white"
                  >
                    Get Started
                  </Button>
                </div>

                {/* Additional Links */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <Link
                      href="/help"
                      onClick={closeMenu}
                      className="block text-sm text-gray-600 hover:text-brand-teal transition-colors"
                    >
                      Help Center
                    </Link>
                    <Link
                      href="/privacy"
                      onClick={closeMenu}
                      className="block text-sm text-gray-600 hover:text-brand-teal transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/terms"
                      onClick={closeMenu}
                      className="block text-sm text-gray-600 hover:text-brand-teal transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 