import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import type { TrainingSettings } from '../selfPlay/trainingRunner';
import { DEFAULT_RADIUS_CAP, DEFAULT_STEP_BUDGET, type GradeLimits } from './worldGrade';

export const LAB_LIMITS = {
  stepBudget: { lo: 50, hi: 5000, fallback: DEFAULT_STEP_BUDGET },
  radiusCap: { lo: 20, hi: 400, fallback: DEFAULT_RADIUS_CAP },
  count: { lo: 1, hi: 64, fallback: 8 },
  generations: { lo: 1, hi: 200, fallback: 20 },
  batchSize: { lo: 2, hi: 32, fallback: 8 },
  patience: { lo: 1, hi: 100, fallback: 12 },
  install: { lo: 1, hi: 20, fallback: 3 },
} as const;

export interface RollRequest {
  count: number;
  seed: number;
  limits: GradeLimits;
}

export function gradeLimitsOf(params: CommandParams): GradeLimits {
  return {
    stepBudget: clamped(params.step_budget, LAB_LIMITS.stepBudget),
    radiusCap: clamped(params.radius_cap, LAB_LIMITS.radiusCap),
    walkSeed: whole(params.walk_seed, 1),
  };
}

export function rollRequestOf(params: CommandParams): RollRequest {
  return {
    count: clamped(params.count, LAB_LIMITS.count),
    seed: whole(params.seed, arbitrarySeed()),
    limits: gradeLimitsOf(params),
  };
}

export function trainingSettingsOf(params: CommandParams): TrainingSettings {
  return {
    generations: clamped(params.generations, LAB_LIMITS.generations),
    batchSize: clamped(params.batch_size, LAB_LIMITS.batchSize),
    stepBudget: clamped(params.step_budget, LAB_LIMITS.stepBudget),
    radiusCap: clamped(params.radius_cap, LAB_LIMITS.radiusCap),
    seed: whole(params.seed, arbitrarySeed()),
    patience: clamped(params.patience, LAB_LIMITS.patience),
  };
}

export function installCountOf(params: CommandParams): number {
  return clamped(params.count, LAB_LIMITS.install);
}

export function installNamesOf(params: CommandParams): string[] {
  if (!Array.isArray(params.names)) return [];
  return params.names
    .filter((name): name is string => typeof name === 'string')
    .slice(0, LAB_LIMITS.install.hi);
}

function clamped(raw: unknown, band: { lo: number; hi: number; fallback: number }): number {
  const value = whole(raw, band.fallback);
  return Math.min(band.hi, Math.max(band.lo, value));
}

function whole(raw: unknown, fallback: number): number {
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function arbitrarySeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}
