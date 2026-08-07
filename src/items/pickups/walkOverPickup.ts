import type { PickupFeed } from './pickupFeed';
import { stowEverythingOnTile, type StowDeps } from './stowItems';

export class WalkOverPickup {
  private stowing = false;

  constructor(
    private readonly deps: StowDeps,
    private readonly feed: PickupFeed,
  ) {}

  onSteppedOnto(x: number, y: number): void {
    if (this.stowing) return;
    this.stowing = true;
    try {
      this.announce(stowEverythingOnTile(this.deps, x, y));
    } finally {
      this.stowing = false;
    }
  }

  private announce(outcome: { taken: string[]; refused: string[] }): void {
    for (const itemName of outcome.taken) this.feed.announceTaken(itemName);
    for (const hint of outcome.refused) this.feed.announceRefused(hint);
  }
}
