export interface DebouncedCall {
  schedule(): void;
  flushIfPending(): void;
}

export function debounce(fn: () => void, waitMs: number): DebouncedCall {
  let timer = 0;
  const runNow = () => {
    timer = 0;
    fn();
  };
  return {
    schedule() {
      clearTimeout(timer);
      timer = window.setTimeout(runNow, waitMs);
    },
    flushIfPending() {
      if (!timer) return;
      clearTimeout(timer);
      runNow();
    },
  };
}
