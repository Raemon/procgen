import '@/features/asset-library/worlds/nodes';
import { chunkExitsOf, CLOSED } from '@/features/asset-library/worlds/labyrinth/chunkExits';
import { roleOf, ROOM } from '@/features/asset-library/worlds/labyrinth/chunkRole';
import { roomGeometryOf } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import {
  LABYRINTH_NODE_TYPE,
  LABYRINTH_SEED_LABEL,
  labyrinthKnobsFrom,
} from '@/features/asset-library/worlds/labyrinth/labyrinthKnobs';
import { labelSeed } from '@/features/asset-library/worlds/random/labelSeed';
import { labyrinthCellOrigin, LABYRINTH_CELL_SIZE } from '@/features/asset-library/worlds/labyrinth/labyrinthLattice';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { infiniteLabyrinth } from '@/features/asset-library/worlds/presets/infiniteLabyrinth';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { isWalkableTile } from '@/features/game/tileWalkability';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { stepIsAllowed } from '@/features/game/sim/stepIsAllowed';

const state = sanitizePipeline(infiniteLabyrinth().state);
const wallOverride = Number(process.env.WALL ?? '');
const corridorOverride = Number(process.env.CORRIDOR ?? '');
for (const n of state.nodes) {
  if (n.type !== LABYRINTH_NODE_TYPE) continue;
  if (Number.isFinite(wallOverride) && wallOverride > 0) n.params.wall = wallOverride;
  if (Number.isFinite(corridorOverride) && corridorOverride > 0) n.params.corridor = corridorOverride;
}
const store = new PipelineStore(state);
const evaluator = new PipelineEvaluator(store);
const tileAssets = new TileAssets();
const sampler = new WorldSampler(store, evaluator, tileAssets);
const tileIsWalkable = (x: number, y: number) => isWalkableTile(tileAssets, sampler.tileAt(x, y));
const puzzles = new PuzzleWorld(store, tileIsWalkable);
const rules = {
  isWalkableAt: tileIsWalkable,
  clearTheWay: (x: number, y: number, dx: number, dy: number, mayPush: boolean) =>
    puzzles.clearTheWay(x, y, dx, dy, mayPush),
};

const node = state.nodes.find((n) => n.type === LABYRINTH_NODE_TYPE)!;
const knobs = labyrinthKnobsFrom(labelSeed(state.seed, node.id, LABYRINTH_SEED_LABEL), node.params);

function describe(x: number, y: number): string {
  const layout = puzzles.roomAt(x, y);
  const walkable = tileIsWalkable(x, y);
  const blocked = puzzles.blocksAt(x, y);
  return `(${x},${y}) tileWalkable=${walkable} puzzleBlocks=${blocked} room=${layout ? `${layout.roomX},${layout.roomY} kind=${layout.kindName}` : 'none'}`;
}

function gateOpenAt(x: number, y: number): string {
  const layout = puzzles.roomAt(x, y);
  if (!layout) return 'no-room';
  const gates = [...layout.gates.east, ...layout.gates.west, ...layout.gates.north, ...layout.gates.south];
  const here = gates.filter((g) => g.x === x && g.y === y);
  if (here.length === 0) return 'no-gate';
  return here.map((g) => `${g.id}:${puzzles.gateIsOpen(layout, g) ? 'OPEN' : 'closed'}`).join(' ');
}

let shown = 0;
outer: for (let cy = -3; cy <= 3; cy++) {
  for (let cx = -3; cx <= 3; cx++) {
    if (roleOf(cx, cy, knobs) !== ROOM) continue;
    const exits = chunkExitsOf(cx, cy, knobs);
    const geometry = roomGeometryOf(cx, cy, exits, knobs);
    for (const doorway of geometry.doorways) {
      const mid = doorway.gate[Math.floor(doorway.gate.length / 2)]!;
      const openState = gateOpenAt(mid.x, mid.y);
      if (!openState.includes('OPEN')) continue;
      const step =
        doorway.side === 'west' ? [1, 0] : doorway.side === 'east' ? [-1, 0] : doorway.side === 'north' ? [0, 1] : [0, -1];
      const outsideX = mid.x - step[0]! * 2;
      const outsideY = mid.y - step[1]! * 2;
      console.log(`\nroom (${cx},${cy}) ${doorway.side} doorway, gate mid (${mid.x},${mid.y}) [${openState}], walking inward from (${outsideX},${outsideY}):`);
      let px = outsideX;
      let py = outsideY;
      for (let i = 0; i < 5; i++) {
        console.log(`  ${describe(px, py)} gate=${gateOpenAt(px, py)}`);
        const nx = px + step[0]!;
        const ny = py + step[1]!;
        const allowed = stepIsAllowed(rules, nx, ny, step[0]!, step[1]!, true);
        console.log(`    step to (${nx},${ny}) allowed=${allowed} gateThere=${gateOpenAt(nx, ny)}`);
        if (!allowed) break;
        px = nx;
        py = ny;
      }
      shown++;
      if (shown >= 8) break outer;
    }
  }
}
console.log(`\nwall knob=${knobs.wall} cellSize=${LABYRINTH_CELL_SIZE} origin(0)=${labyrinthCellOrigin(0)} closed=${CLOSED}`);
