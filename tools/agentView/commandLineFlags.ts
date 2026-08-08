export type CommandLineFlags = Map<string, string>;

export function commandLineFlags(argv: readonly string[]): CommandLineFlags {
  const flags: CommandLineFlags = new Map();
  for (const [index, token] of argv.entries()) {
    if (!token.startsWith('--')) continue;
    flags.set(token.slice(2), valueAfter(argv, index));
  }
  return flags;
}

function valueAfter(argv: readonly string[], index: number): string {
  const next = argv[index + 1];
  return next === undefined || next.startsWith('--') ? 'true' : next;
}

export function numberFlag(flags: CommandLineFlags, name: string, fallback: number): number {
  const parsed = Number(flags.get(name));
  if (flags.has(name) && !Number.isFinite(parsed)) throw new Error(`--${name} must be a number`);
  return flags.has(name) ? parsed : fallback;
}

export function optionalNumberFlag(flags: CommandLineFlags, name: string): number | null {
  return flags.has(name) ? numberFlag(flags, name, 0) : null;
}
