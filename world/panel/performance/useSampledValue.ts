import { useEffect, useState } from 'react';

export function useSampledValue<T>(read: () => T, intervalMs: number): T {
  const [value, setValue] = useState<T>(read);
  useEffect(() => {
    const timer = window.setInterval(() => setValue(read()), intervalMs);
    return () => window.clearInterval(timer);
  }, [read, intervalMs]);
  return value;
}
