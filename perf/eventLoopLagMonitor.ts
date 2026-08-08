const SAMPLE_INTERVAL_MS = 500;

export class EventLoopLagMonitor {
  private timer: NodeJS.Timeout | null = null;
  private lagMs = 0;

  start(): void {
    if (this.timer !== null) return;
    let expectedAtMs = performance.now() + SAMPLE_INTERVAL_MS;
    this.timer = setInterval(() => {
      const nowMs = performance.now();
      this.lagMs = Math.max(0, nowMs - expectedAtMs);
      expectedAtMs = nowMs + SAMPLE_INTERVAL_MS;
    }, SAMPLE_INTERVAL_MS);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  latestLagMs(): number {
    return this.lagMs;
  }
}
