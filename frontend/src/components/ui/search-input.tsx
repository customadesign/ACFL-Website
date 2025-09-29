import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isLoading?: boolean;
  className?: string;
  onSubmit?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  isLoading = false,
  className = '',
  onSubmit,
  autoFocus = false,
  disabled = false,
  size = 'md'
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [internalValue, onChange, debounceMs, value]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit(internalValue);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'h-8',
      input: 'text-xs py-1.5 pl-8 pr-8',
      icon: 'w-3 h-3 left-2.5 top-2',
      clearButton: 'w-3 h-3 right-2.5 top-2'
    },
    md: {
      container: 'h-10',
      input: 'text-sm py-2.5 pl-10 pr-10',
      icon: 'w-4 h-4 left-3 top-3',
      clearButton: 'w-4 h-4 right-3 top-3'
    },
    lg: {
      container: 'h-12',
      input: 'text-base py-3 pl-12 pr-12',
      icon: 'w-5 h-5 left-3.5 top-3.5',
      clearButton: 'w-5 h-5 right-3.5 top-3.5'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative ${config.container} ${className}`}>
      {/* Search icon */}
      <div className={`absolute ${config.icon} pointer-events-none`}>
        {isLoading ? (
          <Loader2 className="w-full h-full animate-spin text-gray-400 dark:text-gray-500" />
        ) : (
          <Search className="w-full h-full text-gray-400 dark:text-gray-500" />
        )}
      </div>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full ${config.input}
          border border-gray-300 dark:border-gray-600
          rounded-lg
          bg-white dark:bg-gray-700
          text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${disabled ? 'bg-gray-50 dark:bg-gray-800' : ''}
        `}
        aria-label={placeholder}
      />

      {/* Clear button */}
      {internalValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={`
            absolute ${config.clearButton}
            text-gray-400 dark:text-gray-500
            hover:text-gray-600 dark:hover:text-gray-300
            focus:outline-none focus:text-gray-600 dark:focus:text-gray-300
            transition-colors duration-200
            rounded-full
            hover:bg-gray-100 dark:hover:bg-gray-600
            p-0.5
          `}
          aria-label="Clear search"
          tabIndex={-1}
        >
          <X className="w-full h-full" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;