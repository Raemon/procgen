import { readFileSync, writeFileSync } from 'node:fs';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import {
  remappedCultureRefs,
  remappedPieceTiles,
  remappedPipeline,
  type AssetIdMaps,
} from '@/features/asset-library/worlds/presets/presetSync';
import { worldPaletteOfKit } from '@/features/asset-library/worlds/selfPlay/worldPalette';
import type { WorldGenome } from '@/features/asset-library/worlds/selfPlay/worldGenome';

export interface InstalledPreset {
  name: string;
  tilesAdded: number;
  piecesAdded: number;
}

export function installGenomeAsPreset(
  genome: WorldGenome,
  presetName: string,
  description: string,
): InstalledPreset {
  const palette = worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
  const tiles = readData<TileDef[]>('tiles', []);
  const pieces = readData<Piece[]>('pieces', []);
  const cultures = readData<Culture[]>('cultures', []);

  const maps: AssetIdMaps = {
    tileMap: new Map(palette.tiles.map((tile, at) => [tile.id, nextIdAfter(tiles) + at])),
    pieceMap: new Map(palette.pieces.map((piece, at) => [piece.id, nextIdAfter(pieces) + at])),
    cultureMap: new Map([[palette.culture.id, nextIdAfter(cultures)]]),
  };

  tiles.push(
    ...palette.tiles.map((tile) => ({
      ...tile,
      id: maps.tileMap.get(tile.id)!,
      name: `${tile.name} (${presetName})`,
    })),
  );
  pieces.push(
    ...palette.pieces.map((piece) => ({
      ...remappedPieceTiles(piece, maps.tileMap),
      id: maps.pieceMap.get(piece.id)!,
      name: `${piece.name} (${presetName})`,
    })),
  );
  cultures.push({
    ...remappedCultureRefs(palette.culture, maps),
    id: maps.cultureMap.get(palette.culture.id)!,
    name: `${palette.culture.name} (${presetName})`,
  });

  const state = remappedPipeline(sanitizePipeline(structuredClone(genome.pipeline)), maps);
  const presets = readData<unknown[]>('worldPresets', []);
  appendPreset(presets, presetName, description, state);

  writeData('tiles', tiles);
  writeData('pieces', pieces);
  writeData('cultures', cultures);
  writeData('worldPresets', presets);
  return { name: presetName, tilesAdded: maps.tileMap.size, piecesAdded: maps.pieceMap.size };
}

function appendPreset(
  presets: unknown[],
  name: string,
  description: string,
  state: PipelineState,
): void {
  const held = presets as Array<{ name?: unknown }>;
  const already = held.findIndex((preset) => preset.name === name);
  const entry = { name, description, state };
  if (already >= 0) held[already] = entry;
  else held.push(entry);
}

function nextIdAfter(assets: ReadonlyArray<{ id: number }>): number {
  return assets.reduce((highest, asset) => Math.max(highest, asset.id), -1) + 1;
}

function readData<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(`data/${name}.json`, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeData(name: string, value: unknown): void {
  writeFileSync(`data/${name}.json`, `${JSON.stringify(value, null, 2)}\n`);
}
