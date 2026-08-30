import type { TileId } from '@/features/asset-library/asset';
import type { PieceCellEdit } from '@/features/asset-library/pieces/pieceDef';
import { forgetRemovedPieceInRoleBindings } from '@/features/asset-library/cultures/forgetRemovedPieceInRoleBindings';
import {
  isInsidePiece,
  isPieceRole,
  MAX_PIECE_LAYERS,
  MAX_PIECE_SIDE,
  PIECE_ROLES,
  voxelIndex,
  type Piece,
} from '@/features/asset-library/pieces/pieceDef';
import { paintVoxel } from '@/features/asset-library/pieces/piecePainting';
import { floodFilledIndices } from '@/features/asset-library/pieces/editor/ops/floodFillLayer';
import { resizedPiece } from '@/features/asset-library/pieces/pieceResize';
import { normalizedQuarterTurns, rotatedPiece } from '@/features/asset-library/pieces/pieceRotation';
import type { PiecePatch } from '@/features/asset-library/pieces/pieceAssets';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { listOf, readAssetId, readInt, readOptionalInt, readText } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: pieceCommands } = createCommandCollection();
export { pieceCommands };



const PIECE_ID_HELP = 'id of an existing piece — see GET /api/v1/asset-library/pieces';

function registerPieceCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerPieceCommand({
  action: 'add_piece',
  humanControl: 'asset library, pieces folder: + add piece',
  description:
    'Create an empty piece: a width × depth × layers box of tile ids you fill with paint_piece.',
  params: {},
  example: { action: 'add_piece' },
  apply: (context) => {
    const piece = context.pieces.add();
    return commandSucceeded(`added piece ${piece.id} ('${piece.name}')`);
  },
});

registerPieceCommand({
  action: 'duplicate_piece',
  humanControl: 'detail panel, pieces: ⧉ duplicate',
  description: 'Copy a piece with all its voxels.',
  params: { piece_id: { kind: 'int', help: PIECE_ID_HELP } },
  example: { action: 'duplicate_piece', piece_id: 0 },
  apply: (context, params) =>
    withPiece(context, params, (piece) => {
      const copy = context.pieces.duplicate(piece.id);
      return copy
        ? commandSucceeded(`duplicated piece ${piece.id} as ${copy.id}`)
        : commandFailed('unknown_piece', `could not duplicate piece ${piece.id}`);
    }),
});

registerPieceCommand({
  action: 'rename_piece',
  humanControl: 'detail panel, pieces: the name field',
  description: 'Rename a piece. Nodes bind pieces by id, so renaming is safe.',
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    name: { kind: 'text', help: 'the new name' },
  },
  example: { action: 'rename_piece', piece_id: 0, name: 'gatehouse' },
  apply: (context, params) =>
    withPiece(context, params, (piece) => {
      const name = readText(params, 'name');
      if (!name.ok) return name.failure;
      context.pieces.update(piece.id, { name: name.value });
      return commandSucceeded(`piece ${piece.id} renamed to '${name.value}'`);
    }),
});

registerPieceCommand({
  action: 'resize_piece',
  humanControl: 'detail panel, pieces: the size steppers',
  description:
    'Change a piece\'s box. Voxels outside the new box are dropped; new space starts empty.',
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    width: { kind: 'int', help: `east-west tiles, 1 to ${MAX_PIECE_SIDE}`, optional: true },
    depth: { kind: 'int', help: `north-south tiles, 1 to ${MAX_PIECE_SIDE}`, optional: true },
    layers: { kind: 'int', help: `height in tiles, 1 to ${MAX_PIECE_LAYERS}`, optional: true },
  },
  example: { action: 'resize_piece', piece_id: 0, width: 7, depth: 7, layers: 5 },
  apply: (context, params) =>
    withPiece(context, params, (piece) => {
      const resized = resizedPiece(piece, {
        width: clampSide(readOptionalInt(params, 'width', piece.width), MAX_PIECE_SIDE),
        depth: clampSide(readOptionalInt(params, 'depth', piece.depth), MAX_PIECE_SIDE),
        layers: clampSide(readOptionalInt(params, 'layers', piece.layers), MAX_PIECE_LAYERS),
      });
      context.pieces.update(piece.id, patchOf(resized));
      return commandSucceeded(
        `piece ${piece.id} is now ${resized.width}×${resized.depth}×${resized.layers}`,
      );
    }),
});

