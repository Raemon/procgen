import '../nodes';
import { defaultTileId, defaultTiles } from '@/features/asset-library/tiles/defaultTiles';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { PipelineState } from '../pipeline/pipelineState';
import { asField, asTiles } from '../values/valueAccess';
import { GORGE_RADIUS, sunkenLabyrinth } from '../seeds/sunkenLabyrinth';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fieldAt, fieldBytes, stateOfNodes, worldFromState } from './pipelineWorldFixtures';

const LEVEL_STEP = 0.5;
const WALK_CLIMB_LIMIT = 0.5;
const JUMP_CLIMB_LIMIT = 1;
const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

type Gorge = ReturnType<typeof worldFromState>;

function gorgeState(): PipelineState {
  return sanitizePipeline(sunkenLabyrinth().state);
}

const tileWalkable = new Map(defaultTiles().map((tile) => [tile.id, tile.walkable]));

function walkableAt(gorge: Gorge, x: number, y: number): boolean {
  const tile = gorge.sampler.tileAt(x, y);
  return tile === -1 || (tileWalkable.get(tile) ?? true);
}

function navLevelAt(gorge: Gorge, x: number, y: number): number {
  return Math.round(gorge.sampler.elevationAt(x, y) / LEVEL_STEP) * LEVEL_STEP;
}

export function checkSunkenLabyrinthInvariants(check: CheckReporter): void {
  const gorge = worldFromState(gorgeState());
  const again = worldFromState(gorgeState());
  check(
    'the sunken labyrinth regenerates identically from the same seed',
    fieldBytes(gorge.evaluator, 'ground', 0, 0) === fieldBytes(again.evaluator, 'ground', 0, 0) &&
      fieldBytes(gorge.evaluator, 'ground', 5, -3) === fieldBytes(again.evaluator, 'ground', 5, -3),
  );
  check('the gorge lies under open daylight', gorge.store.daylight() === 1);
  checkTheWaking(check, gorge);
  checkTheWalls(check, gorge);
  checkTheCrevasses(check, gorge);
  checkTheClimbOut(check, gorge);
  checkWallFieldMirrorsWallTiles(check);
}

function checkTheWaking(check: CheckReporter, gorge: Gorge): void {
  check(
    'you wake on open walkable ground, not inside a wall',
    walkableAt(gorge, 0, 0) && NEIGHBORS.every(([dx, dy]) => walkableAt(gorge, dx, dy)),
  );
  const wakeLevel = navLevelAt(gorge, 0, 0);
  const rim = navLevelAt(gorge, GORGE_RADIUS + 60, 0);
  check(
    'the waking clearing lies many jumps below the surface on the rim',
    wakeLevel <= 3 && rim - wakeLevel >= 6,
  );
}

function checkTheWalls(check: CheckReporter, gorge: Gorge): void {
  let towering = 0;
  for (let y = -80; y < 80 && towering === 0; y++) {
    for (let x = -80; x < 80; x++) {
      if (fieldAt(gorge.evaluator, 'standingWalls', x, y) !== 1) continue;
      const wall = navLevelAt(gorge, x, y);
      const overFloor = NEIGHBORS.some(([dx, dy]) => {
        const isFloor = fieldAt(gorge.evaluator, 'standingWalls', x + dx, y + dy) === 0;
        return isFloor && wall - navLevelAt(gorge, x + dx, y + dy) > JUMP_CLIMB_LIMIT;
      });
      if (overFloor) towering++;
    }
  }
  check('deep in the gorge the labyrinth walls stand taller than any jump', towering > 0);

  let survivingWallCells = 0;
  for (let angle = 0; angle < 64; angle++) {
    const radius = GORGE_RADIUS + 48 + (angle % 5) * 16;
    const x = Math.round(Math.cos((angle / 64) * 2 * Math.PI) * radius);
    const y = Math.round(Math.sin((angle / 64) * 2 * Math.PI) * radius);
    if (fieldAt(gorge.evaluator, 'standingWalls', x, y) > 0) survivingWallCells++;
  }
  check('past the rim the labyrinth is gone and the surface lies open', survivingWallCells === 0);
}

