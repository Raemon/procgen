import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import {
  cachedTileIdProbe,
  walkableProbeFrom,
  type TileIdProbe,
  type WalkableProbe,
} from '../cachedWorldProbes';
import { stepsTaken, type ExplorationTrace, type WalkLimits } from '../explorationTrace';
import { exploreFromSpawn } from '../explorerWalk';
import { spawnNearOrigin } from '../spawnPoint';
import { deadEndRatio } from './deadEndRatio';
import { markerEncountersAlongPath, type MarkerEncounter } from './markerEncounters';
import { noveltySpread, noveltyTimeline, type NoveltyEvent } from './noveltyTimeline';
import { uniqueVisitedPerStep } from './pathMobility';
import { tileEntropyBits } from './tileVariety';
import { scoreWorld, type WorldMeasurements, type WorldScore } from './worldScore';

export interface WorldMeasurementResult {
  trace: ExplorationTrace;
  encounters: MarkerEncounter[];
  novelty: NoveltyEvent[];
  measurements: WorldMeasurements;
  score: WorldScore;
}

export function measureWorld(
  sampler: WorldSampler,
  tileAssets: TileAssets,
  limits: WalkLimits,
): WorldMeasurementResult | null {
  const tileIdAt = cachedTileIdProbe(sampler);
  const isWalkableAt = walkableProbeFrom(tileIdAt, tileAssets);
  const spawn = spawnNearOrigin(isWalkableAt);
  if (!spawn) return null;
  const trace = exploreFromSpawn(isWalkableAt, spawn, limits);
  return measuredTrace(sampler, trace, tileIdAt, isWalkableAt);
}

function measuredTrace(
  sampler: WorldSampler,
  trace: ExplorationTrace,
  tileIdAt: TileIdProbe,
  isWalkableAt: WalkableProbe,
): WorldMeasurementResult {
  const encounters = markerEncountersAlongPath(trace, sampler);
  const novelty = noveltyTimeline(trace, tileIdAt, encounters);
  const measurements = collectMeasurements(trace, tileIdAt, isWalkableAt, encounters, novelty);
  return { trace, encounters, novelty, measurements, score: scoreWorld(measurements) };
}

function collectMeasurements(
  trace: ExplorationTrace,
  tileIdAt: TileIdProbe,
  isWalkableAt: WalkableProbe,
  encounters: MarkerEncounter[],
  novelty: NoveltyEvent[],
): WorldMeasurements {
  return {
    uniqueCells: trace.visited.size,
    regionExhausted: trace.exhaustedRegion,
    mobility: uniqueVisitedPerStep(trace),
    deadEndRatio: deadEndRatio(trace, isWalkableAt),
    encountersPer100Cells: (encounters.length / trace.visited.size) * 100,
    tileEntropyBits: tileEntropyBits(trace, tileIdAt),
    noveltyCount: novelty.length,
    noveltySpread: noveltySpread(novelty, trace),
  };
}

export function measurementSummaryLine(result: WorldMeasurementResult): string {
  const m = result.measurements;
  return [
    `cells ${m.uniqueCells}`,
    `steps ${stepsTaken(result.trace)}`,
    `mobility ${m.mobility.toFixed(2)}`,
    `deadEnds ${m.deadEndRatio.toFixed(2)}`,
    `enc/100 ${m.encountersPer100Cells.toFixed(2)}`,
    `entropy ${m.tileEntropyBits.toFixed(2)}`,
    `novelty ${m.noveltyCount}@${m.noveltySpread.toFixed(2)}`,
  ].join('  ');
}
