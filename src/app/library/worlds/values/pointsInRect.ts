import { chunkCoordOfCell } from '../chunk';
import type { PipelineEvaluator } from '../eval/evaluator';
import type { WorldPoint } from './chunkValues';
import { asPoints } from './valueAccess';

export interface WorldRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function pointsInRect(
  evaluator: PipelineEvaluator,
  nodeId: string,
  rect: WorldRect,
): WorldPoint[] {
  const inside: WorldPoint[] = [];
  for (let chunkY = chunkCoordOfCell(rect.minY); chunkY <= chunkCoordOfCell(rect.maxY); chunkY++) {
    for (let chunkX = chunkCoordOfCell(rect.minX); chunkX <= chunkCoordOfCell(rect.maxX); chunkX++) {
      collectChunkPoints(evaluator, nodeId, rect, chunkX, chunkY, inside);
    }
  }
  return inside;
}

function collectChunkPoints(
  evaluator: PipelineEvaluator,
  nodeId: string,
  rect: WorldRect,
  chunkX: number,
  chunkY: number,
  into: WorldPoint[],
): void {
  for (const point of asPoints(evaluator.valueFor(nodeId, chunkX, chunkY)) ?? []) {
    if (rectHoldsPoint(rect, point)) into.push(point);
  }
}

function rectHoldsPoint(rect: WorldRect, point: WorldPoint): boolean {
  return (
    point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY
  );
}
