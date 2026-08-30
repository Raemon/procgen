import { assetId, type AssetIdMap, type AssetIdOf, type AssetKind } from '@/features/asset-library/asset';
import '../nodes';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import { nodeTypeOf } from '../nodeRegistry';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';

export interface AssetIdMaps {
  tileMap: AssetIdMap<'tiles'>;
  pieceMap: AssetIdMap<'pieces'>;
  cultureMap: AssetIdMap<'cultures'>;
}

export function remappedPieceTiles(piece: Piece, tileMap: AssetIdMap<'tiles'>): Piece {
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

function remapTileParams(node: NodeInstance, tileMap: AssetIdMap<'tiles'>): void {
  const def = nodeTypeOf(node.type);
  for (const [name, spec] of Object.entries(def?.params ?? {})) {
    if (spec.kind !== 'tile') continue;
    const value = node.params[name];
    if (typeof value === 'number') node.params[name] = remappedId(assetId<'tiles'>(value), tileMap);
  }
}

function remapDisplay(node: NodeInstance, maps: AssetIdMaps): void {
  const display = node.display;
  if (display.mode === 'markers') display.tileId = remappedId(display.tileId, maps.tileMap);
  if (display.mode === 'pieces') display.pieceId = remappedId(display.pieceId, maps.pieceMap);
  if (display.mode === 'structures')
    display.cultureId = remappedId(display.cultureId, maps.cultureMap);
}

function remappedId<Kind extends AssetKind>(
  id: AssetIdOf<Kind>,
  map: AssetIdMap<Kind>,
): AssetIdOf<Kind> {
  if (id < 0) return id;
  return map.get(id) ?? id;
}
