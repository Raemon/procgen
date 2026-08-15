import '../nodes';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import { nodeTypeOf } from '../nodeRegistry';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import type { WorldPreset } from './worldPreset';

export interface LibraryDocs {
  tiles: TileDef[];
  pieces: Piece[];
  cultures: Culture[];
  worldPresets: WorldPreset[];
}

export interface AssetIdMaps {
  tileMap: Map<number, number>;
  pieceMap: Map<number, number>;
  cultureMap: Map<number, number>;
}

export function syncMissingPresets(library: LibraryDocs, shipped: LibraryDocs): number {
  const have = new Set(library.worldPresets.map((preset) => preset.name));
  const missing = shipped.worldPresets.filter((preset) => !have.has(preset.name));
  for (const preset of missing) installShippedPreset(library, shipped, preset);
  return missing.length;
}

function installShippedPreset(
  library: LibraryDocs,
  shipped: LibraryDocs,
  preset: WorldPreset,
): void {
  const wanted = assetsReferencedBy(preset.state, shipped);
  const maps: AssetIdMaps = {
    tileMap: idMapOnto(library.tiles, wanted.tiles),
    pieceMap: idMapOnto(library.pieces, wanted.pieces),
    cultureMap: idMapOnto(library.cultures, wanted.cultures),
  };
  library.tiles.push(
    ...wanted.tiles.map((tile) => ({ ...tile, id: maps.tileMap.get(tile.id)! })),
  );
  library.pieces.push(
    ...wanted.pieces.map((piece) => ({
      ...remappedPieceTiles(piece, maps.tileMap),
      id: maps.pieceMap.get(piece.id)!,
    })),
  );
  library.cultures.push(
    ...wanted.cultures.map((culture) => ({
      ...remappedCultureRefs(culture, maps),
      id: maps.cultureMap.get(culture.id)!,
    })),
  );
  library.worldPresets.push({ ...preset, state: remappedPipeline(preset.state, maps) });
}

function assetsReferencedBy(
  state: PipelineState,
  shipped: LibraryDocs,
): { tiles: TileDef[]; pieces: Piece[]; cultures: Culture[] } {
  const tileIds = new Set<number>();
  const pieceIds = new Set<number>();
  const cultureIds = new Set<number>();
  for (const node of state.nodes) {
    for (const id of tileParamIdsOf(node)) tileIds.add(id);
    if (node.display.mode === 'markers') tileIds.add(node.display.tileId);
    if (node.display.mode === 'pieces') pieceIds.add(node.display.pieceId);
    if (node.display.mode === 'structures') cultureIds.add(node.display.cultureId);
  }
  const cultures = pickedById(shipped.cultures, cultureIds);
  for (const culture of cultures) {
    for (const bound of Object.values(culture.roleBindings)) {
      for (const id of bound ?? []) pieceIds.add(id);
    }
    for (const id of cultureTileIdsOf(culture)) tileIds.add(id);
  }
  const pieces = pickedById(shipped.pieces, pieceIds);
  for (const piece of pieces) {
    for (const voxel of piece.voxels) if (voxel >= 0) tileIds.add(voxel);
  }
  return { tiles: pickedById(shipped.tiles, tileIds), pieces, cultures };
}

function tileParamIdsOf(node: NodeInstance): number[] {
  const def = nodeTypeOf(node.type);
  const ids: number[] = [];
  for (const [name, spec] of Object.entries(def?.params ?? {})) {
    if (spec.kind !== 'tile') continue;
    const value = node.params[name];
    if (typeof value === 'number' && value >= 0) ids.push(value);
  }
  return ids;
}

function cultureTileIdsOf(culture: Culture): number[] {
  return [
    culture.wallTileId,
    culture.trimTileId,
    culture.roofSlopeTileId,
    culture.roofRidgeTileId,
    culture.floorTileId,
    culture.pathTileId,
  ].filter((id) => typeof id === 'number' && id >= 0);
}

function pickedById<Asset extends { id: number }>(
  assets: readonly Asset[],
  ids: ReadonlySet<number>,
): Asset[] {
  return assets.filter((asset) => ids.has(asset.id));
}

function idMapOnto(
  existing: ReadonlyArray<{ id: number }>,
  wanted: ReadonlyArray<{ id: number }>,
): Map<number, number> {
  const next = existing.reduce((highest, asset) => Math.max(highest, asset.id), -1) + 1;
  return new Map(wanted.map((asset, at) => [asset.id, next + at]));
}

export function remappedPieceTiles(piece: Piece, tileMap: Map<number, number>): Piece {
  return {
    ...piece,
    voxels: piece.voxels.map((voxel) => (voxel >= 0 ? (tileMap.get(voxel) ?? voxel) : voxel)),
  };
}

export function remappedCultureRefs(culture: Culture, maps: AssetIdMaps): Culture {
  const roleBindings: Culture['roleBindings'] = {};
  for (const [role, bound] of Object.entries(culture.roleBindings)) {
    roleBindings[role as keyof Culture['roleBindings']] = (bound ?? []).map(
      (pieceId) => maps.pieceMap.get(pieceId) ?? pieceId,
    );
  }
  return {
    ...culture,
    roleBindings,
    wallTileId: remappedId(culture.wallTileId, maps.tileMap),
    trimTileId: remappedId(culture.trimTileId, maps.tileMap),
    roofSlopeTileId: remappedId(culture.roofSlopeTileId, maps.tileMap),
    roofRidgeTileId: remappedId(culture.roofRidgeTileId, maps.tileMap),
    floorTileId: remappedId(culture.floorTileId, maps.tileMap),
    pathTileId: remappedId(culture.pathTileId, maps.tileMap),
  };
}

export function remappedPipeline(pipeline: PipelineState, maps: AssetIdMaps): PipelineState {
  const state = structuredClone(pipeline);
  for (const node of state.nodes) {
    remapTileParams(node, maps.tileMap);
    remapDisplay(node, maps);
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

function remapDisplay(node: NodeInstance, maps: AssetIdMaps): void {
  const display = node.display;
  if (display.mode === 'markers') display.tileId = remappedId(display.tileId, maps.tileMap);
  if (display.mode === 'pieces') display.pieceId = remappedId(display.pieceId, maps.pieceMap);
  if (display.mode === 'structures')
    display.cultureId = remappedId(display.cultureId, maps.cultureMap);
}

function remappedId(id: number, map: Map<number, number>): number {
  if (id < 0) return id;
  return map.get(id) ?? id;
}
