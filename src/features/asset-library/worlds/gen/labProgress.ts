export function elapsedMsOf(startedAt: string, finishedAt: string | null, now: number): number {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) return 0;
  const end = finishedAt === null ? now : Date.parse(finishedAt);
  return Math.max(0, (Number.isFinite(end) ? end : now) - start);
}

export function msPerStepOf(done: number, elapsedMs: number): number | null {
  return done <= 0 || elapsedMs <= 0 ? null : elapsedMs / done;
}

export function etaSecondsOf(done: number, total: number, elapsedMs: number): number | null {
  const pace = msPerStepOf(done, elapsedMs);
  if (pace === null || done >= total) return null;
  return Math.round(((total - done) * pace) / 1000);
}

export function clockText(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  return minutes === 0 ? `${whole}s` : `${minutes}m ${String(whole % 60).padStart(2, '0')}s`;
}

export function progressShare(done: number, total: number): number {
  return total <= 0 ? 0 : Math.max(0, Math.min(1, done / total));
}
