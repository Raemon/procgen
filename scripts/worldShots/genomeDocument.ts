import type { WorldGenome } from '@/features/asset-library/worlds/selfPlay/worldGenome';
import { worldPaletteOfKit } from '@/features/asset-library/worlds/selfPlay/worldPalette';
import type { WorldDocument } from '../headlessWorld';

export function documentOfGenome(genome: WorldGenome): WorldDocument {
  const palette = worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
  return {
    name: palette.name,
    pipeline: genome.pipeline,
    tiles: palette.tiles,
    pieces: palette.pieces,
    cultures: [palette.culture],
  };
}
