import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * Returns a debounced invalidator. Multiple realtime events arriving in
 * a short burst will coalesce into a single invalidation per query key.
 *
 * Behavior is equivalent to calling queryClient.invalidateQueries directly,
 * just delayed by `delay` ms (default 300).
 */
export function useDebouncedInvalidate(delay = 300) {
  const queryClient = useQueryClient();
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((id) => clearTimeout(id));
      t.clear();
    };
  }, []);

  return useCallback(
    (queryKey: QueryKey) => {
      const k = JSON.stringify(queryKey);
      const existing = timers.current.get(k);
      if (existing) clearTimeout(existing);
      const id = setTimeout(() => {
        timers.current.delete(k);
        queryClient.invalidateQueries({ queryKey });
      }, delay);
      timers.current.set(k, id);
    },
    [queryClient, delay]
  );
}
