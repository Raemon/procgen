import {
  PUZZLE_ROOMS_NODE_TYPE,
  puzzleRoomKnobsFrom,
  type PuzzleRoomKnobs,
} from '../../procgen/nodes/puzzle/puzzleRoomKnobs';
import type { ReadOnlyPipelineStore } from '../../frontend/readOnlyLibraries';

export function puzzleKnobsFromPipeline(store: ReadOnlyPipelineStore): PuzzleRoomKnobs | null {
  const node = store
    .nodes()
    .find((candidate) => candidate.enabled && candidate.type === PUZZLE_ROOMS_NODE_TYPE);
  return node ? puzzleRoomKnobsFrom(store.seed(), node.params) : null;
}
