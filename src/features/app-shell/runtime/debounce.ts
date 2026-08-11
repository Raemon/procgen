export interface DebouncedCall {
  schedule(): void;
  flushIfPending(): void;
}

export function debounce(fn: () => void, waitMs: number): DebouncedCall {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const runNow = () => {
    timer = null;
    fn();
  };
  return {
    schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(runNow, waitMs);
    },
    flushIfPending() {
      if (!timer) return;
      clearTimeout(timer);
      runNow();
    },
  };
}
