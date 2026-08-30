import type { PieceId } from '@/features/asset-library/asset';
import type { CulturePatch } from '@/features/asset-library/cultures/cultureAssets';
import {
  MAX_STORY_LAYERS,
  MAX_WINDOW_EVERY,
  MIN_STORY_LAYERS,
  MIN_WINDOW_EVERY,
  type Culture,
} from '@/features/asset-library/cultures/cultureDef';
import { isPieceRole, PIECE_ROLES } from '@/features/asset-library/pieces/pieceDef';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { listOf, readAssetId, readOptionalAssetId,
  readOptionalInt, readText } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: cultureCommands } = createCommandCollection();
export { cultureCommands };



const CULTURE_ID_HELP = 'id of an existing culture — see GET /api/v1/asset-library/cultures';

function registerCultureCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerCultureCommand({
  action: 'add_culture',
  humanControl: 'asset library, cultures folder: + add culture',
  description:
    'Create a culture: the building vocabulary — tiles, piece roles and proportions — that the assembler builds a village with.',
  params: {},
  example: { action: 'add_culture' },
  apply: (context) => {
    const culture = context.cultures.add();
    return commandSucceeded(`added culture ${culture.id} ('${culture.name}')`);
  },
});

registerCultureCommand({
  action: 'rename_culture',
  humanControl: 'detail panel, cultures: the name field',
  description: 'Rename a culture. Nodes bind cultures by id, so renaming is safe.',
  params: {
    culture_id: { kind: 'int', help: CULTURE_ID_HELP },
    name: { kind: 'text', help: 'the new name' },
  },
  example: { action: 'rename_culture', culture_id: 0, name: 'hill folk' },
  apply: (context, params) =>
    withCulture(context, params, (culture) => {
      const name = readText(params, 'name');
      if (!name.ok) return name.failure;
      context.cultures.update(culture.id, { name: name.value });
      return commandSucceeded(`culture ${culture.id} renamed to '${name.value}'`);
    }),
});

registerCultureCommand({
  action: 'duplicate_culture',
  humanControl: 'detail panel, cultures: ⧉ duplicate',
  description: 'Copy a culture, its tiles and role bindings included, as a new culture with its own id.',
  params: { culture_id: { kind: 'int', help: CULTURE_ID_HELP } },
  example: { action: 'duplicate_culture', culture_id: 0 },
  apply: (context, params) =>
    withCulture(context, params, (culture) => {
      const copy = context.cultures.duplicate(culture.id);
      return copy
        ? commandSucceeded(`duplicated culture ${culture.id} as ${copy.id}`)
        : commandFailed('unknown_culture', `could not duplicate culture ${culture.id}`);
    }),
});

registerCultureCommand({
  action: 'remove_culture',
  humanControl: 'detail panel, cultures: ✕ beside duplicate',
  description: 'Delete a culture. Points bound to it stop growing buildings.',
  params: { culture_id: { kind: 'int', help: CULTURE_ID_HELP } },
  example: { action: 'remove_culture', culture_id: 1 },
  apply: (context, params) =>
    withCulture(context, params, (culture) => {
      context.cultures.remove(culture.id);
      return commandSucceeded(`removed culture ${culture.id}`);
    }),
});

registerCultureCommand({
  action: 'set_culture_tiles',
  humanControl: 'detail panel, cultures: the tile pickers',
  description:
    'Choose the tiles a culture builds from. These are what the assembler paints wherever no piece is bound, so a culture with tiles alone still yields a whole building.',
  params: {
    culture_id: { kind: 'int', help: CULTURE_ID_HELP },
    wall_tile: { kind: 'int', help: 'tile for wall columns, or -1 for none', optional: true },
    trim_tile: { kind: 'int', help: 'tile for corners, doorframes and chimneys', optional: true },
    roof_slope_tile: { kind: 'int', help: 'tile for the sloping roof faces', optional: true },
    roof_ridge_tile: { kind: 'int', help: 'tile along the roof ridge', optional: true },
    floor_tile: { kind: 'int', help: 'tile under every interior cell', optional: true },
    path_tile: { kind: 'int', help: 'tile for the paths and yards around a building', optional: true },
  },
  example: { action: 'set_culture_tiles', culture_id: 0, wall_tile: 3, roof_slope_tile: 5 },
  apply: (context, params) =>
    withCulture(context, params, (culture) => {
      context.cultures.update(culture.id, tilePatchOf(culture, params));
      return commandSucceeded(`culture ${culture.id} tiles updated`);
    }),
});

