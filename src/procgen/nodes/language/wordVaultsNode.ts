import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { worldFieldReader, type WorldFieldReader } from '../../values/worldInputReaders';
import { VAULT_WALL_RADIUS } from '../../../spokenWorld/vaultLayout';
import { winsSpacingContest, type SiteTest } from './spacedSiteContest';

const SITE_DENSITY = 0.02;

registerNodeType({
  type: 'wordVaults',
  title: 'word vaults',
  category: 'language',
  description:
    'Seals small walled vaults onto quiet ground. A vault has no keyhole: it opens only when the true name of the land around it is spoken within earshot, and it never says which word it wants.',
  whenToUse:
    'Give the language stakes. Bind the display to markers and set the wall tile; the sealed shell is drawn by the world itself and unsealed through the speak action.',
  inputs: {
    terrain: {
      kind: 'field',
      label: 'terrain',
      help: 'Vaults stand only where this elevation lies between the two height knobs across their whole footprint.',
    },
  },
  params: {
    spacing: {
      kind: 'int',
      label: 'vault spacing',
      help: 'Minimum distance in tiles between two vaults. Rival sites within range are thinned deterministically.',
      min: 12,
      max: 96,
      default: 44,
    },
    minHeight: {
      kind: 'number',
      label: 'lowest ground',
      help: 'No vaults below this elevation; keep it above sea level so vaults stay dry.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    maxHeight: {
      kind: 'number',
      label: 'highest ground',
      help: 'No vaults above this elevation.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.8,
    },
    wallTile: {
      kind: 'tile',
      label: 'wall tile',
      help: 'The unwalkable tile the sealed shell and its door are drawn with.',
    },
  },
  output: 'points',
  generateChunk: wordVaultsChunk,
});

function wordVaultsChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.fieldInput('terrain')) return pointsValue(points);
  const site = vaultSiteTest(ctx);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      collectVault(ctx, site, ctx.originX + x, ctx.originY + y, points);
    }
  }
  return pointsValue(points);
}

function collectVault(ctx: ChunkGenCtx, site: SiteTest, worldX: number, worldY: number, points: PointsChunk): void {
  const spacing = ctx.params.spacing as number;
  if (site(worldX, worldY) && winsSpacingContest(ctx, site, worldX, worldY, spacing, 'vault rank')) {
    points.push({ x: worldX, y: worldY, tag: 'vault' });
  }
}

function vaultSiteTest(ctx: ChunkGenCtx): SiteTest {
  const terrainAt = worldFieldReader(ctx, 'terrain');
  const minHeight = ctx.params.minHeight as number;
  const maxHeight = ctx.params.maxHeight as number;
  return (worldX, worldY) => {
    if (ctx.hash01(worldX, worldY, 'vault site') >= SITE_DENSITY) return false;
    return footprintInRange(terrainAt, worldX, worldY, minHeight, maxHeight);
  };
}

function footprintInRange(
  terrainAt: WorldFieldReader,
  worldX: number,
  worldY: number,
  minHeight: number,
  maxHeight: number,
): boolean {
  for (let dy = -VAULT_WALL_RADIUS; dy <= VAULT_WALL_RADIUS; dy++) {
    for (let dx = -VAULT_WALL_RADIUS; dx <= VAULT_WALL_RADIUS; dx++) {
      const height = terrainAt(worldX + dx, worldY + dy);
      if (height === null || height < minHeight || height > maxHeight) return false;
    }
  }
  return true;
}
