import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // en milisegundos
  enabled?: boolean;
}

export const useAutoRefresh = (
  callback: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) => {
  const { interval = 30000, enabled = true } = options;
  const callbackRef = useRef(callback);

  // Mantener la referencia actualizada del callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, enabled]);
};

export default useAutoRefresh;
