import { buildLexicon, type Lexicon } from '../../../language/lexicon';
import { placeNameFor, type SiteTraits } from '../../../language/placeNames';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { EMPTY_TILE, pointsValue, type ChunkValue, type WorldPoint } from '../../values/chunkValues';
import { worldFieldReader, worldTileReader } from '../../values/worldInputReaders';

registerNodeType({
  type: 'namePlaces',
  title: 'name places',
  category: 'language',
  description:
    "Gives every incoming point a name in the world's own tongue: a compound of language roots chosen from what the land is actually like at that point, so names describe their sites.",
  whenToUse:
    'Wire in towns, stones or other landmark points plus the terrain and water they sit in. Their markers gain local-language names; the same world seed always speaks the same language.',
  inputs: {
    places: {
      kind: 'points',
      label: 'places',
      help: 'The points to name. Each keeps its position; its tag becomes "<name> (<old tag>)".',
    },
    terrain: {
      kind: 'field',
      label: 'terrain',
      help: 'Elevation at the named site steers which roots the name is built from.',
      optional: true,
    },
    water: {
      kind: 'tiles',
      label: 'water',
      help: 'Optional water tiles; a point beside any of them is named as a water place.',
      optional: true,
    },
  },
  params: {},
  output: 'points',
  generateChunk: namePlacesChunk,
});

function namePlacesChunk(ctx: ChunkGenCtx): ChunkValue {
  const places = ctx.pointsInput('places') ?? [];
  const lexicon = buildLexicon(ctx.worldSeed);
  const traitsAt = siteTraitsReader(ctx);
  return pointsValue(places.map((place) => namedPlace(ctx, lexicon, traitsAt, place)));
}

function namedPlace(
  ctx: ChunkGenCtx,
  lexicon: Lexicon,
  traitsAt: (x: number, y: number) => SiteTraits,
  place: WorldPoint,
): WorldPoint {
  const pick = ctx.hash01(place.x, place.y, 'place name');
  const name = placeNameFor(lexicon, traitsAt(place.x, place.y), pick);
  return { ...place, tag: `${name} (${place.tag})` };
}

function siteTraitsReader(ctx: ChunkGenCtx): (x: number, y: number) => SiteTraits {
  const terrainAt = worldFieldReader(ctx, 'terrain');
  const waterAt = worldTileReader(ctx, 'water');
  return (x, y) => ({
    nearWater: touchesWater(waterAt, x, y),
    height: terrainAt(x, y) ?? 0.5,
  });
}

function touchesWater(waterAt: (x: number, y: number) => number | null, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tile = waterAt(x + dx, y + dy);
      if (tile !== null && tile !== EMPTY_TILE) return true;
    }
  }
  return false;
}
