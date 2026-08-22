import type { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import type { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import {
  remappedCultureRefs,
  remappedPieceTiles,
  remappedPipeline,
  type AssetIdMaps,
} from '../presets/presetSync';
import type { WorldPresetLibrary } from '../presets/worldPresetLibrary';
import { worldPaletteOfKit } from '../selfPlay/worldPalette';
import type { WorldGenome } from '../selfPlay/worldGenome';
import type { InstalledWorld } from './labRun';

export interface WorldLibrary {
  tileAssets: TileAssets;
  pieces: PieceAssets;
  cultures: CultureAssets;
  worldPresets: WorldPresetLibrary;
}

export function installLabWorld(
  library: WorldLibrary,
  genome: WorldGenome,
  name: string,
  description: string,
): InstalledWorld {
  const palette = worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
  const maps: AssetIdMaps = { tileMap: new Map(), pieceMap: new Map(), cultureMap: new Map() };

  for (const tile of palette.tiles) {
    const added = library.tileAssets.insert({ ...tile, name: `${tile.name} (${name})` });
    maps.tileMap.set(tile.id, added.id);
  }
  for (const piece of palette.pieces) {
    const added = library.pieces.insert({
      ...remappedPieceTiles(piece, maps.tileMap),
      name: `${piece.name} (${name})`,
    });
    maps.pieceMap.set(piece.id, added.id);
  }
  const culture = library.cultures.insert({
    ...remappedCultureRefs(palette.culture, maps),
    name: `${palette.culture.name} (${name})`,
  });
  maps.cultureMap.set(palette.culture.id, culture.id);

  library.worldPresets.save({
    name,
    description,
    state: remappedPipeline(sanitizePipeline(structuredClone(genome.pipeline)), maps),
  });
  return { name, tilesAdded: maps.tileMap.size, piecesAdded: maps.pieceMap.size };
}

export function freeWorldName(wanted: string, taken: ReadonlySet<string>): string {
  if (!taken.has(wanted)) return wanted;
  let copy = 2;
  while (taken.has(`${wanted} ${copy}`)) copy++;
  return `${wanted} ${copy}`;
}
