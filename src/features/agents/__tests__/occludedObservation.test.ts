import '@/features/asset-library/worlds/nodes';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { newTileWithId } from '@/features/asset-library/tiles/tileDef';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import {
  opaqueProbeFrom,
  SIGHT_BLOCKING_TILE_HEIGHT,
} from '@/features/asset-library/worlds/walkingSim/sightBlocking';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { buildObservation, type AgentObservation } from '../observation';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '@/features/game/vision/characterSight';

const MEADOW_TILE = 0;
const WALL_TILE = 1;
const HEDGE_TILE = 2;
const BENCH_TILE = 3;

const occlusionTiles = new TileAssets([
  { ...newTileWithId(MEADOW_TILE), name: 'meadow', symbol: '"', walkable: true, height: 1 },
  { ...newTileWithId(WALL_TILE), name: 'wall', symbol: '#', walkable: false, height: 2 },
  { ...newTileWithId(HEDGE_TILE), name: 'hedge', symbol: 'h', walkable: false, height: 1.9 },
  { ...newTileWithId(BENCH_TILE), name: 'bench', symbol: 'b', walkable: false, height: 0.5 },
]);

const WALL_STEPS_NORTH = 3;

export function checkOccludedObservation(check: CheckReporter): void {
  const facingNorth = { x: 0, y: 0, facing: 0 as const };
  const walled = buildObservation(wallToTheNorthOf(WALL_TILE), occlusionTiles, facingNorth, 'character');
  check('a wall twice your height stays visible, so you learn what is hiding the view', glyphAt(walled, 0, -WALL_STEPS_NORTH) === '#');
  check('every tile in the line behind that wall is withheld from the observation', pastTheWall(walled).every((glyph) => glyph === ' '));
  check('meadow beside the blocked line is still sent, so the wall hides a shadow and not a stripe', glyphAt(walled, 3, -WALL_STEPS_NORTH - 2) === '"');
  check('the blank legend now owns up to tall ground as a reason a tile is missing', walled.legend.some((entry) => entry.glyph === ' ' && entry.meaning.includes('hidden behind tall ground')));

  const hedged = buildObservation(wallToTheNorthOf(HEDGE_TILE), occlusionTiles, facingNorth, 'character');
  check('ground just under twice your height hides nothing, since you can look over it', pastTheWall(hedged).every((glyph) => glyph === '"'));
  const benched = buildObservation(wallToTheNorthOf(BENCH_TILE), occlusionTiles, facingNorth, 'character');
  check('a knee-high bench blocks the feet but never the view', pastTheWall(benched).every((glyph) => glyph === '"'));

  const godView = buildObservation(wallToTheNorthOf(WALL_TILE), occlusionTiles, facingNorth, 'god');
  check('god mode still reads past the wall, since it is an editor and not a pair of eyes', glyphAt(godView, 0, -WALL_STEPS_NORTH - 2) === '"');

  const markerBehind = buildObservation(markerBehindTheWall(), occlusionTiles, facingNorth, 'character');
  check('a marker standing behind the wall is withheld along with the ground it stands on', glyphAt(markerBehind, 0, -WALL_STEPS_NORTH - 2) === ' ');

  check('the agent api and the walking-sim tourist share one rule for what blocks sight', touristAgreesWallsBlockAndBenchesDoNot());
  check('the blocking height is exactly twice the player, as the docs promise', SIGHT_BLOCKING_TILE_HEIGHT === 2);
}

function wallToTheNorthOf(blockerTile: number): WorldSampler {
  return stubSampler((x, y) => (x === 0 && y === -WALL_STEPS_NORTH ? blockerTile : MEADOW_TILE));
}

function markerBehindTheWall(): WorldSampler {
  const ground = wallToTheNorthOf(WALL_TILE);
  const marker = { x: 0, y: -WALL_STEPS_NORTH - 2, glyph: 'M', color: '#ff4444', faceArt: null, tag: 'monster' };
  return { ...ground, markersIn: () => [marker] } as unknown as WorldSampler;
}

function stubSampler(tileAt: (x: number, y: number) => number): WorldSampler {
  return { tileAt, markersIn: () => [], itemSpawnsIn: () => [] } as unknown as WorldSampler;
}

function glyphAt(observation: AgentObservation, dx: number, dy: number): string {
  const center = Math.floor(observation.viewSize / 2);
  return observation.view[center + dy]![center + dx]!;
}

function pastTheWall(observation: AgentObservation): string[] {
  const behind: string[] = [];
  for (let steps = WALL_STEPS_NORTH + 1; steps <= DEFAULT_CHARACTER_SIGHT_RADIUS_TILES; steps++) {
    behind.push(glyphAt(observation, 0, -steps));
  }
  return behind;
}

function touristAgreesWallsBlockAndBenchesDoNot(): boolean {
  const isOpaqueAt = opaqueProbeFrom((x) => (x === 0 ? WALL_TILE : BENCH_TILE), occlusionTiles);
  return isOpaqueAt(0, 0) && !isOpaqueAt(1, 0);
}
