export interface CratePosition {
  x: number;
  y: number;
}

export class PuzzleState {
  private readonly switchedOn = new Set<string>();
  private readonly crates = new Map<string, CratePosition>();
  private changes = 0;

  revision(): number {
    return this.changes;
  }

  isOn(fixtureId: string): boolean {
    return this.switchedOn.has(fixtureId);
  }

  setOn(fixtureId: string, on: boolean): void {
    if (on) this.switchedOn.add(fixtureId);
    else this.switchedOn.delete(fixtureId);
    this.changes++;
  }

  crateAt(fixtureId: string): CratePosition | undefined {
    return this.crates.get(fixtureId);
  }

  moveCrate(fixtureId: string, to: CratePosition): void {
    this.crates.set(fixtureId, to);
    this.changes++;
  }

  forgetRoom(roomKey: string): void {
    this.changes++;
    for (const id of [...this.switchedOn]) {
      if (id.startsWith(`${roomKey}/`)) this.switchedOn.delete(id);
    }
    for (const id of [...this.crates.keys()]) {
      if (id.startsWith(`${roomKey}/`)) this.crates.delete(id);
    }
  }

  forgetAll(): void {
    this.changes++;
    this.switchedOn.clear();
    this.crates.clear();
  }
}
