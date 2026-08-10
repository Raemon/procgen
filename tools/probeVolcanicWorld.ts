import '../procgen/nodes';
import { CHUNK_SIZE } from '../procgen/chunk';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { volcanicIslands } from '../procgen/presets/volcanicIslands';
import { PRESENT } from '../procgen/time/worldTime';
import type { WorldPoint } from '../procgen/values/chunkValues';
import { BORN, CHAIN_ID, CONE_HEIGHT, CONE_RADIUS, pointNumber } from '../procgen/values/pointData';
import { asField, asPoints } from '../procgen/values/valueAccess';
import { worldFromPipelineState } from './headlessWorld';

const TIMES = [-4_500_000, -2_500_000, -1_000_000, PRESENT];
const SEA_LEVEL = 0.45;
const ERUPTION_PERIOD = 500_000;
const MAP_COLS = 64;
const MAP_ROWS = 32;
const ZOOMS = [4, 16];
const COUNT_ZOOM = 4;

interface TimeCounts {
  time: number;
  cones: number;
  landCells: number;
  deposits: number;
}

const world = worldFromPipelineState(volcanicIslands().state as PipelineState);
const presentDeposits = depositsInWindow(COUNT_ZOOM);
const counts: TimeCounts[] = [];
for (const time of TIMES) {
  world.store.setTime(time);
  console.log(`\n==== time ${time.toLocaleString('en-US')} years ====`);
  for (const zoom of ZOOMS) renderMap(time, zoom);
  counts.push(countsAt(time));
}
reportCounts(counts);
reportChainNearestOrigin();

function renderMap(time: number, zoom: number): void {
  const volcanoes = volcanoesInWindow(zoom);
  const deposits = zoom === COUNT_ZOOM ? presentDeposits : [];
  console.log(`\n-- ${MAP_COLS * zoom}x${MAP_ROWS * zoom} tiles around origin, 1 char = ${zoom} tiles --`);
  for (let row = 0; row < MAP_ROWS; row++) console.log(mapRow(time, zoom, row, volcanoes, deposits));
}

function mapRow(
  time: number,
  zoom: number,
  row: number,
  volcanoes: WorldPoint[],
  deposits: WorldPoint[],
): string {
  let line = '';
  for (let col = 0; col < MAP_COLS; col++) {
    line += mapChar(time, zoom, col, row, volcanoes, deposits);
  }
  return line;
}

function mapChar(
  time: number,
  zoom: number,
  col: number,
  row: number,
  volcanoes: WorldPoint[],
  deposits: WorldPoint[],
): string {
  const cone = pointInCharCell(volcanoes, time, zoom, col, row);
  if (cone) return time - pointNumber(cone, BORN, 0) < ERUPTION_PERIOD ? 'V' : 'v';
  if (pointInCharCell(deposits, time, zoom, col, row)) return '$';
  const tileX = (col - MAP_COLS / 2) * zoom;
  const tileY = (row - MAP_ROWS / 2) * zoom;
  return fieldValueAt('terrain', tileX, tileY) >= SEA_LEVEL ? '#' : '.';
}

function pointInCharCell(
  points: WorldPoint[],
  time: number,
  zoom: number,
  col: number,
  row: number,
): WorldPoint | undefined {
  return points.find(
    (point) =>
      pointNumber(point, BORN, 0) <= time &&
      Math.floor(point.x / zoom) + MAP_COLS / 2 === col &&
      Math.floor(point.y / zoom) + MAP_ROWS / 2 === row,
  );
}

function fieldValueAt(nodeId: string, tileX: number, tileY: number): number {
  const cellX = tileX;
  const cellY = tileY;
  const chunkX = Math.floor(cellX / CHUNK_SIZE);
  const chunkY = Math.floor(cellY / CHUNK_SIZE);
  const field = asField(world.evaluator.valueFor(nodeId, chunkX, chunkY));
  const index = (cellY - chunkY * CHUNK_SIZE) * CHUNK_SIZE + (cellX - chunkX * CHUNK_SIZE);
  return field ? field[index]! : 0;
}

function pointsInWindowOf(nodeId: string, halfTilesX: number, halfTilesY: number): WorldPoint[] {
  const points: WorldPoint[] = [];
  const lastX = Math.floor((halfTilesX - 1) / CHUNK_SIZE);
  const lastY = Math.floor((halfTilesY - 1) / CHUNK_SIZE);
  for (let chunkY = Math.floor(-halfTilesY / CHUNK_SIZE); chunkY <= lastY; chunkY++) {
    for (let chunkX = Math.floor(-halfTilesX / CHUNK_SIZE); chunkX <= lastX; chunkX++) {
      points.push(...(asPoints(world.evaluator.valueFor(nodeId, chunkX, chunkY)) ?? []));
    }
  }
  return points;
}

