import {
  LABYRINTH_NODE_TYPE,
  LABYRINTH_SEED_LABEL,
  labyrinthKnobsFrom,
  type LabyrinthKnobs,
} from '@/features/asset-library/worlds/labyrinth/labyrinthKnobs';
import { labelSeed } from '@/features/asset-library/worlds/random/labelSeed';
import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';

export function puzzleKnobsOfNode(store: ReadOnlyPipelineStore, nodeId: string): LabyrinthKnobs | null {
  const node = store.nodeById(nodeId);
  if (!node || !node.enabled || node.type !== LABYRINTH_NODE_TYPE) return null;
  return labyrinthKnobsFrom(labelSeed(store.seed(), node.id, LABYRINTH_SEED_LABEL), node.params);
}