registerCultureCommand({
  action: 'set_culture_numbers',
  humanControl: 'detail panel, cultures: the roof, story and window steppers',
  description:
    'Set the proportions of a culture: roof style 0 for a gable and 1 for a hip, wall layers per story, and how often a window interrupts a wall.',
  params: {
    culture_id: { kind: 'int', help: CULTURE_ID_HELP },
    roof_style: { kind: 'int', help: '0 for a gable roof, 1 for a hip roof', optional: true },
    story_layers: {
      kind: 'int',
      help: `wall layers in one story, ${MIN_STORY_LAYERS} to ${MAX_STORY_LAYERS}`,
      optional: true,
    },
    window_every: {
      kind: 'int',
      help: `a window every this many wall cells, ${MIN_WINDOW_EVERY} to ${MAX_WINDOW_EVERY}`,
      optional: true,
    },
  },
  example: { action: 'set_culture_numbers', culture_id: 0, roof_style: 1, story_layers: 3 },
  apply: (context, params) =>
    withCulture(context, params, (culture) => {
      context.cultures.update(culture.id, numberPatchOf(culture, params));
      return commandSucceeded(`culture ${culture.id} proportions updated`);
    }),
});

registerCultureCommand({
  action: 'bind_culture_role',
  humanControl: 'detail panel, cultures: the piece list beside a role',
  description:
    'Bind the pieces a culture may use for one building role. The assembler picks between them per cell, and falls back to plain tiles for any role left unbound.',
  params: {
    culture_id: { kind: 'int', help: CULTURE_ID_HELP },
    role: { kind: 'text', help: `one of: ${listOf(PIECE_ROLES)}` },
    piece_ids: { kind: 'json', help: 'an array of piece ids, or [] to unbind the role' },
  },
  example: { action: 'bind_culture_role', culture_id: 0, role: 'wallSegment', piece_ids: [2, 3] },
  apply: (context, params) => withCulture(context, params, (culture) => bindRole(context, culture, params)),
});

function withCulture(
  context: CommandContext,
  params: CommandParams,
  use: (culture: Culture) => CommandResult,
): CommandResult {
  const read = readAssetId<'cultures'>(params, 'culture_id');
  if (!read.ok) return read.failure;
  const culture = context.cultures.byId(read.value);
  if (!culture) {
    return commandFailed(
      'unknown_culture',
      `culture_id must be one of: ${listOf(context.cultures.all().map((each) => each.id))}`,
    );
  }
  return use(culture);
}

function tilePatchOf(culture: Culture, params: CommandParams): CulturePatch {
  return {
    wallTileId: readOptionalAssetId<'tiles'>(params, 'wall_tile', culture.wallTileId),
    trimTileId: readOptionalAssetId<'tiles'>(params, 'trim_tile', culture.trimTileId),
    roofSlopeTileId: readOptionalAssetId<'tiles'>(params, 'roof_slope_tile', culture.roofSlopeTileId),
    roofRidgeTileId: readOptionalAssetId<'tiles'>(params, 'roof_ridge_tile', culture.roofRidgeTileId),
    floorTileId: readOptionalAssetId<'tiles'>(params, 'floor_tile', culture.floorTileId),
    pathTileId: readOptionalAssetId<'tiles'>(params, 'path_tile', culture.pathTileId),
  };
}

function numberPatchOf(culture: Culture, params: CommandParams): CulturePatch {
  return {
    roofStyle: readOptionalInt(params, 'roof_style', culture.roofStyle) === 1 ? 1 : 0,
    storyLayers: clamped(
      readOptionalInt(params, 'story_layers', culture.storyLayers),
      MIN_STORY_LAYERS,
      MAX_STORY_LAYERS,
    ),
    windowEvery: clamped(
      readOptionalInt(params, 'window_every', culture.windowEvery),
      MIN_WINDOW_EVERY,
      MAX_WINDOW_EVERY,
    ),
  };
}

function bindRole(
  context: CommandContext,
  culture: Culture,
  params: CommandParams,
): CommandResult {
  const role = readText(params, 'role');
  if (!role.ok) return role.failure;
  if (!isPieceRole(role.value)) {
    return commandFailed('invalid_value', `role must be one of: ${listOf(PIECE_ROLES)}`);
  }
  const pieceIds = readPieceIds(context, params);
  if (!pieceIds.ok) return pieceIds.failure;
  context.cultures.update(culture.id, {
    roleBindings: { ...culture.roleBindings, [role.value]: pieceIds.value },
  });
  return commandSucceeded(`culture ${culture.id} ${role.value} = ${listOf(pieceIds.value)}`);
}

type PieceIdsRead = { ok: true; value: number[] } | { ok: false; failure: CommandResult };

function readPieceIds(
  context: CommandContext,
  params: CommandParams,
): PieceIdsRead {
  const raw = params.piece_ids;
  if (!Array.isArray(raw) || raw.some((id) => typeof id !== 'number')) {
    return { ok: false, failure: commandFailed('invalid_value', "'piece_ids' must be an array of piece ids") };
  }
  const unknown = (raw as PieceId[]).filter((id) => !context.pieces.byId(id));
  if (unknown.length > 0) {
    return {
      ok: false,
      failure: commandFailed('unknown_piece', `no such piece: ${listOf(unknown)}`),
    };
  }
  return { ok: true, value: raw as number[] };
}

function clamped(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
