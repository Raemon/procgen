import { hashString } from '@/features/asset-library/worlds/random/hashString';
import { genomeAsJson, type WorldSeedGenome } from '@/features/asset-library/worlds/selfPlay/worldSeedGenome';

export type GenomeShooter = (genome: WorldSeedGenome) => Promise<string>;

export type WorldShotStatus = 'waiting' | 'shooting' | 'ready' | 'failed';

export interface WorldShot {
  status: WorldShotStatus;
  url: string | null;
  failure: string | null;
}

export function shotKeyOf(genome: WorldSeedGenome): string {
  return hashString(genomeAsJson(genome)).toString(36);
}

export class WorldShotQueue {
  private readonly shots = new Map<string, WorldShot>();
  private readonly waiting: { key: string; genome: WorldSeedGenome }[] = [];
  private readonly listeners = new Set<() => void>();
  private shooting = false;

  constructor(private readonly shoot: GenomeShooter) {}

  shotOf(genome: WorldSeedGenome): WorldShot | null {
    return this.shots.get(shotKeyOf(genome)) ?? null;
  }

  request(genome: WorldSeedGenome): WorldShot {
    const key = shotKeyOf(genome);
    const held = this.shots.get(key);
    if (held) return held;
    const waiting: WorldShot = { status: 'waiting', url: null, failure: null };
    this.shots.set(key, waiting);
    this.waiting.push({ key, genome });
    void this.shootTheNextOne();
    return waiting;
  }

  reshoot(genome: WorldSeedGenome): void {
    const held = this.shots.get(shotKeyOf(genome));
    if (held?.status === 'shooting' || held?.status === 'waiting') return;
    this.shots.delete(shotKeyOf(genome));
    this.request(genome);
  }

  waitingCount(): number {
    return this.waiting.length;
  }

  isShooting(): boolean {
    return this.shooting;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async shootTheNextOne(): Promise<void> {
    if (this.shooting) return;
    const next = this.waiting.shift();
    if (!next) return;
    this.shooting = true;
    this.settle(next.key, { status: 'shooting', url: null, failure: null });
    try {
      const url = await this.shoot(next.genome);
      this.settle(next.key, { status: 'ready', url, failure: null });
    } catch (thrown) {
      this.settle(next.key, { status: 'failed', url: null, failure: reasonOf(thrown) });
    }
    this.shooting = false;
    void this.shootTheNextOne();
  }

  private settle(key: string, shot: WorldShot): void {
    this.shots.set(key, shot);
    for (const listener of this.listeners) listener();
  }
}

function reasonOf(thrown: unknown): string {
  return thrown instanceof Error ? thrown.message : String(thrown);
}
