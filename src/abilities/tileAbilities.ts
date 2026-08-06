import { isCubeFaceArt } from '../world/tiles/tileFaceArt';
import type { EditableTileFields } from '../world/tiles/tileset';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityResult,
  type AbilitySpec,
} from './ability';
import { listOf, readInt, readText } from './abilityParams';
import { registerAbility } from './abilityRegistry';

const TILE_ID_HELP = 'id of an existing tile — see GET /api/v1/tiles';

function registerTileAbility(
  spec: Omit<AbilitySpec, 'mode' | 'group' | 'changesWorld'>,
): AbilitySpec {
  return registerAbility({ ...spec, mode: 'god', group: 'library', changesWorld: true });
}

registerTileAbility({
  action: 'add_tile',
  humanControl: 'library panel, tiles tab: + add tile',
  description:
    'Create a tile type. Procgen nodes reference tiles by id, so add the tile before pointing a node at it.',
  params: {},
  example: { action: 'add_tile' },
  apply: (context) => {
    const tile = context.tileset.add();
    return abilitySucceeded(`added tile ${tile.id} ('${tile.symbol}')`);
  },
});

registerTileAbility({
  action: 'update_tile',
  humanControl: 'library panel, tiles tab: the fields on a tile row',
  description:
    "Change a tile's look or walkability. Only the fields you pass change; walkable decides whether anyone can stand on it.",
  params: {
    tile_id: { kind: 'int', help: TILE_ID_HELP },
    name: { kind: 'text', help: 'the tile name shown in menus and the observation legend', optional: true },
    symbol: { kind: 'text', help: 'the single character this tile draws as in an observation', optional: true },
    color: { kind: 'text', help: 'a #rrggbb color', optional: true },
    walkable: { kind: 'int', help: '1 if anyone may stand on this tile, 0 if it blocks', optional: true },
    face_art: {
      kind: 'json',
      help: 'cube face art as GET /api/v1/tiles reports it, or null to clear it',
      optional: true,
    },
  },
  example: { action: 'update_tile', tile_id: 2, name: 'meadow', color: '#7bbf5a' },
  apply: (context, params) => updateTile(context, params),
});

registerTileAbility({
  action: 'remove_tile',
  humanControl: 'library panel, tiles tab: ✕ on a tile row',
  description: 'Delete a tile type. Nodes still pointing at its id fall back to drawing nothing.',
  params: { tile_id: { kind: 'int', help: TILE_ID_HELP } },
  example: { action: 'remove_tile', tile_id: 7 },
  apply: (context, params) =>
    withTile(context, params, (tileId) => {
      context.tileset.remove(tileId);
      return abilitySucceeded(`removed tile ${tileId}`);
    }),
});

function withTile(
  context: AbilityContext,
  params: Record<string, unknown>,
  use: (tileId: number) => AbilityResult,
): AbilityResult {
  const read = readInt(params, 'tile_id');
  if (!read.ok) return read.failure;
  if (!context.tileset.byId(read.value)) {
    return abilityFailed(
      'unknown_tile',
      `tile_id must be one of: ${listOf(context.tileset.all().map((tile) => tile.id))}`,
    );
  }
  return use(read.value);
}

function updateTile(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  return withTile(context, params, (tileId) => {
    const patch = tilePatchFrom(params);
    if (!patch.ok) return patch.failure;
    context.tileset.update(tileId, patch.value);
    return abilitySucceeded(`tile ${tileId} updated: ${listOf(Object.keys(patch.value))}`);
  });
}

type TilePatch = { ok: true; value: EditableTileFields } | { ok: false; failure: AbilityResult };

function tilePatchFrom(params: Record<string, unknown>): TilePatch {
  const patch: EditableTileFields = {};
  const name = readText(params, 'name');
  if (name.ok) patch.name = name.value;
  const color = readText(params, 'color');
  if (color.ok) patch.color = color.value;
  const symbol = symbolFrom(params);
  if (symbol !== null) patch.symbol = symbol;
  const walkable = readInt(params, 'walkable');
  if (walkable.ok) patch.walkable = walkable.value !== 0;
  const art = faceArtFrom(params);
  if (!art.ok) return art;
  if (art.value !== undefined) patch.faceArt = art.value;
  return { ok: true, value: patch };
}

function symbolFrom(params: Record<string, unknown>): string | null {
  const symbol = readText(params, 'symbol');
  return symbol.ok ? [...symbol.value][0]! : null;
}

type ArtRead =
  | { ok: true; value: EditableTileFields['faceArt'] | undefined }
  | { ok: false; failure: AbilityResult };

export function faceArtFrom(params: Record<string, unknown>): ArtRead {
  const raw = params.face_art;
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: null };
  if (!isCubeFaceArt(raw)) {
    return {
      ok: false,
      failure: abilityFailed('invalid_value', "'face_art' must be cube face art, or null to clear it"),
    };
  }
  return { ok: true, value: raw };
}
