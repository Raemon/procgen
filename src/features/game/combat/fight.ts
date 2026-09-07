import type { Cell } from '../worldRules';
import type { StrikeOutcome } from './strikes';

export type FightEvent = 'creature-struck' | 'creature-slain' | 'player-struck' | 'player-downed';

export interface Blow {
  at: Cell;
  harm: number;
}

export interface PlayerBody {
  vigor(): number;
  strength(): number;
}

const CALM_BEFORE_MENDING_SECONDS = 6;
const SECONDS_PER_MENDED_POINT = 4;

export class Fight {
  private harmTaken = 0;
  private sinceLastBlow = CALM_BEFORE_MENDING_SECONDS;
  private mendingProgress = 0;
  private readonly harmToCreatures = new Map<string, number>();
  private readonly slain = new Set<string>();
  private readonly listeners = new Map<FightEvent, Set<(blow: Blow) => void>>();
  private readonly watchers = new Set<() => void>();

  constructor(private readonly body: PlayerBody) {}

  on(event: FightEvent, listener: (blow: Blow) => void): () => void {
    const existing = this.listeners.get(event) ?? new Set<(blow: Blow) => void>();
    existing.add(listener);
    this.listeners.set(event, existing);
    return () => existing.delete(listener);
  }

  subscribe(watcher: () => void): () => void {
    this.watchers.add(watcher);
    return () => this.watchers.delete(watcher);
  }

  playerVigor(): number {
    return Math.max(1, Math.round(this.body.vigor()));
  }

  playerStrength(): number {
    return Math.max(0, this.body.strength());
  }

  vigorLeft(): number {
    return Math.max(0, this.playerVigor() - this.harmTaken);
  }

  playerIsDown(): boolean {
    return this.vigorLeft() === 0;
  }

  strikePlayer(harm: number, at: Cell): void {
    if (harm <= 0 || this.playerIsDown()) return;
    this.harmTaken += harm;
    this.sinceLastBlow = 0;
    this.mendingProgress = 0;
    this.tellTheWatchers();
    this.emit('player-struck', { at, harm });
    if (this.playerIsDown()) this.emit('player-downed', { at, harm });
  }

  mendPlayer(): void {
    const wasHurt = this.harmTaken > 0;
    this.harmTaken = 0;
    this.mendingProgress = 0;
    this.sinceLastBlow = CALM_BEFORE_MENDING_SECONDS;
    if (wasHurt) this.tellTheWatchers();
  }

  recover(dtSeconds: number): void {
    if (this.harmTaken === 0) return;
    this.sinceLastBlow += dtSeconds;
    if (this.sinceLastBlow < CALM_BEFORE_MENDING_SECONDS) return;
    this.mendingProgress += dtSeconds;
    while (this.mendingProgress >= SECONDS_PER_MENDED_POINT && this.harmTaken > 0) {
      this.mendingProgress -= SECONDS_PER_MENDED_POINT;
      this.harmTaken--;
      this.tellTheWatchers();
    }
  }

  strikeCreature(key: string, vigor: number, harm: number, at: Cell): StrikeOutcome {
    const taken = (this.harmToCreatures.get(key) ?? 0) + Math.max(1, harm);
    if (taken < Math.max(1, vigor)) {
      this.harmToCreatures.set(key, taken);
      this.emit('creature-struck', { at, harm });
      return 'hurt';
    }
    this.harmToCreatures.delete(key);
    this.slain.add(key);
    this.emit('creature-slain', { at, harm });
    return 'slain';
  }

  creatureIsSlain(key: string): boolean {
    return this.slain.has(key);
  }

  forget(): void {
    this.harmToCreatures.clear();
    this.slain.clear();
    this.mendPlayer();
  }

  private tellTheWatchers(): void {
    for (const watcher of this.watchers) watcher();
  }

  private emit(event: FightEvent, blow: Blow): void {
    for (const listener of this.listeners.get(event) ?? []) listener(blow);
  }
}
