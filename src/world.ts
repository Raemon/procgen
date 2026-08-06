// World — the one shared state both views render: the generated grid plus the
// player. Toggling ascii/2.5d changes nothing here, which is what makes the
// toggle free.

import { generate, type GenParams } from './gen';
import { EMPTY, Grid } from './grid';
import { rngFor } from './rng';
import type { Tileset } from './tiles';

export type WorldEvent = 'generated' | 'player-moved';

export class World {
  grid: Grid;
  elevation: Float32Array;
  playerX = 0;
  playerY = 0;
  private listeners = new Map<WorldEvent, Set<() => void>>();

  constructor(private readonly tileset: Tileset) {
    this.grid = new Grid(1, 1);
    this.elevation = new Float32Array(1);
  }

  regenerate(params: GenParams): void {
    const { grid, ctx } = generate(params, this.tileset);
    this.grid = grid;
    this.elevation = ctx.elevation;
    this.spawnPlayer(params.seed);
    this.emit('generated');
  }

  /** Drop the player on a random walkable tile — deterministic per seed. */
  private spawnPlayer(seed: number): void {
    const rng = rngFor(seed, 'spawn');
    const walkable: number[] = [];
    this.grid.forEach((x, y, t) => {
      if (this.isWalkable(t)) walkable.push(y * this.grid.width + x);
    });
    if (walkable.length === 0) {
      this.playerX = Math.floor(this.grid.width / 2);
      this.playerY = Math.floor(this.grid.height / 2);
      return;
    }
    const i = walkable[Math.floor(rng() * walkable.length)]!;
    this.playerX = i % this.grid.width;
    this.playerY = Math.floor(i / this.grid.width);
  }

  private isWalkable(tileId: number): boolean {
    if (tileId === EMPTY) return false;
    return this.tileset.byId(tileId)?.walkable ?? false;
  }

  /** Step the player one tile; refused (returns false) off-grid or into a
   *  non-walkable tile. */
  tryStep(dx: number, dy: number): boolean {
    const nx = this.playerX + dx;
    const ny = this.playerY + dy;
    if (!this.grid.inBounds(nx, ny)) return false;
    if (!this.isWalkable(this.grid.get(nx, ny))) return false;
    this.playerX = nx;
    this.playerY = ny;
    this.emit('player-moved');
    return true;
  }

  on(event: WorldEvent, fn: () => void): void {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(fn);
  }

  private emit(event: WorldEvent): void {
    for (const fn of this.listeners.get(event) ?? []) fn();
  }
}
