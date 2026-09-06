import { createHash } from 'node:crypto';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { reportOffenders } from '@/features/app-shell/__tests__/reportOffenders';
import { tileBytes, worldFromState } from '@/features/asset-library/worlds/__tests__/pipelineWorldFixtures';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { infiniteLabyrinth } from '@/features/asset-library/worlds/seeds/infiniteLabyrinth';
import { puzzleKnobsOfNode } from '../puzzles/puzzleKnobsFromPipeline';
import { buildPuzzleRoom } from '../puzzles/rooms/buildPuzzleRoom';

const LABYRINTH_NODE_ID = 'n1';
const CHUNKS_PINNED = 1;
const ROOMS_PINNED: Array<[number, number]> = [[0, 0], [1, 0], [2, 1], [-3, 2], [5, -4]];
const PINNED_CHUNKS = 'e7f2664e319e8719';
const PINNED_ROOMS = '8ff9c86014d5af4f';

export function checkLabyrinthPins(check: CheckReporter): void {
  const { store, evaluator } = worldFromState(sanitizePipeline(infiniteLabyrinth().state));
  const chunks = createHash('sha256');
  for (let cy = -CHUNKS_PINNED; cy <= CHUNKS_PINNED; cy++) {
    for (let cx = -CHUNKS_PINNED; cx <= CHUNKS_PINNED; cx++) chunks.update(tileBytes(evaluator, LABYRINTH_NODE_ID, cx, cy));
  }
  const knobs = puzzleKnobsOfNode(store, LABYRINTH_NODE_ID);
  const rooms = createHash('sha256');
  for (const [roomX, roomY] of ROOMS_PINNED) rooms.update(JSON.stringify(knobs && buildPuzzleRoom(knobs, roomX, roomY)));
  const drifted = [
    ...pinDrift('chunks', chunks.digest('hex').slice(0, 16), PINNED_CHUNKS),
    ...pinDrift('rooms', rooms.digest('hex').slice(0, 16), PINNED_ROOMS),
  ];
  reportOffenders('pinned labyrinth bytes that moved', drifted);
  check('the infinite labyrinth still lays the same chunks and furnishes the same rooms for its shipped seed', drifted.length === 0);
}

function pinDrift(what: string, actual: string, pinned: string): string[] {
  return actual === pinned ? [] : [`${what} now hash to ${actual}, pinned ${pinned}`];
}
