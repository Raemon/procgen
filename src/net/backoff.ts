const MIN_MS = 500;
const MAX_MS = 16000;

export class Backoff {
  private current = MIN_MS;

  reset(): void {
    this.current = MIN_MS;
  }

  next(): number {
    const base = this.current;
    this.current = Math.min(MAX_MS, this.current * 2);
    const jitter = base * 0.25 * (Math.random() * 2 - 1);
    return Math.max(0, Math.round(base + jitter));
  }
}
