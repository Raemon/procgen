export class CameraFocus {
  private followed: number | null = null;
  private readonly listeners = new Set<() => void>();

  followedId(): number | null {
    return this.followed;
  }

  follow(entityId: number): void {
    if (this.followed === entityId) return;
    this.followed = entityId;
    this.announce();
  }

  clear(): void {
    if (this.followed === null) return;
    this.followed = null;
    this.announce();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private announce(): void {
    for (const listener of this.listeners) listener();
  }
}
