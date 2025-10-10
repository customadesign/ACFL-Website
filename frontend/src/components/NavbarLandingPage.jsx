"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { ChevronDown } from "lucide-react";

const NavbarLandingPage = () => {
  const [openDropdown, setOpenDropdown] = useState(null);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (openDropdown === 'mobile') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [openDropdown]);

  const handleDropdownToggle = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleMouseEnter = (dropdown) => {
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const closeMobileMenu = () => {
    setOpenDropdown(null);
  };

  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Logo size={28} />
              <span className="text-sm sm:text-lg md:text-xl font-bold text-ink-dark">ACT Coaching For Life</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-gray-600 hover:text-brand-teal transition-colors cursor-pointer">
                Home
              </a>
              
              {/* Services Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-600 hover:text-brand-teal transition-colors"
                  onClick={() => handleDropdownToggle('services')}
                >
                  Services <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link 
                    href="/corporate" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Corporate Coaching
                  </Link>
                  <Link 
                    href="/group-coaching" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Group Coaching
                  </Link>
                  <Link 
                    href="/pricing" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Pricing
                  </Link>
                </div>
              </div>

              {/* Resources Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-600 hover:text-brand-teal transition-colors"
                  onClick={() => handleDropdownToggle('resources')}
                >
                  Resources <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link 
                    href="/blog" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Blog
                  </Link>
                  <Link 
                    href="/resources" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Resources Library
                  </Link>
                  <Link 
                    href="/press" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Press
                  </Link>
                </div>
              </div>

              {/* Company Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-600 hover:text-brand-teal transition-colors"
                  onClick={() => handleDropdownToggle('company')}
                >
                  Company <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link 
                    href="/about" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    About Us
                  </Link>
                  <Link 
                    href="/careers" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Careers
                  </Link>
                  <Link 
                    href="/contact" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand-teal"
                  >
                    Contact
                  </Link>
                </div>
              </div>

              <Link href="/help" className="text-gray-600 hover:text-brand-teal transition-colors">
                Help
              </Link>

              <Link href="/login">
                <Button variant="outline" className="border-brand-teal bg-white text-brand-teal hover:bg-brand-teal hover:text-white">
                  Login
                </Button>
              </Link>
              
              <a href="/">
                <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                  Get Started
                </Button>
              </a>
            </div>

            {/* Mobile menu button - Always accessible */}
            <div className="md:hidden">
              <button
                onClick={() => handleDropdownToggle('mobile')}
                className="text-gray-600 hover:text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 rounded-md p-2 active:bg-gray-100 transition-all"
                aria-label={openDropdown === 'mobile' ? 'Close menu' : 'Open menu'}
                aria-expanded={openDropdown === 'mobile'}
              >
                <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d={openDropdown === 'mobile' ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {openDropdown === 'mobile' && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-md border-b border-gray-200 shadow-lg pb-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto animate-slideDown">
              <a href="/" onClick={closeMobileMenu} className="block px-4 py-2.5 text-sm sm:text-base text-gray-600 hover:text-brand-teal hover:bg-gray-50 active:bg-gray-100">Home</a>
              
              <div className="px-4 py-2">
                <button
                  onClick={() => handleDropdownToggle('mobile-services')}
                  className="flex items-center w-full text-sm sm:text-base text-gray-600 hover:text-brand-teal py-0.5"
                >
                  Services <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${openDropdown === 'mobile-services' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-services' && (
                  <div className="ml-4 mt-2 space-y-1">
                    <Link href="/corporate" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Corporate Coaching</Link>
                    <Link href="/group-coaching" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Group Coaching</Link>
                    <Link href="/pricing" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Pricing</Link>
                  </div>
                )}
              </div>

              <div className="px-4 py-2">
                <button
                  onClick={() => handleDropdownToggle('mobile-resources')}
                  className="flex items-center w-full text-sm sm:text-base text-gray-600 hover:text-brand-teal py-0.5"
                >
                  Resources <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${openDropdown === 'mobile-resources' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-resources' && (
                  <div className="ml-4 mt-2 space-y-1">
                    <Link href="/blog" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Blog</Link>
                    <Link href="/resources" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Resources Library</Link>
                    <Link href="/press" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Press</Link>
                  </div>
                )}
              </div>

              <div className="px-4 py-2">
                <button
                  onClick={() => handleDropdownToggle('mobile-company')}
                  className="flex items-center w-full text-sm sm:text-base text-gray-600 hover:text-brand-teal py-0.5"
                >
                  Company <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${openDropdown === 'mobile-company' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-company' && (
                  <div className="ml-4 mt-2 space-y-1">
                    <Link href="/about" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">About Us</Link>
                    <Link href="/careers" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Careers</Link>
                    <Link href="/contact" onClick={closeMobileMenu} className="block py-1.5 text-xs sm:text-sm text-gray-600 hover:text-brand-teal active:text-brand-teal">Contact</Link>
                  </div>
                )}
              </div>

              <Link href="/help" onClick={closeMobileMenu} className="block px-4 py-2.5 text-sm sm:text-base text-gray-600 hover:text-brand-teal hover:bg-gray-50 active:bg-gray-100">Help</Link>
              
              <div className="px-4 py-2 space-y-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full bg-white border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
                    Login
                  </Button>
                </Link>
                <a href="/">
                  <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white">
                    Get Started
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavbarLandingPage;