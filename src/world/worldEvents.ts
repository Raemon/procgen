export type WorldEvent = 'generated' | 'player-moved';

export class WorldEvents {
  private readonly listeners = new Map<WorldEvent, Set<() => void>>();

  on(event: WorldEvent, listener: () => void): void {
    const existing = this.listeners.get(event) ?? new Set<() => void>();
    existing.add(listener);
    this.listeners.set(event, existing);
  }

  emit(event: WorldEvent): void {
    for (const listener of this.listeners.get(event) ?? []) listener();
  }
}
