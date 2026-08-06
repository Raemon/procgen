import { generate } from '../gen/generate';
import type { ElevationField } from '../gen/genPass';
import type { GenParams } from '../gen/genParams';
import { Grid } from './grid';
import { spawnPointForSeed } from './spawnPoint';
import type { Tileset } from './tiles/tileset';
import { isWalkableTile } from './tileWalkability';
import { WorldEvents, type WorldEvent } from './worldEvents';

export class World {
  grid = new Grid(1, 1);
  elevation: ElevationField = new Float32Array(1);
  playerX = 0;
  playerY = 0;
  private readonly events = new WorldEvents();

  constructor(private readonly tileset: Tileset) {}

  regenerate(params: GenParams): void {
    const { grid, elevation } = generate(params, this.tileset);
    this.grid = grid;
    this.elevation = elevation;
    this.movePlayerTo(spawnPointForSeed(grid, params.seed, (id) => this.canStandOnTile(id)));
    this.events.emit('generated');
  }

  tryStep(dx: number, dy: number): boolean {
    const nextX = this.playerX + dx;
    const nextY = this.playerY + dy;
    if (!this.canStandOnTile(this.grid.get(nextX, nextY))) return false;
    this.movePlayerTo({ x: nextX, y: nextY });
    this.events.emit('player-moved');
    return true;
  }

  on(event: WorldEvent, listener: () => void): void {
    this.events.on(event, listener);
  }

  private movePlayerTo({ x, y }: { x: number; y: number }): void {
    this.playerX = x;
    this.playerY = y;
  }

  private canStandOnTile(tileId: number): boolean {
    return isWalkableTile(this.tileset, tileId);
  }
}
