import { useState, useEffect } from 'react';
import { resolveMediaUrl } from './mediaStorage';

export function useMediaUrl(path: string | null | undefined): { url: string; isLoading: boolean } {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    if (!path) {
      setUrl('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    resolveMediaUrl(path)
      .then((resolved) => {
        if (!isCancelled) {
          setUrl(resolved);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setUrl('');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [path]);

  return { url, isLoading };
}
