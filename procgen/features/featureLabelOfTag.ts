import { programNameOf } from '../assembly/buildingPrograms';
import type { NodeTypeDef } from '../nodeType';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { WorldPoint } from '../values/chunkValues';
import { PROGRAM, hasPointNumber, pointNumber } from '../values/pointData';

export function featureLabelOfTag(
  point: WorldPoint,
  node: NodeInstance,
  def: NodeTypeDef,
): string {
  if (hasPointNumber(point, PROGRAM)) return programNameOf(pointNumber(point, PROGRAM, 0));
  if (point.tag === node.id) return node.label || def.title;
  return point.tag;
}
