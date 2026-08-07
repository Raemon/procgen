import type { FieldWindow } from '../../values/fieldWindow';

export interface ValleyCutSpec {
  depth: number;
  minFlow: number;
  valleyWidth: number;
}

export function channelStrengths(flow: FieldWindow, minFlow: number): Float32Array {
  const strengths = new Float32Array(flow.data.length);
  const span = Math.max(1e-6, 1 - minFlow);
  for (let i = 0; i < strengths.length; i++) {
    strengths[i] = Math.max(0, (flow.data[i]! - minFlow) / span);
  }
  return strengths;
}

export function taperWeights(valleyWidth: number): Float32Array {
  const side = valleyWidth * 2 + 1;
  const weights = new Float32Array(side * side);
  for (let dy = -valleyWidth; dy <= valleyWidth; dy++) {
    for (let dx = -valleyWidth; dx <= valleyWidth; dx++) {
      const taper = 1 - Math.hypot(dx, dy) / (valleyWidth + 1);
      weights[(dy + valleyWidth) * side + (dx + valleyWidth)] = Math.max(0, taper);
    }
  }
  return weights;
}

export function deepestCutAt(
  strengths: Float32Array,
  flow: FieldWindow,
  weights: Float32Array,
  spec: ValleyCutSpec,
  worldX: number,
  worldY: number,
): number {
  const centerX = worldX - flow.originX;
  const centerY = worldY - flow.originY;
  let deepest = 0;
  for (let dy = -spec.valleyWidth; dy <= spec.valleyWidth; dy++) {
    deepest = Math.max(deepest, deepestInRow(strengths, flow, weights, spec, centerX, centerY + dy, dy));
  }
  return deepest * spec.depth;
}

function deepestInRow(
  strengths: Float32Array,
  flow: FieldWindow,
  weights: Float32Array,
  spec: ValleyCutSpec,
  centerX: number,
  rowY: number,
  dy: number,
): number {
  if (rowY < 0 || rowY >= flow.height) return 0;
  const side = spec.valleyWidth * 2 + 1;
  let deepest = 0;
  for (let dx = -spec.valleyWidth; dx <= spec.valleyWidth; dx++) {
    const x = centerX + dx;
    if (x < 0 || x >= flow.width) continue;
    const weighted = strengths[rowY * flow.width + x]! * weights[(dy + spec.valleyWidth) * side + (dx + spec.valleyWidth)]!;
    if (weighted > deepest) deepest = weighted;
  }
  return deepest;
}
