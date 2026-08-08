const FRAME_WINDOW_MS = 1000;
const FRAMES_KEPT = 240;

export interface FrameStats {
  fps: number;
  averageFrameMs: number;
  worstFrameMs: number;
  sampleCount: number;
}

const frameEndMs: number[] = [];
let watchers = 0;
let animationFrame = 0;

export function watchFrameTimeline(): () => void {
  if (watchers++ === 0) startSampling();
  return () => {
    if (--watchers === 0) stopSampling();
  };
}

export function recentFrameStats(): FrameStats {
  const durations = frameDurationsInsideWindow();
  if (durations.length === 0) return { fps: 0, averageFrameMs: 0, worstFrameMs: 0, sampleCount: 0 };
  const totalMs = durations.reduce((sum, ms) => sum + ms, 0);
  return {
    fps: (durations.length * 1000) / totalMs,
    averageFrameMs: totalMs / durations.length,
    worstFrameMs: Math.max(...durations),
    sampleCount: durations.length,
  };
}

function frameDurationsInsideWindow(): number[] {
  const oldestKept = performance.now() - FRAME_WINDOW_MS;
  const durations: number[] = [];
  for (let index = 1; index < frameEndMs.length; index++) {
    if (frameEndMs[index]! < oldestKept) continue;
    durations.push(frameEndMs[index]! - frameEndMs[index - 1]!);
  }
  return durations;
}

function startSampling(): void {
  frameEndMs.length = 0;
  animationFrame = requestAnimationFrame(onFrame);
}

function stopSampling(): void {
  cancelAnimationFrame(animationFrame);
}

function onFrame(nowMs: number): void {
  animationFrame = requestAnimationFrame(onFrame);
  frameEndMs.push(nowMs);
  if (frameEndMs.length > FRAMES_KEPT) frameEndMs.shift();
}
