'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
  { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬' },
  { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯' },
  { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲' },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫' },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿' },
  { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾' },
  { code: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪' },
  { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮' },
  { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷' },
  { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸' },
  { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', flag: '🇧🇦' },
  { code: 'MK', name: 'North Macedonia', dialCode: '+389', flag: '🇲🇰' },
  { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱' },
  { code: 'XK', name: 'Kosovo', dialCode: '+383', flag: '🇽🇰' },
];

export function PhoneInput({ value, onChange, error, placeholder, className }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter countries based on search term
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  // Format phone number based on country
  const formatPhoneNumber = (input: string, country: Country) => {
    // Remove all non-digit characters except +
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // If input starts with country code, use it as is
    if (cleaned.startsWith(country.dialCode)) {
      return cleaned;
    }
    
    // If input starts with +, use it as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Otherwise, prepend country code
    return country.dialCode + cleaned;
  };

  // Format phone number with spacing based on country
  const formatPhoneNumberWithSpacing = (digits: string, country: Country) => {
    if (digits.length === 0) return '';
    
    // Format based on country patterns
    if (country.code === 'US' || country.code === 'CA') {
      // US/Canada format: (555) 123-4567
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return ' (' + digits.slice(0, 3) + ') ' + digits.slice(3);
      } else {
        return ' (' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
      }
    } else if (country.code === 'GB') {
      // UK format: 20 7946 0958
      if (digits.length <= 4) {
        return ' ' + digits;
      } else if (digits.length <= 8) {
        return ' ' + digits.slice(0, 4) + ' ' + digits.slice(4);
      } else {
        return ' ' + digits.slice(0, 4) + ' ' + digits.slice(4, 8) + ' ' + digits.slice(8, 12);
      }
    }
    
    // Default formatting for other countries: add spaces every 3-4 digits
    if (digits.length <= 4) {
      return ' ' + digits;
    } else if (digits.length <= 7) {
      return ' ' + digits.slice(0, 4) + ' ' + digits.slice(4);
    } else {
      return ' ' + digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7, 11);
    }
  };

  const handlePhoneChange = (input: string) => {
    // If the input is just the country code, don't add anything
    if (input === selectedCountry.dialCode) {
      onChange(input);
      return;
    }
    
    // If input is shorter than country code, it's invalid
    if (input.length < selectedCountry.dialCode.length) {
      onChange(selectedCountry.dialCode);
      return;
    }
    
    // If input starts with country code, format the rest
    if (input.startsWith(selectedCountry.dialCode)) {
      const numberPart = input.slice(selectedCountry.dialCode.length);
      const digits = numberPart.replace(/\D/g, '');
      
      if (digits.length === 0) {
        onChange(selectedCountry.dialCode);
      } else {
        const formatted = formatPhoneNumberWithSpacing(digits, selectedCountry);
        onChange(selectedCountry.dialCode + formatted);
      }
      return;
    }
    
    // If input doesn't start with country code, assume user is typing the number part
    const digits = input.replace(/\D/g, '');
    const formatted = formatPhoneNumberWithSpacing(digits, selectedCountry);
    onChange(selectedCountry.dialCode + formatted);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm('');
    
    // Reformat current phone number with new country code
    if (value && value.length > selectedCountry.dialCode.length) {
      const currentNumber = value.slice(selectedCountry.dialCode.length);
      const digits = currentNumber.replace(/\D/g, '');
      const newFormatted = country.dialCode + formatPhoneNumberWithSpacing(digits, country);
      onChange(newFormatted);
    } else {
      // If no number part, just set the new country code
      onChange(country.dialCode);
    }
  };

  // Auto-detect country from existing value
  useEffect(() => {
    if (value && value.startsWith('+')) {
      // Try to find matching country
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.country-selector')) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <div className="relative country-selector">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-r-none border-r-0 h-10 px-3 flex items-center gap-2 min-w-[120px]"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* Country Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 z-50 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search countries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{country.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{country.dialCode}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Input */}
        <Input
          type="tel"
          value={value.startsWith(selectedCountry.dialCode) ? value.slice(selectedCountry.dialCode.length) : ''}
          onChange={(e) => handlePhoneChange(selectedCountry.dialCode + e.target.value)}
          placeholder={placeholder || "Enter phone number"}
          className="rounded-l-none h-10 flex-1"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-1">
        Select your country and enter your phone number
      </p>
    </div>
  );
}
