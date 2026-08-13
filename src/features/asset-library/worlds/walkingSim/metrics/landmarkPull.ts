import type { CellCharacterProbe } from '../cellCharacter';
import { cellFromKey } from '../cellGrid';
import type { OpaqueProbe } from '../sightBlocking';
import { meanOf, shareOf } from './meanOf';
import type { ShareTally } from './sceneryShares';

const RARE_ENOUGH_TO_BECKON = 0.06;

export interface LandmarkPull {
  landmarkStepShare: number;
  landmarkHoldSteps: number;
}

export interface BeaconProbes {
  characterAt: CellCharacterProbe;
  isOpaqueAt: OpaqueProbe;
  seenShares: ShareTally;
}

export function landmarkPull(
  farSeenPerStep: readonly string[][],
  probes: BeaconProbes,
): LandmarkPull {
  const beaconsPerStep = farSeenPerStep.map((keys) => beaconsAmong(keys, probes));
  return {
    landmarkStepShare: shareOf(
      beaconsPerStep.filter((beacons) => beacons.length > 0).length,
      beaconsPerStep.length,
    ),
    landmarkHoldSteps: meanOf(beaconHoldStreaks(beaconsPerStep)),
  };
}

function beaconsAmong(keys: readonly string[], probes: BeaconProbes): string[] {
  return keys.filter((key) => {
    const cell = cellFromKey(key);
    if (!probes.isOpaqueAt(cell.x, cell.y)) return false;
    return (probes.seenShares.get(probes.characterAt(cell.x, cell.y)) ?? 0) < RARE_ENOUGH_TO_BECKON;
  });
}

function beaconHoldStreaks(beaconsPerStep: readonly string[][]): number[] {
  const running = new Map<string, number>();
  const finished: number[] = [];
  for (const beacons of beaconsPerStep) {
    extendStreaks(running, finished, new Set(beacons));
  }
  finished.push(...running.values());
  return finished;
}

function extendStreaks(
  running: Map<string, number>,
  finished: number[],
  visible: ReadonlySet<string>,
): void {
  for (const [key, streak] of [...running]) {
    if (visible.has(key)) continue;
    finished.push(streak);
    running.delete(key);
  }
  for (const key of visible) running.set(key, (running.get(key) ?? 0) + 1);
}
