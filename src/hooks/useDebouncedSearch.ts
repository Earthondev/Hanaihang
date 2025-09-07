import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
}

export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  options: UseDebouncedSearchOptions = {}
) {
  const { delay = 300, minLength = 2 } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < minLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const searchResults = await searchFn(searchQuery);
        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('เกิดข้อผิดพลาดในการค้นหา');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFn, delay, minLength]
  );

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
    
    // Cleanup on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  // Clear results when query is empty
  useEffect(() => {
    if (query.length === 0) {
      setResults([]);
      setLoading(false);
      setError(null);
    }
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => {
      setQuery('');
      setResults([]);
      setError(null);
    }
  };
}
