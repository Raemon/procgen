export interface GeneratorOptions {
  seed: number;
  dry: boolean;
}

const DEFAULT_SEED = 0;
const DRY_FLAG = '--dry';

export function generatorOptionsOf(args: readonly string[]): GeneratorOptions {
  return { seed: seedOf(args), dry: args.includes(DRY_FLAG) };
}

function seedOf(args: readonly string[]): number {
  const given = args.find((arg) => !arg.startsWith('--'));
  const parsed = Number(given);
  return given !== undefined && Number.isFinite(parsed) ? Math.trunc(parsed) : DEFAULT_SEED;
}
