export function debounce(fn: () => void, waitMs: number): () => void {
  let timer = 0;
  return () => {
    clearTimeout(timer);
    timer = window.setTimeout(fn, waitMs);
  };
}
