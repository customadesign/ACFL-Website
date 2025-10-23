import Link from 'next/link';
import Logo from '@/components/Logo';
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Logo size={32} />
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-ink-dark mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">About</Link></li>
              <li><Link href="/careers" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Careers</Link></li>
              <li><Link href="/press" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Press</Link></li>
              <li><Link href="/blog" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Blog</Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-semibold text-ink-dark mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Help Center</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Contact</Link></li>
              <li><Link href="/resources" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Resources</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-ink-dark mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Privacy</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Terms</Link></li>
              <li><Link href="/privacy#cookies" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Cookies</Link></li>
            </ul>
          </div>

          {/* Subscribe Column */}
          <div>
            <h3 className="font-semibold text-ink-dark mb-4">Subscribe</h3>
            <p className="text-sm text-gray-600 mb-3">
              Get insights and updates on coaching strategies and mental wellness.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                className="text-sm h-9"
              />
              <Button
                size="sm"
                className="bg-brand-teal hover:bg-brand-teal/90 text-white px-4 h-9"
              >
                Submit
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              By subscribing, you agree to our{' '}
              <Link href="/privacy" className="text-brand-teal hover:underline">privacy policy</Link>
              {' '}and{' '}
              <Link href="/terms" className="text-brand-teal hover:underline">email terms</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm text-gray-600">
              © {currentYear} ACT Coaching For Life. All rights reserved.
            </div>

            {/* Bottom Links */}
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-brand-teal transition-colors">
                Privacy policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-brand-teal transition-colors">
                Terms of service
              </Link>
              <Link href="/privacy#cookies" className="text-gray-600 hover:text-brand-teal transition-colors">
                Cookie settings
              </Link>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-brand-teal transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-brand-teal transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-brand-teal transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-brand-teal transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-brand-teal transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
