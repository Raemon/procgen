export type RunningWorldKind = 'seed' | 'saved';

export interface RunningWorldRef {
  kind: RunningWorldKind;
  name: string;
}

export const NOTHING_RUNNING = null;

export function runningSeed(name: string): RunningWorldRef {
  return { kind: 'seed', name };
}

export function runningSavedWorld(name: string): RunningWorldRef {
  return { kind: 'saved', name };
}

export function sameRunningWorld(
  one: RunningWorldRef | null,
  other: RunningWorldRef | null,
): boolean {
  if (one === null || other === null) return one === other;
  return one.kind === other.kind && one.name === other.name;
}

export class RunningWorld {
  private readonly listeners = new Set<() => void>();

  constructor(private running: RunningWorldRef | null = NOTHING_RUNNING) {}

  ref(): RunningWorldRef | null {
    return this.running;
  }

  name(): string {
    return this.running?.name ?? '';
  }

  seedName(): string {
    return this.running?.kind === 'seed' ? this.running.name : '';
  }

  savedWorldName(): string {
    return this.running?.kind === 'saved' ? this.running.name : '';
  }

  run(next: RunningWorldRef | null): void {
    if (sameRunningWorld(next, this.running)) return;
    this.running = next;
    for (const listener of this.listeners) listener();
  }

  renameTo(name: string): void {
    if (!this.running) return;
    this.run({ kind: this.running.kind, name });
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }
}
