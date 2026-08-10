import {
  LABYRINTH_NODE_TYPE,
  LABYRINTH_SEED_LABEL,
  labyrinthKnobsFrom,
  type LabyrinthKnobs,
} from '../../procgen/labyrinth/labyrinthKnobs';
import { labelSeed } from '../../procgen/random/labelSeed';
import type { ReadOnlyPipelineStore } from '../../frontend/readOnlyAssets';

export function puzzleKnobsFromPipeline(store: ReadOnlyPipelineStore): LabyrinthKnobs | null {
  const painted = store
    .nodes()
    .filter((candidate) => candidate.enabled && candidate.type === LABYRINTH_NODE_TYPE);
  const node = painted[painted.length - 1];
  if (!node) return null;
  return labyrinthKnobsFrom(labelSeed(store.seed(), node.id, LABYRINTH_SEED_LABEL), node.params);
}
