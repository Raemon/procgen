import { assetId } from '@/features/asset-library/asset';
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
import { glyphAt, meadowTileDef, MEADOW_TILE, stubSampler } from './observationTestKit';

const WALL_TILE = assetId<'tiles'>(1);
const HEDGE_TILE = assetId<'tiles'>(2);
const BENCH_TILE = assetId<'tiles'>(3);

const occlusionTiles = new TileAssets([
  meadowTileDef(),
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

  checkRidgesHideOnlyLowerGround(check);
}

const TOR_PROFILE = [0, 1, 2, 3, 4, 1, 1, 1, 1, 4];
const CREST_STEPS_NORTH = 4;

function checkRidgesHideOnlyLowerGround(check: CheckReporter): void {
  const facingNorth = { x: 0, y: 0, facing: 0 as const };
  const slope = buildObservation(meadowRisingNorth((steps) => steps), occlusionTiles, facingNorth, 'character');
  check('a slope climbing away from you stays visible the whole way up', northGlyphs(slope, 1, DEFAULT_CHARACTER_SIGHT_RADIUS_TILES).every((glyph) => glyph === '"'));

  const hill = buildObservation(meadowRisingNorth((steps) => TOR_PROFILE[steps] ?? 0), occlusionTiles, facingNorth, 'character');
  check('the crest of a hill 2+ above you is still sent, so you learn what blocks the view', glyphAt(hill, 0, -CREST_STEPS_NORTH) === '"');
  check('ground lower than the crest beyond it is withheld', glyphAt(hill, 0, -CREST_STEPS_NORTH - 2) === ' ');
  check('a far tor as high as the crest still shows past it', glyphAt(hill, 0, -9) === '"');
  check('the hollow past that tor is withheld again', glyphAt(hill, 0, -11) === ' ');
  check('god mode reads past every ridge, since it is an editor and not a pair of eyes', glyphAt(buildObservation(meadowRisingNorth((steps) => TOR_PROFILE[steps] ?? 0), occlusionTiles, facingNorth, 'god'), 0, -CREST_STEPS_NORTH - 2) === '"');
  check('the blank legend owns up to ridges as a reason a tile is missing', hill.legend.some((entry) => entry.glyph === ' ' && entry.meaning.includes('ridge')));

  const fromCrest = buildObservation(meadowRisingNorth((steps) => TOR_PROFILE[steps] ?? 0), occlusionTiles, { x: 0, y: -CREST_STEPS_NORTH, facing: 0 as const }, 'character');
  check('standing on the crest, the far slope below you is all in view', glyphAt(fromCrest, 0, -4) === '"' && glyphAt(fromCrest, 0, -7) === '"');

  const lowRise = buildObservation(meadowRisingNorth((steps) => Math.min(1.5, steps * 0.75)), occlusionTiles, facingNorth, 'character');
  check('ground rising less than twice your height hides nothing behind it', northGlyphs(lowRise, 1, DEFAULT_CHARACTER_SIGHT_RADIUS_TILES).every((glyph) => glyph === '"'));

  const crater = buildObservation(craterRimAround(), occlusionTiles, facingNorth, 'character');
  check('from inside a crater you see the bowl and its rim', glyphAt(crater, 0, -2) === '"' && glyphAt(crater, 0, -3) === '"');
  check('the world past the rim is withheld until you climb out', glyphAt(crater, 0, -5) === ' ' && glyphAt(crater, 3, -5) === ' ');
}

function meadowRisingNorth(elevationOfStepsNorth: (steps: number) => number): WorldSampler {
  return stubSampler(() => MEADOW_TILE, (_x, y) => (y <= 0 ? elevationOfStepsNorth(-y) : 0));
}

function craterRimAround(): WorldSampler {
  return stubSampler(() => MEADOW_TILE, (x, y) => (Math.max(Math.abs(x), Math.abs(y)) === 3 ? 3 : 0));
}

function northGlyphs(observation: AgentObservation, fromSteps: number, toSteps: number): string[] {
  const glyphs: string[] = [];
  for (let steps = fromSteps; steps <= toSteps; steps++) glyphs.push(glyphAt(observation, 0, -steps));
  return glyphs;
}

function wallToTheNorthOf(blockerTile: number): WorldSampler {
  return stubSampler((x, y) => (x === 0 && y === -WALL_STEPS_NORTH ? blockerTile : MEADOW_TILE));
}

function markerBehindTheWall(): WorldSampler {
  const marker = { x: 0, y: -WALL_STEPS_NORTH - 2, glyph: 'M', color: '#ff4444', faceArt: null, tag: 'monster' };
  return { ...wallToTheNorthOf(WALL_TILE), markersIn: () => [marker] } as unknown as WorldSampler;
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
