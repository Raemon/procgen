import { registerNodeType } from '../../nodeRegistry';
import type { WholeWorldSpec } from '../../nodeType';
import { hashLatticePoint } from '../../noise/hashLatticePoint';
import { fieldValue } from '../../values/chunkValues';

interface BuiltFieldValue {
  size: number;
  cells: Float32Array;
}

interface BuiltFieldData {
  size: number;
  cells: number[];
}

const CELLS_PER_MS = 20000;

const builtField: WholeWorldSpec<BuiltFieldValue> = {
  build: ({ seed, params, report }) => relaxedNoise(seed, params.size as number, params.passes as number, report),
  serialize: (value) => ({ size: value.size, cells: Array.from(value.cells) }) satisfies BuiltFieldData,
  parse: (data) => {
    const held = data as BuiltFieldData;
    return { size: held.size, cells: Float32Array.from(held.cells) };
  },
  estimateMs: (params) => ((params.size as number) ** 2 * (params.passes as number)) / CELLS_PER_MS,
};

registerNodeType({
  type: 'builtField',
  title: 'built field',
  category: 'examples',
  description:
    'A field computed for the whole world at once before any chunk is drawn: a square of relaxed noise, size tiles a side, centred on the origin and zero beyond it. The smallest whole-world node — copy it to start a generator that needs the whole world in hand.',
  whenToUse:
    'When a generator cannot be cut into chunks: a maze that has to be solved, a puzzle that has to be proven, anything whose every cell depends on every other. The server builds it once in the background and every client waits for the result instead of freezing.',
  inputs: {},
  params: {
    size: {
      kind: 'int',
      label: 'size',
      help: 'How many tiles a side the built square covers, centred on the origin.',
      min: 32,
      max: 512,
      default: 128,
    },
    passes: {
      kind: 'int',
      label: 'passes',
      help: 'How many smoothing passes the build runs over the noise; more passes make broader, slower hills.',
      min: 1,
      max: 64,
      default: 16,
    },
  },
  output: 'field',
  wholeWorld: builtField,
  generateChunk: (ctx) => {
    const field = ctx.newField();
    const built = ctx.built() as BuiltFieldValue | null;
    if (!built) return fieldValue(field);
    const half = Math.floor(built.size / 2);
    for (let y = 0; y < ctx.size; y++) {
      for (let x = 0; x < ctx.size; x++) {
        const column = ctx.originX + x + half;
        const row = ctx.originY + y + half;
        if (column < 0 || row < 0 || column >= built.size || row >= built.size) continue;
        field[y * ctx.size + x] = built.cells[row * built.size + column]!;
      }
    }
    return fieldValue(field);
  },
});

function relaxedNoise(
  seed: number,
  size: number,
  passes: number,
  report: (fraction: number, stage: string) => void,
): BuiltFieldValue {
  let cells: Float32Array = new Float32Array(size * size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      cells[row * size + column] = hashLatticePoint(column, row, seed);
    }
  }
  report(0, 'seeding noise');
  for (let pass = 0; pass < passes; pass++) {
    cells = relaxedOnce(cells, size);
    report((pass + 1) / passes, 'relaxing');
  }
  return { size, cells };
}

function relaxedOnce(cells: Float32Array, size: number): Float32Array {
  const next: Float32Array = new Float32Array(cells.length);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const here = cells[row * size + column]!;
      const left = cells[row * size + Math.max(0, column - 1)]!;
      const right = cells[row * size + Math.min(size - 1, column + 1)]!;
      const up = cells[Math.max(0, row - 1) * size + column]!;
      const down = cells[Math.min(size - 1, row + 1) * size + column]!;
      next[row * size + column] = (here + left + right + up + down) / 5;
    }
  }
  return next;
}
