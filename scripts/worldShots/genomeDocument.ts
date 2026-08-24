import type { WorldSeedGenome } from '@/features/asset-library/worlds/selfPlay/worldSeedGenome';
import { worldPaletteOfKit } from '@/features/asset-library/worlds/selfPlay/worldPalette';
import type { WorldDocument } from '../headlessWorld';

export function documentOfGenome(genome: WorldSeedGenome): WorldDocument {
  const palette = worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
  return {
    name: palette.name,
    pipeline: genome.pipeline,
    tiles: palette.tiles,
    pieces: palette.pieces,
    cultures: [palette.culture],
  };
}