function volcanoesInWindow(zoom: number): WorldPoint[] {
  return pointsInWindowOf('hotspots', (MAP_COLS / 2) * zoom, (MAP_ROWS / 2) * zoom);
}

function depositsInWindow(zoom: number): WorldPoint[] {
  return pointsInWindowOf('deposits', (MAP_COLS / 2) * zoom, (MAP_ROWS / 2) * zoom);
}

function countsAt(time: number): TimeCounts {
  const halfX = (MAP_COLS / 2) * COUNT_ZOOM;
  const halfY = (MAP_ROWS / 2) * COUNT_ZOOM;
  return {
    time,
    cones: bornByNow(pointsInWindowOf('hotspots', halfX, halfY), time).length,
    landCells: landCellsInWindow(),
    deposits: bornByNow(presentDeposits, time).length,
  };
}

function bornByNow(points: WorldPoint[], time: number): WorldPoint[] {
  return points.filter((point) => pointNumber(point, BORN, 0) <= time);
}

function landCellsInWindow(): number {
  let land = 0;
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tileX = (col - MAP_COLS / 2) * COUNT_ZOOM;
      const tileY = (row - MAP_ROWS / 2) * COUNT_ZOOM;
      if (fieldValueAt('terrain', tileX, tileY) >= SEA_LEVEL) land++;
    }
  }
  return land;
}

function reportCounts(all: TimeCounts[]): void {
  console.log('\n-- counts in the zoom-4 window, past to present; deposits are those standing today whose host cone was born --');
  console.log('  time            cones  land  deposits');
  for (const row of all) {
    console.log(`  ${String(row.time).padStart(10)}  ${String(row.cones).padStart(7)}  ${String(row.landCells).padStart(4)}  ${String(row.deposits).padStart(8)}`);
  }
  console.log(`  cones and deposits only ever appear: ${isMonotone(all) ? 'yes' : 'NO'}`);
  console.log('  land rises and falls, since islands drown as their cones erode');
}

function isMonotone(all: TimeCounts[]): boolean {
  return all.every(
    (row, i) =>
      i === 0 ||
      (row.cones >= all[i - 1]!.cones && row.deposits >= all[i - 1]!.deposits),
  );
}

function reportChainNearestOrigin(): void {
  world.store.setTime(PRESENT);
  const chain = chainNearestOrigin(pointsInWindowOf('hotspots', 1024, 1024));
  console.log(`\n-- chain ${chain.id} (nearest origin), head first --`);
  console.log('  born          x      y   dist from head  radius  height');
  for (const cone of chain.cones) console.log(chainRow(chain.cones[0]!, cone));
}

function chainRow(head: WorldPoint, cone: WorldPoint): string {
  const distance = Math.round(Math.hypot(cone.x - head.x, cone.y - head.y));
  return `  ${String(pointNumber(cone, BORN, 0)).padStart(10)}  ${String(cone.x).padStart(5)}  ${String(cone.y).padStart(5)}  ${String(distance).padStart(14)}  ${pointNumber(cone, CONE_RADIUS, 0).toFixed(1).padStart(6)}  ${pointNumber(cone, CONE_HEIGHT, 0).toFixed(2).padStart(6)}`;
}

function chainNearestOrigin(points: WorldPoint[]): { id: number; cones: WorldPoint[] } {
  const byChain = new Map<number, WorldPoint[]>();
  for (const point of points) {
    const id = pointNumber(point, CHAIN_ID, 0);
    byChain.set(id, [...(byChain.get(id) ?? []), point]);
  }
  const chains = [...byChain.entries()].map(([id, cones]) => ({ id, cones: byYoungestFirst(cones) }));
  return chains.sort((a, b) => headDistance(a.cones) - headDistance(b.cones))[0]!;
}

function byYoungestFirst(cones: WorldPoint[]): WorldPoint[] {
  return [...cones].sort((a, b) => pointNumber(b, BORN, 0) - pointNumber(a, BORN, 0));
}

function headDistance(cones: WorldPoint[]): number {
  const head = cones[0]!;
  return Math.hypot(head.x, head.y);
}
