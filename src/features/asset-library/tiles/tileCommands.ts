import type { TileId } from '@/features/asset-library/asset';
import { clampLightRadius, MAX_LIGHT_RADIUS } from '@/features/game/light/lightEmission';
import { isCubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import type { EditableTileFields } from '@/features/asset-library/tiles/tileAssets';
import { TILE_SHAPE_KINDS } from '@/features/asset-library/tiles/tileShapeKind';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { listOf, readAssetId, readInt, readNumber, readText } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: tileCommands } = createCommandCollection();
export { tileCommands };



const TILE_ID_HELP = 'id of an existing tile — see GET /api/v1/asset-library/tiles';

function registerTileCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerTileCommand({
  action: 'add_tile',
  humanControl: 'asset library, tiles folder: + add tile',
  description:
    'Create a tile type. Procgen nodes reference tiles by id, so add the tile before pointing a node at it.',
  params: {},
  example: { action: 'add_tile' },
  apply: (context) => {
    const tile = context.tileAssets.add();
    return commandSucceeded(`added tile ${tile.id} ('${tile.symbol}')`);
  },
});

registerTileCommand({
  action: 'update_tile',
  humanControl: 'detail panel, tiles: the fields on a tile row',
  description:
    "Change a tile's look or walkability. Only the fields you pass change; walkable decides whether anyone can stand on it.",
  params: {
    tile_id: { kind: 'int', help: TILE_ID_HELP },
    name: { kind: 'text', help: 'the tile name shown in menus and the observation legend', optional: true },
    symbol: { kind: 'text', help: 'the single character this tile draws as in an observation', optional: true },
    color: { kind: 'text', help: 'a #rrggbb color, or #rrggbbaa with aa=00 for transparent', optional: true },
    walkable: { kind: 'int', help: '1 if anyone may stand on this tile, 0 if it blocks', optional: true },
    height: {
      kind: 'number',
      help: 'how tall a blocking tile stands in the 3-D view, in tiles — blockers default to 2, walkable tiles are always drawn flat',
      optional: true,
    },
    light: {
      kind: 'number',
      help: `how far the tile lights the dark around it, in tiles (0-${MAX_LIGHT_RADIUS}); 0 means it emits no light`,
      optional: true,
    },
    light_ink: { kind: 'text', help: 'a #rrggbb color for the light this tile casts', optional: true },
    face_art: {
      kind: 'json',
      help: 'cube face art as GET /api/v1/asset-library/tiles reports it, or null to clear it',
      optional: true,
    },
  },
  example: { action: 'update_tile', tile_id: 2, name: 'meadow', color: '#7bbf5a' },
  apply: (context, params) => updateTile(context, params),
});

registerTileCommand({
  action: 'duplicate_tile',
  humanControl: 'asset library, tiles folder: ⧉ on a tile row',
  description: 'Copy a tile, art and knobs included, as a new tile with its own id.',
  params: { tile_id: { kind: 'int', help: TILE_ID_HELP } },
  example: { action: 'duplicate_tile', tile_id: 0 },
  apply: (context, params) =>
    withTile(context, params, (tileId) => {
      const copy = context.tileAssets.duplicate(tileId);
      return copy
        ? commandSucceeded(`duplicated tile ${tileId} as ${copy.id}`)
        : commandFailed('unknown_tile', `could not duplicate tile ${tileId}`);
    }),
});

registerTileCommand({
  action: 'remove_tile',
  humanControl: 'detail panel, tiles: ✕ on a tile row',
  description: 'Delete a tile type. Nodes still pointing at its id fall back to drawing nothing.',
  params: { tile_id: { kind: 'int', help: TILE_ID_HELP } },
  example: { action: 'remove_tile', tile_id: 7 },
  apply: (context, params) =>
    withTile(context, params, (tileId) => {
      context.tileAssets.remove(tileId);
      return commandSucceeded(`removed tile ${tileId}`);
    }),
});

