import { tileIdOfVoxel } from '@/features/asset-library/worlds/structureOverlay/packedVoxel';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { RgbImage } from '../png/writePng';

export interface OverheadWorld {
  sampler: WorldSampler;
  tileAssets: TileAssets;
}

const SUN_X = -1;
const SUN_Y = -1;
const HILLSHADE_STRENGTH = 0.35;
const STRUCTURE_LIFT = 0.09;
const MARKER_RING = 2;

export interface OverheadFrame {
  centerX: number;
  centerY: number;
  side: number;
  scale: number;
}

export function overheadShot(world: OverheadWorld, frame: OverheadFrame): RgbImage {
  const minX = frame.centerX - frame.side / 2;
  const minY = frame.centerY - frame.side / 2;
  const markers = markerCells(world, minX, minY, frame.side);
  return {
    width: frame.side * frame.scale,
    height: frame.side * frame.scale,
    pixelAt: (px, py) => {
      const x = minX + Math.floor(px / frame.scale);
      const y = minY + Math.floor(py / frame.scale);
      return cellColor(world, x, y, markers);
    },
  };
}

function markerCells(
  world: OverheadWorld,
  minX: number,
  minY: number,
  side: number,
): Map<string, [number, number, number]> {
  const cells = new Map<string, [number, number, number]>();
  for (const marker of world.sampler.markersIn(minX, minY, minX + side, minY + side)) {
    const tint = hexToRgb(marker.color || '#ff4444');
    for (let dy = -MARKER_RING; dy <= MARKER_RING; dy++) {
      for (let dx = -MARKER_RING; dx <= MARKER_RING; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > MARKER_RING) continue;
        cells.set(`${Math.round(marker.x) + dx},${Math.round(marker.y) + dy}`, tint);
      }
    }
  }
  return cells;
}

function cellColor(
  world: OverheadWorld,
  x: number,
  y: number,
  markers: Map<string, [number, number, number]>,
): [number, number, number] {
  const marked = markers.get(`${x},${y}`);
  if (marked) return marked;
  const base = hexToRgb(topTileColor(world, x, y));
  const lit = hillshade(world, x, y) + structureLift(world, x, y);
  return [channel(base[0] * lit), channel(base[1] * lit), channel(base[2] * lit)];
}

function topTileColor(world: OverheadWorld, x: number, y: number): string {
  const column = world.sampler.packedVoxelColumnAt(x, y);
  const tileId =
    column && column.length > 0
      ? tileIdOfVoxel(column[column.length - 1]!)
      : world.sampler.tileAt(x, y);
  return world.tileAssets.byId(tileId)?.color ?? '#1c2022';
}

function hillshade(world: OverheadWorld, x: number, y: number): number {
  const here = world.sampler.elevationAt(x, y);
  const towardSun = world.sampler.elevationAt(x + SUN_X, y + SUN_Y);
  const slope = here - towardSun;
  return 1 + Math.max(-HILLSHADE_STRENGTH, Math.min(HILLSHADE_STRENGTH, slope * HILLSHADE_STRENGTH));
}

function structureLift(world: OverheadWorld, x: number, y: number): number {
  const column = world.sampler.packedVoxelColumnAt(x, y);
  return Math.min(0.4, (column ? column.length : 0) * STRUCTURE_LIFT);
}

function channel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const whole = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const packed = Number.parseInt(whole, 16);
  if (!Number.isFinite(packed)) return [32, 32, 32];
  return [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255];
}