function checkTheCrevasses(check: CheckReporter, gorge: Gorge): void {
  const crevasseFloor = defaultTileId('forest loam');
  let seen = 0;
  let escapable = 0;
  let walkOut = 0;
  for (let y = -160; y < 160; y++) {
    for (let x = -160; x < 160; x++) {
      if (gorge.sampler.tileAt(x, y) !== crevasseFloor) continue;
      seen++;
      const floor = navLevelAt(gorge, x, y);
      const rises = NEIGHBORS.filter(([dx, dy]) => walkableAt(gorge, x + dx, y + dy)).map(
        ([dx, dy]) => navLevelAt(gorge, x + dx, y + dy) - floor,
      );
      if (rises.some((rise) => rise > WALK_CLIMB_LIMIT && rise <= JUMP_CLIMB_LIMIT)) escapable++;
      if (rises.every((rise) => rise <= WALK_CLIMB_LIMIT)) walkOut++;
    }
  }
  check('crevasses wind through the gorge in numbers', seen > 500);
  check(
    'nearly every crevasse cell can be jumped out of, and walking out is the exception',
    escapable / seen > 0.9 && walkOut / seen < 0.2,
  );
}

function checkTheClimbOut(check: CheckReporter, gorge: Gorge): void {
  const jumping = reachFromTheClearing(gorge, true);
  const walking = reachFromTheClearing(gorge, false);
  check('a player who jumps can climb all the way out of the gorge', jumping.escaped);
  check(
    'a player who never jumps stays trapped in the deep labyrinth',
    !walking.escaped && walking.maxRadius < GORGE_RADIUS / 2,
  );
}

function reachFromTheClearing(
  gorge: Gorge,
  withJump: boolean,
): { escaped: boolean; maxRadius: number } {
  const key = (x: number, y: number) => `${x},${y}`;
  const visited = new Set<string>([key(0, 0)]);
  let queue: [number, number][] = [[0, 0]];
  let maxRadius = 0;
  while (queue.length > 0 && visited.size < 400_000) {
    const next: [number, number][] = [];
    for (const [x, y] of queue) {
      const here = navLevelAt(gorge, x, y);
      for (const [dx, dy] of NEIGHBORS) {
        const moves: Array<[number, number, number]> = [[x + dx, y + dy, WALK_CLIMB_LIMIT]];
        if (withJump) moves.push([x + dx, y + dy, JUMP_CLIMB_LIMIT], [x + dx * 2, y + dy * 2, JUMP_CLIMB_LIMIT]);
        for (const [tx, ty, limit] of moves) {
          const k = key(tx, ty);
          if (visited.has(k) || !walkableAt(gorge, tx, ty)) continue;
          if (navLevelAt(gorge, tx, ty) - here > limit) continue;
          visited.add(k);
          next.push([tx, ty]);
          maxRadius = Math.max(maxRadius, Math.hypot(tx, ty));
          if (maxRadius > GORGE_RADIUS + 20) return { escaped: true, maxRadius };
        }
      }
    }
    queue = next;
  }
  return { escaped: false, maxRadius };
}

function checkWallFieldMirrorsWallTiles(check: CheckReporter): void {
  const knobs = {
    corridor: 3,
    wall: 2,
    mazeChunks: 2,
    carver: 0,
    braid: 0.2,
    doorsPerEdge: 1,
    rooms: 0.2,
    roomCells: 3,
  };
  const wallTile = defaultTileId('granite outcrop');
  const asTilesWorld = worldFromState(
    stateOfNodes([
      { id: 'm', type: 'mazeChunk', params: { ...knobs, wallTile, floorTile: defaultTileId('cobbled street') }, inputs: {} },
    ]),
  );
  const asFieldWorld = worldFromState(
    stateOfNodes([{ id: 'm', type: 'mazeWallField', params: knobs, inputs: {} }]),
  );
  const mirrors = [
    [0, 0],
    [1, -1],
    [-2, 3],
  ].every(([chunkX, chunkY]) => {
    const tiles = asTiles(asTilesWorld.evaluator.valueFor('m', chunkX!, chunkY!));
    const field = asField(asFieldWorld.evaluator.valueFor('m', chunkX!, chunkY!));
    if (!tiles || !field) return false;
    for (let i = 0; i < tiles.length; i++) {
      if ((field[i] === 1) !== (tiles[i] === wallTile)) return false;
    }
    return true;
  });
  check(
    'the wall field carves the same labyrinth as the labyrinth tile node given the same knobs',
    mirrors,
  );
}
