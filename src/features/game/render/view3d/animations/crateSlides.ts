import * as THREE from 'three';
import { MAX_FACE_ART_SIZE } from '@/features/asset-library/tiles/tileFaceArt';
import { withTransparency } from '@/features/asset-library/tiles/inkColor';
import { WALKABLE_TILE_HEIGHT } from '@/features/asset-library/tiles/tileHeight';
import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import type { CratePush } from '../../../circuits/puzzleCues';
import type { Cell } from '../../../worldRules';
import type { MarkerSource } from '../../markerSource';
import { coplanarPullOf } from '../coplanarPull';
import { EVERY_FACE } from '../culling/visibleFaceMask';
import { TILE_HOP_SECONDS } from '../easedPoint';
import { sharedTileBoxGeometry } from '../sharedTileGeometries';
import { tileSurfaceMaterials } from '../tileSurfaces';
import type { CoveredCells } from './coveredCells';
import type { WorldAnimation } from './worldAnimations';

export const CRATE_SLIDE_SECONDS = TILE_HOP_SECONDS;
export const CRATE_DROP_SECONDS = 0.2;

const SHOVE_LANE = 'crate slide';
const RESISTED_SHARE = 0.22;
const RESISTED_TRAVEL = 0.06;
const SETTLE_NUDGE = 0.8;

export type CrateMaterials = (crate: Marker) => THREE.Material | THREE.Material[];

export interface CrateSlideDeps {
  crates: MarkerSource;
  covered: CoveredCells;
  elevationAt(x: number, y: number): number;
  crateMaterials?: CrateMaterials;
}

interface SlidingCrate {
  mesh: THREE.Mesh;
  push: CratePush;
  height: number;
  leaves: number;
  lands: number;
  elapsed: number;
  advanced: boolean;
  uncover: () => void;
}

export class CrateSlides implements WorldAnimation {
  private readonly sliding: SlidingCrate[] = [];
  private readonly crateMaterials: CrateMaterials;

  constructor(
    private readonly root: THREE.Group,
    private readonly deps: CrateSlideDeps,
  ) {
    this.crateMaterials = deps.crateMaterials ?? shovedCrateMaterials;
  }

  shove(pushes: readonly CratePush[]): void {
    for (const push of pushes) this.begin(push);
  }

  advance(dtSeconds: number): void {
    for (const crate of [...this.sliding]) {
      crate.advanced = true;
      crate.elapsed += dtSeconds;
      if (crate.elapsed >= travelSecondsOf(crate)) this.finish(crate);
      else carryAlongTheShove(crate);
    }
  }

  settle(): void {
    for (const crate of [...this.sliding]) if (crate.advanced) this.finish(crate);
  }

  dispose(): void {
    for (const crate of [...this.sliding]) this.finish(crate);
  }

  private begin(push: CratePush): void {
    this.finishAnythingSharingACellWith(push);
    const marker = tallestStandingMarkerAt(this.deps.crates, push.to);
    if (!marker?.standingHeight) return;
    this.sliding.push(this.shovedCrate(push, marker, marker.standingHeight));
  }

  private shovedCrate(push: CratePush, marker: Marker, height: number): SlidingCrate {
    const footprint = marker.footprint ?? 1;
    const mesh = new THREE.Mesh(
      sharedTileBoxGeometry(1, 1, 1, EVERY_FACE),
      this.crateMaterials(marker),
    );
    mesh.scale.set(footprint, height, footprint);
    this.root.add(mesh);
    const crate: SlidingCrate = {
      mesh,
      push,
      height,
      leaves: this.deps.elevationAt(push.from.x, push.from.y),
      lands: this.deps.elevationAt(push.to.x, push.to.y),
      elapsed: 0,
      advanced: false,
      uncover: this.deps.covered.cover(push.to, hidesAnythingStandingAsTallAs(height)),
    };
    carryAlongTheShove(crate);
    return crate;
  }

  private finishAnythingSharingACellWith(push: CratePush): void {
    for (const crate of [...this.sliding]) {
      if (sharesACell(crate.push, push)) this.finish(crate);
    }
  }

  private finish(crate: SlidingCrate): void {
    this.root.remove(crate.mesh);
    crate.uncover();
    this.sliding.splice(this.sliding.indexOf(crate), 1);
  }
}

export function shovedProgress(fraction: number): number {
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 1;
  if (fraction < RESISTED_SHARE) return RESISTED_TRAVEL * (fraction / RESISTED_SHARE) ** 3;
  const freed = (fraction - RESISTED_SHARE) / (1 - RESISTED_SHARE);
  return RESISTED_TRAVEL + (1 - RESISTED_TRAVEL) * nudgedToRest(freed);
}

function nudgedToRest(fraction: number): number {
  const left = 1 - fraction;
  return 1 - left ** 2 + SETTLE_NUDGE * fraction ** 2 * left;
}

function droppedProgress(fraction: number): number {
  return Math.min(1, Math.max(0, fraction)) ** 2;
}

function travelSecondsOf(crate: SlidingCrate): number {
  return CRATE_SLIDE_SECONDS + (crate.lands < crate.leaves ? CRATE_DROP_SECONDS : 0);
}

function carryAlongTheShove(crate: SlidingCrate): void {
  const along = shovedProgress(crate.elapsed / CRATE_SLIDE_SECONDS);
  const { from, to } = crate.push;
  crate.mesh.position.set(
    from.x + (to.x - from.x) * along + 0.5,
    shoveElevationOf(crate) + crate.height / 2,
    from.y + (to.y - from.y) * along + 0.5,
  );
}

function shoveElevationOf(crate: SlidingCrate): number {
  if (crate.lands >= crate.leaves) {
    return crate.leaves + (crate.lands - crate.leaves) * shovedProgress(crate.elapsed / CRATE_SLIDE_SECONDS);
  }
  const falling = (crate.elapsed - CRATE_SLIDE_SECONDS) / CRATE_DROP_SECONDS;
  return crate.leaves + (crate.lands - crate.leaves) * droppedProgress(falling);
}

function sharesACell(one: CratePush, other: CratePush): boolean {
  return [one.from, one.to].some((cell) =>
    [other.from, other.to].some((against) => cell.x === against.x && cell.y === against.y),
  );
}

function tallestStandingMarkerAt(crates: MarkerSource, cell: Cell): Marker | null {
  let tallest: Marker | null = null;
  for (const marker of crates.markersIn(cell.x, cell.y, cell.x, cell.y)) {
    if (!marker.standingHeight) continue;
    if (!tallest || marker.standingHeight > tallest.standingHeight!) tallest = marker;
  }
  return tallest;
}

function hidesAnythingStandingAsTallAs(height: number): (marker: Marker) => boolean {
  return (marker) => (marker.standingHeight ?? WALKABLE_TILE_HEIGHT) >= height;
}

function shovedCrateMaterials(crate: Marker): THREE.Material | THREE.Material[] {
  if (!crate.faceArt) {
    const material = new THREE.MeshLambertMaterial();
    material.color.set(crate.color);
    return material;
  }
  return tileSurfaceMaterials(
    {
      art: crate.faceArt,
      baseColor: withTransparency(crate.color, crate.seeThroughUnpaintedArt === true),
      glow: crate.glow ?? 0,
      drawnFromBothSides: false,
      pull: coplanarPullOf('marker', SHOVE_LANE),
    },
    MAX_FACE_ART_SIZE,
  );
}
