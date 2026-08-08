import {
  PUZZLE_LATTICE_LABEL,
  PUZZLE_ROOMS_NODE_TYPE,
  puzzleRoomKnobsFrom,
  type PuzzleRoomKnobs,
} from '../../procgen/nodes/puzzle/puzzleRoomKnobs';
import { labelSeed } from '../../procgen/random/labelSeed';
import type { ReadOnlyPipelineStore } from '../../frontend/readOnlyAssets';

export function puzzleKnobsFromPipeline(store: ReadOnlyPipelineStore): PuzzleRoomKnobs | null {
  const painted = store
    .nodes()
    .filter((candidate) => candidate.enabled && candidate.type === PUZZLE_ROOMS_NODE_TYPE);
  const node = painted[painted.length - 1];
  if (!node) return null;
  return puzzleRoomKnobsFrom(
    labelSeed(store.seed(), node.id, PUZZLE_LATTICE_LABEL),
    node.params,
  );
}
