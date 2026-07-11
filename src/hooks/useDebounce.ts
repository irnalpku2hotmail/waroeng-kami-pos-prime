import { useEffect, useState } from 'react';

/**
 * Debounce any value. Returns a version of the value that only
 * updates after `delay` ms of no changes. Useful to avoid firing
 * a Supabase query on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;