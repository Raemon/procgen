import type * as THREE from 'three';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { MarkerSource } from '../../markerSource';
import type { Cell } from '../../../worldRules';
import { GateMeshes, gateKeyAt } from '../gateMeshes';
import type { WorldAnimation } from './worldAnimations';

export const DOOR_OPENING_SECONDS = 0.55;

interface GateOpening {
  progress: number;
  target: number;
}

export function easedGateSlide(progress: number): number {
  const held = Math.min(1, Math.max(0, progress));
  return held * held * (3 - 2 * held);
}

export class DoorOpenings implements WorldAnimation {
  private readonly openings = new Map<string, GateOpening>();
  private readonly gates: GateMeshes;
  private held: number | null = null;

  constructor(root: THREE.Group, sampler: WorldSampler, markers: MarkerSource) {
    this.gates = new GateMeshes(root, sampler, markers);
  }

  showAround(centerX: number, centerY: number, radiusTiles: number): void {
    for (const gate of this.gates.standAround(centerX, centerY, radiusTiles)) {
      this.aimAt(gate.key, gate.openness);
    }
    this.forgetGatesThatLeft();
    this.slideEveryGrille();
  }

  open(cells: readonly Cell[]): void {
    for (const cell of cells) this.aimAt(gateKeyAt(cell.x, cell.y), 1);
  }

  advance(dtSeconds: number): void {
    const step = dtSeconds / DOOR_OPENING_SECONDS;
    for (const opening of this.openings.values()) opening.progress = steppedToward(opening, step);
    this.slideEveryGrille();
  }

  slideOf(key: string): number {
    if (this.held !== null) return easedGateSlide(this.held);
    return easedGateSlide(this.openings.get(key)?.progress ?? 0);
  }

  holdEveryGateAt(openness: number | null): void {
    this.held = openness;
  }

  invalidate(): void {
    this.gates.invalidate();
  }

  dispose(): void {
    this.openings.clear();
    this.gates.dispose();
  }

  private aimAt(key: string, openness: number): void {
    const target = Math.min(1, Math.max(0, openness));
    const known = this.openings.get(key);
    if (known) known.target = target;
    else this.openings.set(key, { progress: target, target });
  }

  private forgetGatesThatLeft(): void {
    const standing = this.gates.standingKeys();
    for (const key of [...this.openings.keys()]) if (!standing.has(key)) this.openings.delete(key);
  }

  private slideEveryGrille(): void {
    this.gates.slideEach((key) => this.slideOf(key));
  }
}

function steppedToward(opening: GateOpening, step: number): number {
  const gap = opening.target - opening.progress;
  if (Math.abs(gap) <= step) return opening.target;
  return opening.progress + Math.sign(gap) * step;
}
