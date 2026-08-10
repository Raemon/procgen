export class RunningWorld {
  private readonly listeners = new Set<() => void>();

  constructor(private worldName = '') {}

  name(): string {
    return this.worldName;
  }

  setName(name: string): void {
    if (name === this.worldName) return;
    this.worldName = name;
    for (const listener of this.listeners) listener();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }
}
