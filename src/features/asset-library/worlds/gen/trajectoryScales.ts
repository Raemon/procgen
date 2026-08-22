import type { GenerationRecord } from '../selfPlay/trainingRunner';

export interface ChartFrame {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
}

export interface TrajectoryPoint {
  generation: number;
  archiveBestFun: number;
  batchMeanFun: number;
  batchBestFun: number;
  coverage: number;
  admissions: number;
  generationsSinceGain: number;
}

export const CHART_FRAME: ChartFrame = {
  width: 720,
  height: 200,
  padLeft: 34,
  padRight: 10,
  padTop: 8,
  padBottom: 18,
};

export function trajectoryPointsOf(generations: readonly GenerationRecord[]): TrajectoryPoint[] {
  return generations.map((record) => ({
    generation: record.generation,
    archiveBestFun: record.archiveBestFun,
    batchMeanFun: record.batch.meanFun,
    batchBestFun: record.batch.bestFun,
    coverage: record.coverage,
    admissions: record.admissions,
    generationsSinceGain: record.generationsSinceGain,
  }));
}

export function plotWidth(frame: ChartFrame): number {
  return Math.max(1, frame.width - frame.padLeft - frame.padRight);
}

export function plotHeight(frame: ChartFrame): number {
  return Math.max(1, frame.height - frame.padTop - frame.padBottom);
}

export function xOfIndex(frame: ChartFrame, count: number, at: number): number {
  if (count <= 1) return frame.padLeft + plotWidth(frame) / 2;
  return frame.padLeft + (plotWidth(frame) * at) / (count - 1);
}

export function yOfShare(frame: ChartFrame, share: number): number {
  const held = Math.max(0, Math.min(1, share));
  return frame.padTop + plotHeight(frame) * (1 - held);
}

export function indexAtX(frame: ChartFrame, count: number, x: number): number {
  if (count <= 0) return -1;
  if (count === 1) return 0;
  const along = (x - frame.padLeft) / plotWidth(frame);
  return Math.max(0, Math.min(count - 1, Math.round(along * (count - 1))));
}

export function sharePath(frame: ChartFrame, shares: readonly number[]): string {
  return shares
    .map(
      (share, at) =>
        `${at === 0 ? 'M' : 'L'} ${xOfIndex(frame, shares.length, at).toFixed(2)} ${yOfShare(frame, share).toFixed(2)}`,
    )
    .join(' ');
}

export function barHeightOf(admissions: number, mostAdmissions: number, tallest: number): number {
  if (mostAdmissions <= 0 || admissions <= 0) return 0;
  return (tallest * Math.min(admissions, mostAdmissions)) / mostAdmissions;
}

export function patienceShare(generationsSinceGain: number, patience: number): number {
  if (patience <= 0) return 1;
  return Math.max(0, Math.min(1, generationsSinceGain / patience));
}
