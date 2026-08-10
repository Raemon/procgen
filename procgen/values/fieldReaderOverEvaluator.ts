import { CHUNK_SIZE, chunkCoordOfCell } from '../chunk';
import type { PipelineEvaluator } from '../eval/evaluator';
import { asField } from './valueAccess';

export function fieldReaderOverEvaluator(
  evaluator: PipelineEvaluator,
  nodeId: string,
): (x: number, y: number) => number | null {
  return (x, y) => {
    const field = asField(evaluator.valueFor(nodeId, chunkCoordOfCell(x), chunkCoordOfCell(y)));
    if (!field) return null;
    return field[cellIndexOf(x, y)] ?? null;
  };
}

function cellIndexOf(x: number, y: number): number {
  const localX = x - chunkCoordOfCell(x) * CHUNK_SIZE;
  const localY = y - chunkCoordOfCell(y) * CHUNK_SIZE;
  return localY * CHUNK_SIZE + localX;
}
