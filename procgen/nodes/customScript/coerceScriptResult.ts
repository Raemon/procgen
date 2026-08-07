import { CELLS_PER_CHUNK } from '../../chunk';
import {
  fieldValue,
  pointsValue,
  tilesValue,
  type ChunkValue,
  type ValueKind,
  type WorldPoint,
} from '../../values/chunkValues';

export function coerceScriptResult(raw: unknown, kind: ValueKind): ChunkValue {
  if (kind === 'field') return fieldValue(coerceCellArray(raw, Float32Array));
  if (kind === 'tiles') return tilesValue(coerceCellArray(raw, Int32Array));
  return pointsValue(coercePoints(raw));
}

function coerceCellArray<T extends Float32Array | Int32Array>(
  raw: unknown,
  ArrayType: { new (input: ArrayLike<number>): T },
): T {
  const unwrapped = unwrapChunkValue(raw);
  if (unwrapped instanceof ArrayType && unwrapped.length === CELLS_PER_CHUNK) return unwrapped;
  if (isCellSizedNumberArray(unwrapped)) return new ArrayType(unwrapped);
  throw new Error(`script must return an array of ${CELLS_PER_CHUNK} numbers (ctx.size * ctx.size)`);
}

function coercePoints(raw: unknown): WorldPoint[] {
  const unwrapped = unwrapChunkValue(raw);
  if (!Array.isArray(unwrapped)) throw new Error('script must return an array of {x, y} points');
  return unwrapped.map(coercePoint);
}

function coercePoint(candidate: unknown): WorldPoint {
  if (typeof candidate !== 'object' || candidate === null) {
    throw new Error('each point must be an object with numeric x and y');
  }
  const point = candidate as { x?: unknown; y?: unknown; tag?: unknown };
  if (typeof point.x !== 'number' || typeof point.y !== 'number') {
    throw new Error('each point must be an object with numeric x and y');
  }
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
    tag: typeof point.tag === 'string' ? point.tag : 'point',
  };
}

function unwrapChunkValue(raw: unknown): unknown {
  if (typeof raw === 'object' && raw !== null && 'kind' in raw) {
    const wrapped = raw as { field?: unknown; tiles?: unknown; points?: unknown };
    return wrapped.field ?? wrapped.tiles ?? wrapped.points ?? raw;
  }
  return raw;
}

function isCellSizedNumberArray(value: unknown): value is ArrayLike<number> {
  if (ArrayBuffer.isView(value)) {
    return (value as unknown as ArrayLike<number>).length === CELLS_PER_CHUNK;
  }
  return (
    Array.isArray(value) &&
    value.length === CELLS_PER_CHUNK &&
    value.every((cell) => typeof cell === 'number')
  );
}