registerTileCommand({
  action: 'set_tile_shape',
  humanControl: 'detail panel, tiles: the shape dropdown on a tile row',
  description: `Choose the solid this tile draws as in the 3-D view. Shapes are: ${listOf(TILE_SHAPE_KINDS)}. Everything but cube leaves part of the cell open and is turned by the per-voxel facing.`,
  params: {
    tile_id: { kind: 'int', help: TILE_ID_HELP },
    shape: { kind: 'int', help: `index into the shape list: ${TILE_SHAPE_KINDS.map((kind, index) => `${index}=${kind}`).join(', ')}` },
  },
  example: { action: 'set_tile_shape', tile_id: 3, shape: 1 },
  apply: (context, params) => setTileShape(context, params),
});

function setTileShape(context: CommandContext, params: CommandParams): CommandResult {
  return withTile(context, params, (tileId) => {
    const read = readInt(params, 'shape');
    if (!read.ok) return read.failure;
    const shape = TILE_SHAPE_KINDS[read.value];
    if (!shape) return commandFailed('invalid_value', `shape must be one of: ${listOf(TILE_SHAPE_KINDS.map((_, index) => index))}`);
    context.tileAssets.update(tileId, { shape });
    return commandSucceeded(`tile ${tileId} draws as ${shape}`);
  });
}

function withTile(
  context: CommandContext,
  params: CommandParams,
  use: (tileId: TileId) => CommandResult,
): CommandResult {
  const read = readAssetId<'tiles'>(params, 'tile_id');
  if (!read.ok) return read.failure;
  if (!context.tileAssets.byId(read.value)) {
    return commandFailed(
      'unknown_tile',
      `tile_id must be one of: ${listOf(context.tileAssets.all().map((tile) => tile.id))}`,
    );
  }
  return use(read.value);
}

function updateTile(context: CommandContext, params: CommandParams): CommandResult {
  return withTile(context, params, (tileId) => {
    const patch = tilePatchFrom(params);
    if (!patch.ok) return patch.failure;
    context.tileAssets.update(tileId, patch.value);
    return commandSucceeded(`tile ${tileId} updated: ${listOf(Object.keys(patch.value))}`);
  });
}

type TilePatch = { ok: true; value: EditableTileFields } | { ok: false; failure: CommandResult };

function tilePatchFrom(params: CommandParams): TilePatch {
  const patch: EditableTileFields = {};
  const name = readText(params, 'name');
  if (name.ok) patch.name = name.value;
  const color = readText(params, 'color');
  if (color.ok) patch.color = color.value;
  const symbol = symbolFrom(params);
  if (symbol !== null) patch.symbol = symbol;
  const walkable = readInt(params, 'walkable');
  if (walkable.ok) patch.walkable = walkable.value !== 0;
  const height = readNumber(params, 'height');
  if (height.ok && height.value > 0) patch.height = height.value;
  const light = readNumber(params, 'light');
  if (light.ok) patch.light = clampLightRadius(light.value);
  const lightInk = readText(params, 'light_ink');
  if (lightInk.ok) patch.lightInk = lightInk.value;
  const art = faceArtFrom(params);
  if (!art.ok) return art;
  if (art.value !== undefined) patch.faceArt = art.value;
  return { ok: true, value: patch };
}

function symbolFrom(params: CommandParams): string | null {
  const symbol = readText(params, 'symbol');
  return symbol.ok ? [...symbol.value][0]! : null;
}

type ArtRead =
  | { ok: true; value: EditableTileFields['faceArt'] | undefined }
  | { ok: false; failure: CommandResult };

export function faceArtFrom(params: CommandParams): ArtRead {
  const raw = params.face_art;
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: null };
  if (!isCubeFaceArt(raw)) {
    return {
      ok: false,
      failure: commandFailed('invalid_value', "'face_art' must be cube face art, or null to clear it"),
    };
  }
  return { ok: true, value: raw };
}
