import { useState, useEffect, useCallback, type DependencyList } from 'react';
import { ApiError } from '../services/apiClient';

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Універсальний хук для GET-запитів: викликає fetcher при зміні deps,
// тримає data/loading/error і дає змогу примусово перезавантажити (refetch).
export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = []
): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then(result => {
        if (!cancelled) setData(result);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Не вдалося завантажити дані');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  useEffect(() => load(), [load]);

  const refetch = useCallback(() => setReloadToken(t => t + 1), []);

  return { data, loading, error, refetch };
}
