import { measureWork } from '../../perf/workTimers';
import type { CreatureSim } from './creatureSim';

const MAX_TICK_SECONDS = 0.1;
const REDRAW_INTERVAL_SECONDS = 0.08;

export class CreatureClock {
  private running = true;
  private frame = 0;
  private lastFrameMs = 0;
  private sinceRedraw = 0;
  private readonly redrawListeners = new Set<() => void>();
  private readonly stateListeners = new Set<() => void>();

  constructor(private readonly sim: CreatureSim) {
    this.frame = requestAnimationFrame(this.onFrame);
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
  }

  isRunning(): boolean {
    return this.running;
  }

  setRunning(running: boolean): void {
    this.running = running;
    this.lastFrameMs = 0;
    for (const listener of this.stateListeners) listener();
  }

  onRedraw(listener: () => void): () => void {
    this.redrawListeners.add(listener);
    return () => this.redrawListeners.delete(listener);
  }

  onRunStateChange(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private onFrame = (nowMs: number): void => {
    this.frame = requestAnimationFrame(this.onFrame);
    const dtSeconds = this.elapsedSeconds(nowMs);
    if (!this.running || dtSeconds <= 0) return;
    measureWork('creature sim', () => this.sim.step(dtSeconds));
    this.requestRedrawAtInterval(dtSeconds);
  };

  private elapsedSeconds(nowMs: number): number {
    const previous = this.lastFrameMs;
    this.lastFrameMs = nowMs;
    if (previous === 0) return 0;
    return Math.min(MAX_TICK_SECONDS, (nowMs - previous) / 1000);
  }

  private requestRedrawAtInterval(dtSeconds: number): void {
    this.sinceRedraw += dtSeconds;
    if (this.sinceRedraw < REDRAW_INTERVAL_SECONDS) return;
    this.sinceRedraw = 0;
    for (const listener of this.redrawListeners) listener();
  }
}
