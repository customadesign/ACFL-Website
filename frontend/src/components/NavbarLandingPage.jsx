"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { ChevronDown } from "lucide-react";

const NavbarLandingPage = () => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownToggle = (dropdown) => {
    // If closing a mobile sub-dropdown, go back to 'mobile' instead of null
    if (openDropdown === dropdown && dropdown.startsWith('mobile-')) {
      setOpenDropdown('mobile');
    } else {
      setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    }
  };

  const handleMouseEnter = (dropdown) => {
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  return (
    <div>
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size={32} />
              <span className="text-xl font-bold text-ink-dark dark:text-white hidden lg:block ">ACT Coaching For Life</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal transition-colors cursor-pointer">
                Home
              </a>

              {/* Services Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal transition-colors"
                  onClick={() => handleDropdownToggle('services')}
                  onMouseEnter={() => handleMouseEnter('services')}
                >
                  Services <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {openDropdown === 'services' && (
                  <div
                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 transition-all duration-200"
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/corporate"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Corporate Coaching
                    </Link>
                    <Link
                      href="/group-coaching"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Group Coaching
                    </Link>
                    <Link
                      href="/individual-coaching"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Individual Coaching
                    </Link>
                    <Link
                      href="/pricing"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Pricing
                    </Link>
                  </div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal transition-colors"
                  onClick={() => handleDropdownToggle('resources')}
                  onMouseEnter={() => handleMouseEnter('resources')}
                >
                  Resources <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {openDropdown === 'resources' && (
                  <div
                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 transition-all duration-200"
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/blog"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Blog
                    </Link>
                    <Link
                      href="/resources"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Resources Library
                    </Link>
                    <Link
                      href="/press"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Press
                    </Link>
                  </div>
                )}
              </div>

              {/* Company Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal transition-colors"
                  onClick={() => handleDropdownToggle('company')}
                  onMouseEnter={() => handleMouseEnter('company')}
                >
                  Company <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {openDropdown === 'company' && (
                  <div
                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 transition-all duration-200"
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/about"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      About Us
                    </Link>
                    <Link
                      href="/careers"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Careers
                    </Link>
                    <Link
                      href="/contact"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-teal dark:hover:text-brand-teal"
                    >
                      Contact
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/help" className="text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal transition-colors">
                Help
              </Link>

              <div className="flex items-center gap-3 ml-4">
                <Link href="/login">
                  <Button variant="outline" className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-5 py-2.5 font-medium transition-all shadow-sm">
                    Login
                  </Button>
                </Link>

                <a href="/register/client">
                  <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg px-5 py-2.5 font-medium transition-all shadow-md hover:shadow-lg">
                    Register
                  </Button>
                </a>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => handleDropdownToggle('mobile')}
                className="text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d={openDropdown === 'mobile' ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {(openDropdown === 'mobile' || openDropdown?.startsWith('mobile-')) && (
            <div className="md:hidden pb-4">
              <a href="/" className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Home</a>

              <div className="px-4 py-2">
                <button
                  onClick={() => handleDropdownToggle('mobile-services')}
                  className="flex items-center w-full text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal"
                >
                  Services <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${openDropdown === 'mobile-services' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-services' && (
                  <div className="ml-4 mt-2">
                    <Link href="/corporate" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Corporate Coaching</Link>
                    <Link href="/group-coaching" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Group Coaching</Link>
                    <Link href="/individual-coaching" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Individual Coaching</Link>
                    <Link href="/pricing" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Pricing</Link>
                  </div>
                )}
              </div>

              <div className="px-4 py-2">
                <button
                  onClick={() => handleDropdownToggle('mobile-resources')}
                  className="flex items-center w-full text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal"
                >
                  Resources <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${openDropdown === 'mobile-resources' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-resources' && (
                  <div className="ml-4 mt-2">
                    <Link href="/blog" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Blog</Link>
                    <Link href="/resources" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Resources Library</Link>
                    <Link href="/press" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Press</Link>
                  </div>
                )}
              </div>

              <div className="px-4 py-2">
                <button
                  onClick={() => handleDropdownToggle('mobile-company')}
                  className="flex items-center w-full text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal"
                >
                  Company <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${openDropdown === 'mobile-company' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-company' && (
                  <div className="ml-4 mt-2">
                    <Link href="/about" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">About Us</Link>
                    <Link href="/careers" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Careers</Link>
                    <Link href="/contact" className="block py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Contact</Link>
                  </div>
                )}
              </div>

              <Link href="/help" className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-teal">Help</Link>

              <div className="px-4 py-2 flex flex-col gap-3 mt-2">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full bg-white dark:bg-transparent border-brand-teal dark:border-brand-teal text-brand-teal dark:text-brand-teal hover:bg-brand-teal hover:text-white dark:hover:bg-brand-teal dark:hover:text-white">
                    Login
                  </Button>
                </Link>
                <a href="/register/client" className="w-full">
                  <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white">
                    Register
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