registerPieceCommand({
  action: 'rotate_piece',
  humanControl: 'detail panel, pieces: the rotate button',
  description: 'Turn a piece a quarter turn clockwise, swapping its width and depth.',
  params: { piece_id: { kind: 'int', help: PIECE_ID_HELP } },
  example: { action: 'rotate_piece', piece_id: 0 },
  apply: (context, params) =>
    withPiece(context, params, (piece) => {
      context.pieces.update(piece.id, patchOf(rotatedPiece(piece, 1)));
      return commandSucceeded(`piece ${piece.id} rotated a quarter turn`);
    }),
});

registerPieceCommand({
  action: 'paint_piece',
  humanControl: 'detail panel, pieces: painting on the layer canvas',
  description:
    'Paint one voxel of a piece. Layer 0 is the ground layer; tile_id -1 erases the voxel.',
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    x: { kind: 'int', help: 'east-west cell, 0 at the west edge' },
    y: { kind: 'int', help: 'north-south cell, 0 at the north edge' },
    layer: { kind: 'int', help: 'height, 0 at the ground' },
    tile_id: { kind: 'int', help: 'a tile asset id to place, or -1 to erase' },
  },
  example: { action: 'paint_piece', piece_id: 0, x: 2, y: 2, layer: 1, tile_id: 8 },
  apply: (context, params) => withPiece(context, params, (piece) => paintPiece(context, piece, params)),
});

registerPieceCommand({
  action: 'flood_fill_piece',
  humanControl: 'detail panel, pieces: the fill tool on the layer canvas',
  description:
    'Flood fill one layer of a piece from a starting cell, replacing every connected voxel that matches it.',
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    x: { kind: 'int', help: 'east-west cell to start from' },
    y: { kind: 'int', help: 'north-south cell to start from' },
    layer: { kind: 'int', help: 'height, 0 at the ground' },
    tile_id: { kind: 'int', help: 'a tile asset id to flood with, or -1 to erase' },
  },
  example: { action: 'flood_fill_piece', piece_id: 0, x: 0, y: 0, layer: 0, tile_id: 8 },
  apply: (context, params) =>
    withPiece(context, params, (piece) =>
      writeVoxels(context, piece, params, (cell) =>
        floodFilledIndices(piece, cell.layer, cell.x, cell.y),
      ),
    ),
});

registerPieceCommand({
  action: 'fill_piece_layer',
  humanControl: 'detail panel, pieces: the clear-layer button',
  description: 'Set every voxel of one layer of a piece at once. tile_id -1 clears the layer.',
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    layer: { kind: 'int', help: 'height, 0 at the ground' },
    tile_id: { kind: 'int', help: 'a tile asset id to fill with, or -1 to clear' },
  },
  example: { action: 'fill_piece_layer', piece_id: 0, layer: 0, tile_id: -1 },
  apply: (context, params) =>
    withPiece(context, params, (piece) =>
      writeVoxels(context, piece, { ...params, x: 0, y: 0 }, (cell) =>
        layerIndices(piece, cell.layer),
      ),
    ),
});

registerPieceCommand({
  action: 'set_piece_voxels',
  humanControl: 'detail panel, pieces: paste layer and undo',
  description:
    "Replace a piece's whole voxel array — the bulk write behind paste and undo. It must be exactly width × depth × layers long.",
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    voxels: { kind: 'json', help: 'an array of tile ids, -1 for empty, in x-then-y-then-layer order' },
  },
  example: { action: 'set_piece_voxels', piece_id: 0, voxels: [-1, -1, -1, -1] },
  apply: (context, params) => withPiece(context, params, (piece) => setVoxels(context, piece, params)),
});

registerPieceCommand({
  action: 'set_piece_role',
  humanControl: 'detail panel, pieces: the role knob',
  description:
    'Tag what part of a building this piece is, so the assembler knows where it may go.',
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    role: { kind: 'text', help: `one of: ${listOf(PIECE_ROLES)}` },
  },
  example: { action: 'set_piece_role', piece_id: 0, role: 'wallSegment' },
  apply: (context, params) => withPiece(context, params, (piece) => setRole(context, piece, params)),
});

