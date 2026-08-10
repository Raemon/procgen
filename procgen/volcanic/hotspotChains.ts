import { hashLatticePoint } from '../noise/hashLatticePoint';
import { VOLCANIC_ERA_SPAN } from '../time/worldTime';

const TAU = Math.PI * 2;
const CHAIN_SALT = 0x94d049bb;
const DRIFT_SALT = 0x2545f491;
const ID_SALT = 0x63d83595;
const HEIGHT_SALT = 0xb5297a4d;

export const YOUNGEST_ERUPTION = 50_000;
export const CONE_GROWTH_SPAN = 500_000;
export const MAX_CONE_RADIUS = 96;
const SMALLEST_GROWING_CONE = 0.35;

export interface HotspotChainSpec {
  spacing: number;
  driftRate: number;
  eruptionPeriod: number;
  coneRadius: number;
  coneHeight: number;
  chainFraction: number;
  seed: number;
}

export interface TileRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface VolcanoCone {
  x: number;
  y: number;
  born: number;
  chainId: number;
  radius: number;
  height: number;
}

interface ChainHead {
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  chainId: number;
}

export function conesPerChain(spec: HotspotChainSpec): number {
  return Math.floor(VOLCANIC_ERA_SPAN / spec.eruptionPeriod) + 1;
}

export function chainReach(spec: HotspotChainSpec): number {
  return spec.driftRate * VOLCANIC_ERA_SPAN + spec.coneRadius;
}

export function conesOverlapping(rect: TileRect, spec: HotspotChainSpec): VolcanoCone[] {
  const cones: VolcanoCone[] = [];
  const cells = Math.ceil(chainReach(spec) / spec.spacing) + 1;
  const lastX = Math.floor(rect.maxX / spec.spacing) + cells;
  const lastY = Math.floor(rect.maxY / spec.spacing) + cells;
  for (let cellY = Math.floor(rect.minY / spec.spacing) - cells; cellY <= lastY; cellY++) {
    for (let cellX = Math.floor(rect.minX / spec.spacing) - cells; cellX <= lastX; cellX++) {
      collectChainCones(cellX, cellY, rect, spec, cones);
    }
  }
  return cones;
}

function collectChainCones(
  cellX: number,
  cellY: number,
  rect: TileRect,
  spec: HotspotChainSpec,
  into: VolcanoCone[],
): void {
  if (hashLatticePoint(cellX, cellY, spec.seed ^ CHAIN_SALT) >= spec.chainFraction) return;
  const head = chainHeadOfCell(cellX, cellY, spec);
  for (let k = 0; k < conesPerChain(spec); k++) {
    const cone = coneOfChain(head, k, spec);
    if (isInsideRect(rect, cone)) into.push(cone);
  }
}

function chainHeadOfCell(cellX: number, cellY: number, spec: HotspotChainSpec): ChainHead {
  const angle = hashLatticePoint(cellX, cellY, spec.seed ^ DRIFT_SALT) * TAU;
  return {
    x: (cellX + hashLatticePoint(cellX, cellY, spec.seed)) * spec.spacing,
    y: (cellY + hashLatticePoint(cellX, cellY, spec.seed + 1)) * spec.spacing,
    driftX: Math.cos(angle),
    driftY: Math.sin(angle),
    chainId: chainIdOfCell(cellX, cellY, spec.seed),
  };
}

function chainIdOfCell(cellX: number, cellY: number, seed: number): number {
  const mixed = (Math.imul(cellX, 0x27d4eb2d) + Math.imul(cellY, 0x165667b1) + (seed ^ ID_SALT)) | 0;
  return Math.imul(mixed ^ (mixed >>> 15), 0x85ebca6b) >>> 1;
}

function coneOfChain(head: ChainHead, k: number, spec: HotspotChainSpec): VolcanoCone {
  const drifted = spec.driftRate * k * spec.eruptionPeriod;
  const born = -(k * spec.eruptionPeriod) - YOUNGEST_ERUPTION;
  return {
    x: Math.round(head.x + head.driftX * drifted),
    y: Math.round(head.y + head.driftY * drifted),
    born,
    chainId: head.chainId,
    radius: spec.coneRadius * grownFraction(born),
    height: spec.coneHeight * heightJitter(head.chainId, k, spec.seed),
  };
}

export function grownFraction(born: number): number {
  return Math.max(SMALLEST_GROWING_CONE, Math.min(1, -born / CONE_GROWTH_SPAN));
}

function heightJitter(chainId: number, k: number, seed: number): number {
  return 0.8 + hashLatticePoint(k, chainId, seed ^ HEIGHT_SALT) * 0.25;
}

function isInsideRect(rect: TileRect, cone: VolcanoCone): boolean {
  return cone.x >= rect.minX && cone.x < rect.maxX && cone.y >= rect.minY && cone.y < rect.maxY;
}
