import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { worldFieldReader } from '../../values/worldInputReaders';
import { winsSpacingContest, type SiteTest } from './spacedSiteContest';

const SITE_DENSITY = 0.03;

registerNodeType({
  type: 'standingStones',
  title: 'standing stones',
  category: 'language',
  description:
    'Raises lone stones on open ground, spaced apart and placed deterministically. They carry no names of their own — wire them through a name places node to inscribe them.',
  whenToUse:
    'Scatter landmarks that teach the local language: name the stones and players learn roots by comparing each inscription with the land it stands in.',
  inputs: {
    terrain: {
      kind: 'field',
      label: 'terrain',
      help: 'Stones stand only where this elevation lies between the two height knobs.',
    },
  },
  params: {
    spacing: {
      kind: 'int',
      label: 'stone spacing',
      help: 'Minimum distance in tiles between two stones. Rival sites within range are thinned deterministically.',
      min: 6,
      max: 64,
      default: 20,
    },
    minHeight: {
      kind: 'number',
      label: 'lowest ground',
      help: 'No stones below this elevation; keep it above sea level so stones stay on land.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    maxHeight: {
      kind: 'number',
      label: 'highest ground',
      help: 'No stones above this elevation, keeping peaks bare.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.85,
    },
  },
  output: 'points',
  generateChunk: standingStonesChunk,
});

function standingStonesChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.fieldInput('terrain')) return pointsValue(points);
  const site = stoneSiteTest(ctx);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      collectStone(ctx, site, ctx.originX + x, ctx.originY + y, points);
    }
  }
  return pointsValue(points);
}

function collectStone(ctx: ChunkGenCtx, site: SiteTest, worldX: number, worldY: number, points: PointsChunk): void {
  const spacing = ctx.params.spacing as number;
  if (site(worldX, worldY) && winsSpacingContest(ctx, site, worldX, worldY, spacing, 'stone rank')) {
    points.push({ x: worldX, y: worldY, tag: 'stone' });
  }
}

function stoneSiteTest(ctx: ChunkGenCtx): SiteTest {
  const terrainAt = worldFieldReader(ctx, 'terrain');
  const minHeight = ctx.params.minHeight as number;
  const maxHeight = ctx.params.maxHeight as number;
  return (worldX, worldY) => {
    if (ctx.hash01(worldX, worldY, 'stone site') >= SITE_DENSITY) return false;
    const height = terrainAt(worldX, worldY);
    return height !== null && height >= minHeight && height <= maxHeight;
  };
}
