import { readFileSync, writeFileSync } from 'node:fs';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import { nodeTypeOf } from '@/features/asset-library/worlds/nodeRegistry';
import type { NodeInstance, PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
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

  const tileMap = new Map(palette.tiles.map((tile, at) => [tile.id, nextIdAfter(tiles) + at]));
  const pieceMap = new Map(palette.pieces.map((piece, at) => [piece.id, nextIdAfter(pieces) + at]));
  const cultureMap = new Map([[palette.culture.id, nextIdAfter(cultures)]]);

  tiles.push(...palette.tiles.map((tile) => remappedTile(tile, tileMap, presetName)));
  pieces.push(...palette.pieces.map((piece) => remappedPiece(piece, tileMap, pieceMap, presetName)));
  cultures.push(remappedCulture(palette.culture, tileMap, pieceMap, cultureMap, presetName));

  const state = remappedPipeline(genome.pipeline, tileMap, pieceMap, cultureMap);
  const presets = readData<unknown[]>('worldPresets', []);
  appendPreset(presets, presetName, description, state);

  writeData('tiles', tiles);
  writeData('pieces', pieces);
  writeData('cultures', cultures);
  writeData('worldPresets', presets);
  return { name: presetName, tilesAdded: tileMap.size, piecesAdded: pieceMap.size };
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

function remappedTile(tile: TileDef, tileMap: Map<number, number>, presetName: string): TileDef {
  return { ...tile, id: tileMap.get(tile.id)!, name: `${tile.name} (${presetName})` };
}

function remappedPiece(
  piece: Piece,
  tileMap: Map<number, number>,
  pieceMap: Map<number, number>,
  presetName: string,
): Piece {
  return {
    ...piece,
    id: pieceMap.get(piece.id)!,
    name: `${piece.name} (${presetName})`,
    voxels: piece.voxels.map((voxel) => (voxel >= 0 ? (tileMap.get(voxel) ?? voxel) : voxel)),
  };
}

function remappedCulture(
  culture: Culture,
  tileMap: Map<number, number>,
  pieceMap: Map<number, number>,
  cultureMap: Map<number, number>,
  presetName: string,
): Culture {
  const roleBindings: Culture['roleBindings'] = {};
  for (const [role, bound] of Object.entries(culture.roleBindings)) {
    roleBindings[role as keyof Culture['roleBindings']] = (bound ?? []).map(
      (pieceId) => pieceMap.get(pieceId) ?? pieceId,
    );
  }
  return {
    ...culture,
    id: cultureMap.get(culture.id)!,
    name: `${culture.name} (${presetName})`,
    roleBindings,
    wallTileId: remappedId(culture.wallTileId, tileMap),
    trimTileId: remappedId(culture.trimTileId, tileMap),
    roofSlopeTileId: remappedId(culture.roofSlopeTileId, tileMap),
    roofRidgeTileId: remappedId(culture.roofRidgeTileId, tileMap),
    floorTileId: remappedId(culture.floorTileId, tileMap),
    pathTileId: remappedId(culture.pathTileId, tileMap),
  };
}

function remappedPipeline(
  pipeline: PipelineState,
  tileMap: Map<number, number>,
  pieceMap: Map<number, number>,
  cultureMap: Map<number, number>,
): PipelineState {
  const state = sanitizePipeline(structuredClone(pipeline));
  for (const node of state.nodes) {
    remapTileParams(node, tileMap);
    remapDisplay(node, tileMap, pieceMap, cultureMap);
  }
  return state;
}

function remapTileParams(node: NodeInstance, tileMap: Map<number, number>): void {
  const def = nodeTypeOf(node.type);
  for (const [name, spec] of Object.entries(def?.params ?? {})) {
    if (spec.kind !== 'tile') continue;
    const value = node.params[name];
    if (typeof value === 'number') node.params[name] = remappedId(value, tileMap);
  }
}

function remapDisplay(
  node: NodeInstance,
  tileMap: Map<number, number>,
  pieceMap: Map<number, number>,
  cultureMap: Map<number, number>,
): void {
  const display = node.display;
  if (display.mode === 'markers') display.tileId = remappedId(display.tileId, tileMap);
  if (display.mode === 'pieces') display.pieceId = remappedId(display.pieceId, pieceMap);
  if (display.mode === 'structures') display.cultureId = remappedId(display.cultureId, cultureMap);
}

function remappedId(id: number, map: Map<number, number>): number {
  if (id < 0) return id;
  return map.get(id) ?? id;
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
