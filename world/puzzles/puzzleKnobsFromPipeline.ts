import {
  PUZZLE_LATTICE_LABEL,
  PUZZLE_ROOMS_NODE_TYPE,
  puzzleRoomKnobsFrom,
  type PuzzleRoomKnobs,
} from '../../procgen/nodes/puzzle/puzzleRoomKnobs';
import { labelSeed } from '../../procgen/random/labelSeed';
import type { ReadOnlyPipelineStore } from '../../frontend/readOnlyLibraries';

export function puzzleKnobsFromPipeline(store: ReadOnlyPipelineStore): PuzzleRoomKnobs | null {
  const node = store
    .nodes()
    .find((candidate) => candidate.enabled && candidate.type === PUZZLE_ROOMS_NODE_TYPE);
  if (!node) return null;
  return puzzleRoomKnobsFrom(
    labelSeed(store.seed(), node.id, PUZZLE_LATTICE_LABEL),
    node.params,
  );
}
