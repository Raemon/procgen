import { assetId } from '@/features/asset-library/asset';
import '@/features/asset-library/worlds/nodes';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { newTileWithId } from '@/features/asset-library/tiles/tileDef';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { ExploredCells } from '@/features/game/vision/exploredCells';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '@/features/game/vision/characterSight';
import { KNOWLEDGE_GLYPHS, buildObservation, type AgentObservation } from '../observation';
import { observationText } from '../observationText';
import { glyphAt, meadowTileDef, MEADOW_TILE, stubSampler } from './observationTestKit';

const WALL_TILE = assetId<'tiles'>(1);
const WALL_STEPS_NORTH = 3;

const tiles = new TileAssets([
  meadowTileDef(),
  { ...newTileWithId(WALL_TILE), name: 'wall', symbol: '#', walkable: false, height: 2 },
]);

const AT_ORIGIN = { x: 0, y: 0, facing: 0 as const };

export function checkTopDownObservation(check: CheckReporter): void {
  checkSeesAllAround(check);
  checkWallsCastShadows(check);
  checkMemory(check);
}

function checkSeesAllAround(check: CheckReporter): void {
  const openMeadow = stubSampler(() => MEADOW_TILE);
  const topDown = buildObservation(openMeadow, tiles, AT_ORIGIN, 'topdown');
  const character = buildObservation(openMeadow, tiles, AT_ORIGIN, 'character');
  check(
    'top down sees the ground behind it, which the character view withholds',
    glyphAt(topDown, 0, 3) === '"' && glyphAt(character, 0, 3) === ' ',
  );
  check(
    'top down sees the same distance in every direction',
    ['"'].every(() =>
      [
        glyphAt(topDown, 0, -DEFAULT_CHARACTER_SIGHT_RADIUS_TILES),
        glyphAt(topDown, 0, DEFAULT_CHARACTER_SIGHT_RADIUS_TILES),
        glyphAt(topDown, -DEFAULT_CHARACTER_SIGHT_RADIUS_TILES, 0),
        glyphAt(topDown, DEFAULT_CHARACTER_SIGHT_RADIUS_TILES, 0),
      ].every((glyph) => glyph === '"'),
    ),
  );
  check(
    'the window is the character window, not the wider god one',
    topDown.viewSize === character.viewSize &&
      topDown.sightRadiusTiles === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES &&
      topDown.godViewSizeTiles === null,
  );
  check('facing is withheld, because it decides nothing about what is seen', topDown.facing === null);
}

function checkWallsCastShadows(check: CheckReporter): void {
  const walled = buildObservation(wallToTheNorth(), tiles, AT_ORIGIN, 'topdown');
  check('the wall itself is drawn, so you learn what casts the shadow', glyphAt(walled, 0, -WALL_STEPS_NORTH) === '#');
  check('the ground straight behind the wall lies in shadow', glyphAt(walled, 0, -WALL_STEPS_NORTH - 2) === ' ');
  check('ground beside the wall is untouched by its shadow', glyphAt(walled, 3, -WALL_STEPS_NORTH - 2) === '"');
}

function checkMemory(check: CheckReporter): void {
  const sampler = wallToTheNorth();
  const explored = new ExploredCells();
  const fromBehindTheWall = buildObservation(
    sampler,
    tiles,
    { x: 0, y: -WALL_STEPS_NORTH - 2, facing: 0 },
    'topdown',
    { explored },
  );
  check('with no memory yet, every tile of the first look is in sight or blank', !inSightRowsOf(fromBehindTheWall).join('').includes(KNOWLEDGE_GLYPHS.memory));

  const backAtTheOrigin = buildObservation(sampler, tiles, AT_ORIGIN, 'topdown', { explored });
  check(
    'ground seen from the far side is remembered once the wall stands between',
    knowledgeAt(backAtTheOrigin, 0, -WALL_STEPS_NORTH - 2) === KNOWLEDGE_GLYPHS.memory,
  );
  check(
    'remembered ground keeps its terrain glyph rather than going blank',
    glyphAt(backAtTheOrigin, 0, -WALL_STEPS_NORTH - 2) === '"',
  );
  check(
    'the tile you stand on reads as in sight, not as memory',
    knowledgeAt(backAtTheOrigin, 0, 0) === KNOWLEDGE_GLYPHS.sight,
  );
  check(
    'a corner of the grid neither look reached stays blank in both grids',
    knowledgeAt(backAtTheOrigin, 11, 11) === KNOWLEDGE_GLYPHS.hidden &&
      glyphAt(backAtTheOrigin, 11, 11) === ' ',
  );
  check(
    'the memory grid rides along with the text an agent reads',
    observationText(backAtTheOrigin).includes('what you know of each tile'),
  );

  const forgetful = buildObservation(sampler, tiles, AT_ORIGIN, 'topdown');
  check('an agent handed no memory remembers nothing', forgetful.inSight !== null && !inSightRowsOf(forgetful).join('').includes(KNOWLEDGE_GLYPHS.memory));

  const godView = buildObservation(sampler, tiles, AT_ORIGIN, 'god', { explored });
  const characterView = buildObservation(sampler, tiles, AT_ORIGIN, 'character', { explored });
  check('only top down carries a memory grid', godView.inSight === null && characterView.inSight === null);
}

function wallToTheNorth(): WorldSampler {
  return stubSampler((x, y) => (x === 0 && y === -WALL_STEPS_NORTH ? WALL_TILE : MEADOW_TILE));
}

function inSightRowsOf(observation: AgentObservation): string[] {
  return observation.inSight ?? [];
}

function knowledgeAt(observation: AgentObservation, dx: number, dy: number): string {
  const center = Math.floor(observation.viewSize / 2);
  return inSightRowsOf(observation)[center + dy]?.[center + dx] ?? '';
}
