import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import { eachDistrictTouchingChunk, vaultSpecOf, type VaultPlan } from './vaultPlan';

registerNodeType({
  type: 'vaultWalls',
  title: 'vault walls',
  category: 'quest',
  description:
    'Builds one walled square vault per district on an endless lattice: a ring of wall tiles with a floor inside and a single door cell in the ring.',
  whenToUse:
    'The physical half of a lock-and-key quest. Pair it with vault points nodes that share the same district span and vault size — those emit the door, key and treasure points that line up with these walls.',
  inputs: {},
  params: {
    districtSpan: {
      kind: 'int',
      label: 'district span',
      help: 'Side length in tiles of each district; every district holds exactly one vault. Larger spans spread vaults farther apart.',
      min: 48,
      max: 256,
      default: 96,
    },
    vaultSize: {
      kind: 'int',
      label: 'vault size',
      help: 'Side length in tiles of the walled square, including the wall ring. Must match the vault points nodes paired with this one.',
      min: 7,
      max: 31,
      default: 11,
    },
    wallTile: {
      kind: 'tile',
      label: 'wall',
      help: 'Tile for the vault ring. Pick something unwalkable so the door is the only way in.',
    },
    floorTile: {
      kind: 'tile',
      label: 'floor',
      help: 'Tile for the vault interior. Pick (empty) to let the ground below show through.',
    },
    doorTile: {
      kind: 'tile',
      label: 'door',
      help: 'Tile for the single door cell in the ring. Pick something walkable — the quest layer, not the tile, is what keeps the door locked until its key is held.',
    },
  },
  output: 'tiles',
  generateChunk: vaultWallsChunk,
});

function vaultWallsChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  eachDistrictTouchingChunk(ctx, vaultSpecOf(ctx), (plan) => paintVault(ctx, tiles, plan));
  return tilesValue(tiles);
}

function paintVault(ctx: ChunkGenCtx, tiles: TilesChunk, plan: VaultPlan): void {
  const fromX = Math.max(plan.left, ctx.originX);
  const toX = Math.min(plan.left + plan.size - 1, ctx.originX + ctx.size - 1);
  const fromY = Math.max(plan.top, ctx.originY);
  const toY = Math.min(plan.top + plan.size - 1, ctx.originY + ctx.size - 1);
  for (let y = fromY; y <= toY; y++) {
    for (let x = fromX; x <= toX; x++) {
      tiles[(y - ctx.originY) * ctx.size + (x - ctx.originX)] = vaultTileAt(ctx, plan, x, y);
    }
  }
}

function vaultTileAt(ctx: ChunkGenCtx, plan: VaultPlan, x: number, y: number): number {
  if (x === plan.doorX && y === plan.doorY) return ctx.params.doorTile as number;
  if (isOnRing(plan, x, y)) return ctx.params.wallTile as number;
  return ctx.params.floorTile as number;
}

function isOnRing(plan: VaultPlan, x: number, y: number): boolean {
  return (
    x === plan.left ||
    x === plan.left + plan.size - 1 ||
    y === plan.top ||
    y === plan.top + plan.size - 1
  );
}