registerPieceCommand({
  action: 'set_piece_voxel_facing',
  humanControl: 'detail panel, pieces: the facing tool on the layer canvas',
  description:
    'Turn voxels in place: facing 0-3 is quarter turns clockwise, and rotating the piece turns these with it. Give to_x and to_y to face a whole rectangle at once.',
  params: {
    piece_id: { kind: 'int', help: PIECE_ID_HELP },
    x: { kind: 'int', help: 'east-west cell, 0 at the west edge' },
    y: { kind: 'int', help: 'north-south cell, 0 at the north edge' },
    layer: { kind: 'int', help: 'height, 0 at the ground' },
    facing: { kind: 'int', help: 'quarter turns clockwise, 0 to 3' },
    to_x: { kind: 'int', help: 'east edge of a rectangle to face, defaults to x', optional: true },
    to_y: { kind: 'int', help: 'south edge of a rectangle to face, defaults to y', optional: true },
  },
  example: { action: 'set_piece_voxel_facing', piece_id: 0, x: 2, y: 0, layer: 1, facing: 2 },
  apply: (context, params) =>
    withPiece(context, params, (piece) => setVoxelFacing(context, piece, params)),
});

registerPieceCommand({
  action: 'remove_piece',
  humanControl: 'detail panel, pieces: ✕ beside duplicate',
  description:
    'Delete a piece. Nodes bound to it stop stamping anything, and cultures that bound it to a building role fall back to their tiles.',
  params: { piece_id: { kind: 'int', help: PIECE_ID_HELP } },
  example: { action: 'remove_piece', piece_id: 2 },
  apply: (context, params) =>
    withPiece(context, params, (piece) => {
      context.pieces.remove(piece.id);
      forgetRemovedPieceInRoleBindings(context.cultures, piece.id);
      return commandSucceeded(`removed piece ${piece.id}`);
    }),
});

function withPiece(
  context: CommandContext,
  params: CommandParams,
  use: (piece: Piece) => CommandResult,
): CommandResult {
  const read = readAssetId<'pieces'>(params, 'piece_id');
  if (!read.ok) return read.failure;
  const piece = context.pieces.byId(read.value);
  if (!piece) {
    return commandFailed(
      'unknown_piece',
      `piece_id must be one of: ${listOf(context.pieces.all().map((each) => each.id))}`,
    );
  }
  return use(piece);
}

function setRole(
  context: CommandContext,
  piece: Piece,
  params: CommandParams,
): CommandResult {
  const role = readText(params, 'role');
  if (!role.ok) return role.failure;
  if (!isPieceRole(role.value)) {
    return commandFailed('invalid_value', `role must be one of: ${listOf(PIECE_ROLES)}`);
  }
  context.pieces.update(piece.id, { role: role.value });
  return commandSucceeded(`piece ${piece.id} is a ${role.value}`);
}

function setVoxelFacing(
  context: CommandContext,
  piece: Piece,
  params: CommandParams,
): CommandResult {
  const rect = facingRectFrom(params);
  if (!rect.ok) return rect.failure;
  const { fromX, fromY, toX, toY, layer, facing } = rect.value;
  const facings = [...piece.facings];
  let faced = 0;
  for (let y = fromY; y <= toY; y++) {
    for (let x = fromX; x <= toX; x++) {
      if (!isInsidePiece(piece, x, y, layer)) continue;
      facings[voxelIndex(piece, x, y, layer)] = facing;
      faced++;
    }
  }
  if (faced === 0) return outsidePieceFailure(piece, fromX, fromY, layer);
  context.pieces.update(piece.id, { facings });
  return commandSucceeded(`piece ${piece.id} faced ${faced} voxel(s) toward ${facing}`);
}

type FacingRect =
  | {
      ok: true;
      value: {
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        layer: number;
        facing: number;
      };
    }
  | { ok: false; failure: CommandResult };

function facingRectFrom(params: CommandParams): FacingRect {
  const x = readInt(params, 'x');
  if (!x.ok) return x;
  const y = readInt(params, 'y');
  if (!y.ok) return y;
  const layer = readInt(params, 'layer');
  if (!layer.ok) return layer;
  const facing = readInt(params, 'facing');
  if (!facing.ok) return facing;
  const toX = readOptionalInt(params, 'to_x', x.value);
  const toY = readOptionalInt(params, 'to_y', y.value);
  return {
    ok: true,
    value: {
      fromX: Math.min(x.value, toX),
      fromY: Math.min(y.value, toY),
      toX: Math.max(x.value, toX),
      toY: Math.max(y.value, toY),
      layer: layer.value,
      facing: normalizedQuarterTurns(facing.value),
    },
  };
}

