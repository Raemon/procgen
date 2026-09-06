import { Revision } from '@/features/game/sharedRevision';

export interface CratePosition {
  x: number;
  y: number;
}

export interface PuzzleStateSnapshot {
  on: string[];
  crates: Array<[string, number, number]>;
}

export class PuzzleState {
  private readonly switchedOn = new Set<string>();
  private readonly crates = new Map<string, CratePosition>();
  private readonly changes = new Revision();

  revision(): number {
    return this.changes.value();
  }

  isOn(fixtureId: string): boolean {
    return this.switchedOn.has(fixtureId);
  }

  setOn(fixtureId: string, on: boolean): void {
    if (on) this.switchedOn.add(fixtureId);
    else this.switchedOn.delete(fixtureId);
    this.changes.bump();
  }

  crateAt(fixtureId: string): CratePosition | undefined {
    return this.crates.get(fixtureId);
  }

  moveCrate(fixtureId: string, to: CratePosition): void {
    this.crates.set(fixtureId, to);
    this.changes.bump();
  }

  forgetRoom(roomKey: string): void {
    this.changes.bump();
    for (const id of [...this.switchedOn]) {
      if (id.startsWith(`${roomKey}/`)) this.switchedOn.delete(id);
    }
    for (const id of [...this.crates.keys()]) {
      if (id.startsWith(`${roomKey}/`)) this.crates.delete(id);
    }
  }

  forgetAll(): void {
    this.changes.bump();
    this.switchedOn.clear();
    this.crates.clear();
  }

  snapshot(): PuzzleStateSnapshot {
    return {
      on: [...this.switchedOn],
      crates: [...this.crates].map(([id, at]) => [id, at.x, at.y]),
    };
  }

  replaceAll(snapshot: PuzzleStateSnapshot): void {
    this.changes.bump();
    this.switchedOn.clear();
    this.crates.clear();
    for (const id of snapshot.on) this.switchedOn.add(id);
    for (const [id, x, y] of snapshot.crates) this.crates.set(id, { x, y });
  }
}
