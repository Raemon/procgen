export class SlainCreatureSpawns {
  private readonly slain = new Set<string>();
  private readonly listeners = new Set<() => void>();

  isSlain(key: string): boolean {
    return this.slain.has(key);
  }

  slay(key: string): void {
    this.slain.add(key);
    for (const listener of this.listeners) listener();
  }

  forgetAll(): void {
    this.slain.clear();
    for (const listener of this.listeners) listener();
  }

  snapshot(): string[] {
    return [...this.slain];
  }

  replaceAll(keys: readonly string[]): void {
    this.slain.clear();
    for (const key of keys) if (typeof key === 'string' && key !== '') this.slain.add(key);
    for (const listener of this.listeners) listener();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }
}
