import { mkdirSync, writeFileSync } from 'node:fs';
import '../procgen/nodes';
import { tileIdOfVoxel } from '../procgen/structureOverlay/packedVoxel';
import { villageFixtureState } from './village/villageFixtureWorld';
import { worldFromPipelineState, type HeadlessWorld } from './headlessWorld';
import { pngBuffer, type RgbImage } from './png/writePng';
import { firstCenterOfNode, villageCenterNodes } from './village/villageSnapshot';

const SIDE = 128;
const SCALE = 4;

const world = worldFromPipelineState(villageFixtureState());
const centers = villageCenterNodes(world);
for (const [index, node] of centers.entries()) renderNode(world, node, index);

function renderNode(world: HeadlessWorld, node: (typeof centers)[number], index: number): void {
  const center = firstCenterOfNode(world, node, 12);
  if (!center) return;
  mkdirSync('dist', { recursive: true });
  const minX = center.x - SIDE / 2;
  const minY = center.y - SIDE / 2;
  const path = `dist/villageOverhead${index}.png`;
  writeFileSync(path, pngBuffer(overheadImage(world, minX, minY)));
  console.log(`${path} around ${center.x},${center.y} (${node.label || node.type})`);
}

function overheadImage(world: HeadlessWorld, minX: number, minY: number): RgbImage {
  return {
    width: SIDE * SCALE,
    height: SIDE * SCALE,
    pixelAt: (px, py) => cellColor(world, minX + Math.floor(px / SCALE), minY + Math.floor(py / SCALE)),
  };
}

function cellColor(world: HeadlessWorld, x: number, y: number): [number, number, number] {
  const column = world.sampler.packedVoxelColumnAt(x, y);
  const layers = column ? column.length : 0;
  const tileId = topTileAt(world, x, y);
  const tile = world.tileAssets.byId(tileId);
  const base = hexToRgb(tile ? tile.color : '#202020');
  return lift(base, layers);
}

function topTileAt(world: HeadlessWorld, x: number, y: number): number {
  const column = world.sampler.packedVoxelColumnAt(x, y);
  if (column && column.length > 0) return tileIdOfVoxel(column[column.length - 1]!);
  return world.sampler.tileAt(x, y);
}

function lift(base: [number, number, number], layers: number): [number, number, number] {
  const light = 1 + Math.min(0.5, layers * 0.09);
  return [channel(base[0] * light), channel(base[1] * light), channel(base[2] * light)];
}

function channel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const wide = clean.length === 3 ? [...clean].map((c) => c + c).join('') : clean;
  return [
    parseInt(wide.slice(0, 2), 16) || 32,
    parseInt(wide.slice(2, 4), 16) || 32,
    parseInt(wide.slice(4, 6), 16) || 32,
  ];
}
