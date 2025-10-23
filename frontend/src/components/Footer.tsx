import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Logo and Tagline - Takes 3 columns */}
          <div className="md:col-span-3">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Logo size={32} />
              <span className="text-lg font-bold text-ink-dark">ACT Coaching For Life</span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Transforming lives through personalized ACT coaching and evidence-based practice.
            </p>
          </div>

          {/* Services Column */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-ink-dark mb-3">Services</h3>
            <ul className="space-y-2">
              <li><Link href="/clients/search-coaches" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Find a Coach</Link></li>
              <li><Link href="/group-coaching" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Group Coaching</Link></li>
              <li><Link href="/corporate" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Corporate Programs</Link></li>
              <li><Link href="/resources" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-ink-dark mb-3">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-ink-dark mb-3">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Careers</Link></li>
              <li><Link href="/press" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Press</Link></li>
              <li><Link href="/blog" className="text-sm text-gray-600 hover:text-brand-teal transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Download App Column - Takes 3 columns */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-ink-dark mb-3">Download Our App</h3>
            <div className="space-y-3">
              {/* App Store Button */}
              <a href="#" className="block">
                <div className="bg-ink-dark rounded-lg px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">Download on the</div>
                    <div className="text-sm font-semibold text-white">App Store</div>
                  </div>
                </div>
              </a>

              {/* Google Play Button */}
              <a href="#" className="block">
                <div className="bg-ink-dark rounded-lg px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">Get it on</div>
                    <div className="text-sm font-semibold text-white">Google Play</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            © {currentYear} ACT Coaching For Life. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
