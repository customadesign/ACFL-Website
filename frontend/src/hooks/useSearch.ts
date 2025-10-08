import { useState, useEffect, useCallback } from 'react';

interface UseSearchOptions {
  debounceMs?: number;
  minLength?: number;
  onSearch?: (query: string) => void;
}

interface UseSearchReturn {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  clearSearch: () => void;
  hasQuery: boolean;
}

export function useSearch({
  debounceMs = 300,
  minLength = 0,
  onSearch
}: UseSearchOptions = {}): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search query
  useEffect(() => {
    setIsSearching(true);

    const timer = setTimeout(() => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length >= minLength) {
        setDebouncedQuery(trimmedQuery);
        if (onSearch) {
          onSearch(trimmedQuery);
        }
      } else {
        setDebouncedQuery('');
        if (onSearch) {
          onSearch('');
        }
      }

      setIsSearching(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [query, debounceMs, minLength, onSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  const hasQuery = query.trim().length > 0;

  return {
    query,
    debouncedQuery,
    setQuery,
    isSearching,
    clearSearch,
    hasQuery
  };
}

export default useSearch;