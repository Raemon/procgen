import { assetId } from '@/features/asset-library/asset';
import { defaultCultures } from '@/features/asset-library/cultures/defaultCultures';
import { defaultPieces } from '@/features/asset-library/pieces/defaultPieces';
import { defaultTiles } from '@/features/asset-library/tiles/defaultTiles';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import {
  remappedCultureRefs,
  remappedPieceTiles,
  remappedPipeline,
  type AssetIdMaps,
} from '@/features/asset-library/worlds/seeds/assetIdRemap';
import { worldPaletteOfKit } from '@/features/asset-library/worlds/selfPlay/worldPalette';
import type { WorldSeedGenome } from '@/features/asset-library/worlds/selfPlay/worldSeedGenome';
import { readGeneratedAssets, writeGeneratedAssets } from '../assetKit/generatedAssetsModule';

export interface InstalledWorldSeed {
  name: string;
  tilesAdded: number;
  piecesAdded: number;
}

export function installGenomeAsWorldSeed(
  genome: WorldSeedGenome,
  seedName: string,
  description: string,
): InstalledWorldSeed {
  const palette = worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
  const generated = readGeneratedAssets();
  const maps = idsFreeInTheLibrary(palette);

  const tiles = [
    ...generated.tiles,
    ...palette.tiles.map((tile) => ({
      ...tile,
      id: maps.tileMap.get(tile.id)!,
      name: `${tile.name} (${seedName})`,
    })),
  ];
  const pieces = [
    ...generated.pieces,
    ...palette.pieces.map((piece) => ({
      ...remappedPieceTiles(piece, maps.tileMap),
      id: maps.pieceMap.get(piece.id)!,
      name: `${piece.name} (${seedName})`,
    })),
  ];
  const cultures = [
    ...generated.cultures,
    {
      ...remappedCultureRefs(palette.culture, maps),
      id: maps.cultureMap.get(palette.culture.id)!,
      name: `${palette.culture.name} (${seedName})`,
    },
  ];

  const state = remappedPipeline(sanitizePipeline(structuredClone(genome.pipeline)), maps);
  const worldSeeds = withWorldSeed(generated.worldSeeds, { name: seedName, description, state });

  writeGeneratedAssets({ tiles, pieces, cultures, worldSeeds });
  return { name: seedName, tilesAdded: maps.tileMap.size, piecesAdded: maps.pieceMap.size };
}

function idsFreeInTheLibrary(
  palette: ReturnType<typeof worldPaletteOfKit>,
): AssetIdMaps {
  const nextTileId = nextIdAfter(defaultTiles());
  const nextPieceId = nextIdAfter(defaultPieces());
  return {
    tileMap: new Map(
      palette.tiles.map((tile, at) => [tile.id, assetId<'tiles'>(nextTileId + at)]),
    ),
    pieceMap: new Map(
      palette.pieces.map((piece, at) => [piece.id, assetId<'pieces'>(nextPieceId + at)]),
    ),
    cultureMap: new Map([
      [palette.culture.id, assetId<'cultures'>(nextIdAfter(defaultCultures()))],
    ]),
  };
}

function withWorldSeed<Seed extends { name: string }>(
  seeds: readonly Seed[],
  seed: Seed,
): Seed[] {
  const already = seeds.findIndex((held) => held.name === seed.name);
  if (already < 0) return [...seeds, seed];
  return seeds.map((held, at) => (at === already ? seed : held));
}

function nextIdAfter(assets: ReadonlyArray<{ id: number }>): number {
  return assets.reduce((highest, asset) => Math.max(highest, asset.id), -1) + 1;
}
