const HEIGHT_QUANTA = 1e7;
const INDEX_RANGE = 2 ** 25;

export function indicesByDescendingHeight(surface: Float32Array): Int32Array {
  const packed = new Float64Array(surface.length);
  for (let i = 0; i < surface.length; i++) packed[i] = packHeightAndIndex(surface[i]!, i);
  packed.sort();
  const order = new Int32Array(surface.length);
  for (let i = 0; i < order.length; i++) order[i] = packed[order.length - 1 - i]! % INDEX_RANGE;
  return order;
}

function packHeightAndIndex(height: number, index: number): number {
  return Math.round(Math.max(0, height) * HEIGHT_QUANTA) * INDEX_RANGE + index;
}