function outsidePieceFailure(
  piece: Piece,
  x: number,
  y: number,
  layer: number,
): CommandResult {
  return commandFailed(
    'invalid_value',
    `(${x},${y},${layer}) is outside piece ${piece.id} — it is ${piece.width}×${piece.depth}×${piece.layers}`,
  );
}

function clampSide(value: number, max: number): number {
  return Math.max(1, Math.min(max, value));
}

function patchOf(piece: Piece): PiecePatch {
  return {
    width: piece.width,
    depth: piece.depth,
    layers: piece.layers,
    anchorX: piece.anchorX,
    anchorY: piece.anchorY,
    voxels: piece.voxels,
    facings: piece.facings,
  };
}

function paintPiece(
  context: CommandContext,
  piece: Piece,
  params: CommandParams,
): CommandResult {
  const cell = paintCellFrom(params);
  if (!cell.ok) return cell.failure;
  const rejection = rejectUnpaintableCell(context, piece, cell.value);
  if (rejection) return rejection;
  const { x, y, layer, tileId } = cell.value;
  const painted = structuredClone(piece);
  paintVoxel(painted, x, y, layer, tileId);
  context.pieces.update(piece.id, { voxels: painted.voxels });
  return commandSucceeded(`piece ${piece.id} (${x},${y},${layer}) = ${tileId}`);
}

type PaintCell =
  | { ok: true; value: PieceCellEdit }
  | { ok: false; failure: CommandResult };

function paintCellFrom(params: CommandParams): PaintCell {
  const x = readInt(params, 'x');
  if (!x.ok) return x;
  const y = readInt(params, 'y');
  if (!y.ok) return y;
  const layer = readInt(params, 'layer');
  if (!layer.ok) return layer;
  const tileId = readAssetId<'tiles'>(params, 'tile_id');
  if (!tileId.ok) return tileId;
  return { ok: true, value: { x: x.value, y: y.value, layer: layer.value, tileId: tileId.value } };
}

function writeVoxels(
  context: CommandContext,
  piece: Piece,
  params: CommandParams,
  indicesOf: (cell: { x: number; y: number; layer: number }) => number[],
): CommandResult {
  const cell = paintCellFrom(params);
  if (!cell.ok) return cell.failure;
  const rejection = rejectUnpaintableCell(context, piece, cell.value);
  if (rejection) return rejection;
  const voxels = [...piece.voxels];
  for (const index of indicesOf(cell.value)) voxels[index] = cell.value.tileId;
  context.pieces.update(piece.id, { voxels });
  return commandSucceeded(`piece ${piece.id} layer ${cell.value.layer} filled with ${cell.value.tileId}`);
}

function rejectUnpaintableCell(
  context: CommandContext,
  piece: Piece,
  cell: PieceCellEdit,
): CommandResult | null {
  if (!isInsidePiece(piece, cell.x, cell.y, cell.layer)) {
    return outsidePieceFailure(piece, cell.x, cell.y, cell.layer);
  }
  if (cell.tileId !== -1 && !context.tileAssets.byId(cell.tileId)) {
    return commandFailed(
      'invalid_value',
      `tile_id must be -1 or one of: ${listOf(context.tileAssets.all().map((tile) => tile.id))}`,
    );
  }
  return null;
}

function layerIndices(piece: Piece, layer: number): number[] {
  const cells = piece.width * piece.depth;
  return Array.from({ length: cells }, (_, cell) => layer * cells + cell);
}

function setVoxels(
  context: CommandContext,
  piece: Piece,
  params: CommandParams,
): CommandResult {
  const voxels = params.voxels;
  const expected = piece.width * piece.depth * piece.layers;
  if (!Array.isArray(voxels) || voxels.some((voxel) => typeof voxel !== 'number')) {
    return commandFailed('invalid_value', "'voxels' must be an array of tile ids");
  }
  if (voxels.length !== expected) {
    return commandFailed(
      'invalid_value',
      `piece ${piece.id} is ${piece.width}×${piece.depth}×${piece.layers}, so 'voxels' must be ${expected} long, not ${voxels.length}`,
    );
  }
  context.pieces.update(piece.id, { voxels: voxels as TileId[] });
  return commandSucceeded(`piece ${piece.id} voxels replaced`);
}
