import { DEFAULT_PARAMS } from '../src/gen/genParams';
import { generate } from '../src/gen/generate';
import { PASS_NAMES } from '../src/gen/passes/passPipeline';
import { cameraRelativeStep } from '../src/input/cameraRelativeStep';
import { PLAYER_GLYPH, worldToAscii } from '../src/views/ascii/worldToAscii';
import { tilePlacementsByShape } from '../src/views/view3d/tilePlacements';
import { spawnPointForSeed } from '../src/world/spawnPoint';
import {
  blankCubeFaceArt,
  cloneCubeFaceArt,
  isCubeFaceArt,
  isEntirelyBlank,
} from '../src/world/tiles/tileFaceArt';
import { isWalkableTile } from '../src/world/tileWalkability';
import { Tileset } from '../src/world/tiles/tileset';
import { World } from '../src/world/world';

const tileset = new Tileset();
const failures: string[] = [];

function check(name: string, condition: boolean): void {
  if (!condition) failures.push(name);
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${name}`);
}

function gridSignature(seed: number, size = 32): string {
  const { grid } = generate({ ...DEFAULT_PARAMS, seed, size }, tileset);
  let signature = '';
  grid.forEach((_x, _y, tileId) => {
    signature += tileId;
  });
  return signature;
}

function tileCounts(seed: number): Map<number, number> {
  const { grid } = generate({ ...DEFAULT_PARAMS, seed, size: 48 }, tileset);
  const counts = new Map<number, number>();
  grid.forEach((_x, _y, tileId) => counts.set(tileId, (counts.get(tileId) ?? 0) + 1));
  return counts;
}

check('pipeline runs every pass in order', PASS_NAMES.length === 4);
check('same seed generates the same world', gridSignature(7) === gridSignature(7));
check('different seeds generate different worlds', gridSignature(7) !== gridSignature(8));

const { grid, elevation } = generate({ ...DEFAULT_PARAMS, size: 40 }, tileset);
check('world size is respected', grid.width === 40 && grid.height === 40);
check('elevation covers every cell', elevation.length === 40 * 40);
check(
  'elevation is normalized to [0, 1]',
  Math.min(...elevation) === 0 && Math.max(...elevation) === 1,
);

const counts = tileCounts(DEFAULT_PARAMS.seed);
check('every terrain role is placed', [0, 1, 2, 3, 4].every((id) => (counts.get(id) ?? 0) > 0));

const spawn = spawnPointForSeed(grid, DEFAULT_PARAMS.seed, (id) => isWalkableTile(tileset, id));
check('player spawns on a walkable tile', isWalkableTile(tileset, grid.get(spawn.x, spawn.y)));

const world = new World(tileset);
world.regenerate({ ...DEFAULT_PARAMS, size: 32 });
const ascii = worldToAscii(world, tileset).split('\n');
check('ascii view is one row per world row', ascii.length === 32 && ascii[0]!.length === 32);
check(
  'ascii view marks the player',
  ascii[world.playerY]![world.playerX] === PLAYER_GLYPH &&
    worldToAscii(world, tileset).split(PLAYER_GLYPH).length === 2,
);
world.playerX = 0;
world.playerY = 0;
check('steps off the grid are refused', !world.tryStep(-1, 0));
check('the player stays put after a refused step', world.playerX === 0 && world.playerY === 0);

const art = blankCubeFaceArt();
check('blank face art validates and counts as blank', isCubeFaceArt(art) && isEntirelyBlank(art));
art.top[0] = '#ff0000';
check('painting a pixel makes face art non-blank', !isEntirelyBlank(art));
check('cloned face art does not share pixel arrays', cloneCubeFaceArt(art).top !== art.top);
check('malformed face art is rejected', !isCubeFaceArt({ top: [], sides: [], bottom: [] }));

const grass = tileset.byRole('grass')!;
tileset.update(grass.id, { faceArt: art });
const shapes = tilePlacementsByShape(world.grid, tileset);
check('placements carry the tile face art', shapes.floors.some((p) => p.faceArt === art));
check('tiles without art stay flat-colored', shapes.floors.some((p) => p.faceArt === null));
tileset.update(grass.id, { faceArt: null });

check('forward faces north with the camera at north', String(cameraRelativeStep(0, 1, 0)) === '0,-1');
check('forward faces east with the camera turned right', String(cameraRelativeStep(1, 1, 0)) === '1,0');
check('strafing right of south faces west', String(cameraRelativeStep(2, 0, 1)) === '-1,0');

if (failures.length > 0) throw new Error(`${failures.length} check(s) failed: ${failures.join(', ')}`);
console.log('\nall checks passed');
