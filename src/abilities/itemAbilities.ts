import {
  clampGridSide,
  isItemOrientation,
  isItemRender,
  normalizedTags,
  ORIENTATION_CHOICES,
  RENDER_CHOICES,
} from '../items/itemDef';
import type { ItemPatch } from '../items/itemLibrary';
import { isSpriteArt } from '../world/tiles/spriteArt';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityResult,
  type AbilitySpec,
} from './ability';
import { listOf, readInt, readNumber, readText } from './abilityParams';
import { registerAbility } from './abilityRegistry';
import { faceArtFrom } from './tileAbilities';

const ITEM_ID_HELP = 'id of an existing item — see GET /api/v1/items';

function registerItemAbility(
  spec: Omit<AbilitySpec, 'mode' | 'group' | 'changesWorld'>,
): AbilitySpec {
  return registerAbility({ ...spec, mode: 'god', group: 'library', changesWorld: true });
}

registerItemAbility({
  action: 'add_item',
  humanControl: 'library panel, items tab: + add item',
  description:
    'Create an item definition — pixel art plus how it is drawn in the world and how much inventory space it takes.',
  params: {},
  example: { action: 'add_item' },
  apply: (context) => {
    const item = context.items.add();
    return abilitySucceeded(`added item ${item.id} ('${item.symbol}')`);
  },
});

registerItemAbility({
  action: 'duplicate_item',
  humanControl: 'library panel, items tab: ⧉ on an item row',
  description: 'Copy an item definition with its art, render knobs, footprint and tags.',
  params: { item_id: { kind: 'int', help: ITEM_ID_HELP } },
  example: { action: 'duplicate_item', item_id: 0 },
  apply: (context, params) =>
    withItem(context, params, (itemId) => {
      const copy = context.items.duplicate(itemId);
      return copy
        ? abilitySucceeded(`duplicated item ${itemId} as ${copy.id}`)
        : abilityFailed('unknown_item', `could not duplicate item ${itemId}`);
    }),
});

registerItemAbility({
  action: 'update_item',
  humanControl: 'library panel, items tab: the fields and knobs on an item row',
  description:
    "Change an item's art, how it is drawn in the world, the inventory space it takes, or the tags that decide which slots accept it. Only the fields you pass change.",
  params: {
    item_id: { kind: 'int', help: ITEM_ID_HELP },
    name: { kind: 'text', help: 'the item name', optional: true },
    symbol: { kind: 'text', help: 'the single character it draws as in an observation', optional: true },
    color: { kind: 'text', help: 'a #rrggbb color — the ascii ink and the fallback when there is no art', optional: true },
    render: { kind: 'int', help: renderHelp(), optional: true },
    orientation: { kind: 'int', help: orientationHelp(), optional: true },
    thickness: { kind: 'number', help: 'billboard only: how thick the extruded sprite is, in tiles', optional: true },
    edge_color: { kind: 'text', help: 'billboard only: a #rrggbb color for the extruded rim', optional: true },
    size: { kind: 'number', help: 'how large it is drawn in the world, in tiles', optional: true },
    hover: { kind: 'number', help: 'how far above the ground it floats, in tiles', optional: true },
    sprite: {
      kind: 'json',
      help: 'billboard art: a flat array of size*size "#rrggbb" strings and nulls, where null is transparent; or null to clear it',
      optional: true,
    },
    face_art: { kind: 'json', help: 'cube art as GET /api/v1/tiles reports it, or null to clear it', optional: true },
    grid_width: { kind: 'int', help: 'how many inventory columns it fills (1-8)', optional: true },
    grid_height: { kind: 'int', help: 'how many inventory rows it fills (1-8)', optional: true },
    tags: {
      kind: 'json',
      help: 'an array of tag strings; a tagged inventory slot only accepts items sharing one of its tags',
      optional: true,
    },
  },
  example: { action: 'update_item', item_id: 1, grid_width: 1, grid_height: 2, tags: ['weapon'] },
  apply: (context, params) => updateItem(context, params),
});

registerItemAbility({
  action: 'remove_item',
  humanControl: 'library panel, items tab: ✕ on an item row',
  description:
    'Delete an item definition. Nodes bound to it stop spawning it and inventories holding it drop it.',
  params: { item_id: { kind: 'int', help: ITEM_ID_HELP } },
  example: { action: 'remove_item', item_id: 4 },
  apply: (context, params) =>
    withItem(context, params, (itemId) => {
      context.items.remove(itemId);
      return abilitySucceeded(`removed item ${itemId}`);
    }),
});

function renderHelp(): string {
  return `how it is drawn in the world — ${choiceList(RENDER_CHOICES)}`;
}

function orientationHelp(): string {
  return `billboard only: how the quad is turned — ${choiceList(ORIENTATION_CHOICES)}`;
}

function choiceList(choices: readonly { value: number; label: string }[]): string {
  return choices.map((choice) => `${choice.value}=${choice.label}`).join(', ');
}

export function withItem(
  context: AbilityContext,
  params: Record<string, unknown>,
  use: (itemId: number) => AbilityResult,
): AbilityResult {
  const read = readInt(params, 'item_id');
  if (!read.ok) return read.failure;
  if (!context.items.byId(read.value)) {
    return abilityFailed(
      'unknown_item',
      `item_id must be one of: ${listOf(context.items.all().map((item) => item.id))}`,
    );
  }
  return use(read.value);
}

function updateItem(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  return withItem(context, params, (itemId) => {
    const patch = itemPatchFrom(params);
    if (!patch.ok) return patch.failure;
    context.items.update(itemId, patch.value);
    return abilitySucceeded(`item ${itemId} updated: ${listOf(Object.keys(patch.value))}`);
  });
}

type ItemPatchRead = { ok: true; value: ItemPatch } | { ok: false; failure: AbilityResult };

function itemPatchFrom(params: Record<string, unknown>): ItemPatchRead {
  const patch: ItemPatch = {};
  applyTextFields(patch, params);
  applyNumberFields(patch, params);
  const choices = applyChoiceFields(patch, params);
  if (!choices.ok) return choices;
  const art = applyArtFields(patch, params);
  if (!art.ok) return art;
  const tags = tagsFrom(params);
  if (!tags.ok) return tags;
  if (tags.value !== undefined) patch.tags = tags.value;
  return { ok: true, value: patch };
}

function applyTextFields(patch: ItemPatch, params: Record<string, unknown>): void {
  const name = readText(params, 'name');
  if (name.ok) patch.name = name.value;
  const color = readText(params, 'color');
  if (color.ok) patch.color = color.value;
  const edgeColor = readText(params, 'edge_color');
  if (edgeColor.ok) patch.edgeColor = edgeColor.value;
  const symbol = readText(params, 'symbol');
  if (symbol.ok) patch.symbol = [...symbol.value][0]!;
}

function applyNumberFields(patch: ItemPatch, params: Record<string, unknown>): void {
  for (const knob of ['thickness', 'size', 'hover'] as const) {
    const read = readNumber(params, knob);
    if (read.ok) patch[knob] = read.value;
  }
  const width = readInt(params, 'grid_width');
  if (width.ok) patch.gridWidth = clampGridSide(width.value);
  const height = readInt(params, 'grid_height');
  if (height.ok) patch.gridHeight = clampGridSide(height.value);
}

function applyChoiceFields(
  patch: ItemPatch,
  params: Record<string, unknown>,
): { ok: true } | { ok: false; failure: AbilityResult } {
  const render = readInt(params, 'render');
  if (render.ok) {
    if (!isItemRender(render.value)) {
      return { ok: false, failure: abilityFailed('invalid_value', `'render' — ${renderHelp()}`) };
    }
    patch.render = render.value;
  }
  const orientation = readInt(params, 'orientation');
  if (orientation.ok) {
    if (!isItemOrientation(orientation.value)) {
      return {
        ok: false,
        failure: abilityFailed('invalid_value', `'orientation' — ${orientationHelp()}`),
      };
    }
    patch.orientation = orientation.value;
  }
  return { ok: true };
}

function applyArtFields(
  patch: ItemPatch,
  params: Record<string, unknown>,
): { ok: true } | { ok: false; failure: AbilityResult } {
  const sprite = spriteFrom(params);
  if (!sprite.ok) return sprite;
  if (sprite.value !== undefined) patch.sprite = sprite.value;
  const art = faceArtFrom(params);
  if (!art.ok) return art;
  if (art.value !== undefined) patch.faceArt = art.value;
  return { ok: true };
}

type SpriteRead =
  | { ok: true; value: ItemPatch['sprite'] | undefined }
  | { ok: false; failure: AbilityResult };

export function spriteFrom(params: Record<string, unknown>, name = 'sprite'): SpriteRead {
  const raw = params[name];
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: null };
  if (!isSpriteArt(raw)) {
    return {
      ok: false,
      failure: abilityFailed(
        'invalid_value',
        `'${name}' must be a square array of "#rrggbb" strings and nulls, or null to clear it`,
      ),
    };
  }
  return { ok: true, value: raw };
}

type TagsRead = { ok: true; value: string[] | undefined } | { ok: false; failure: AbilityResult };

export function tagsFrom(params: Record<string, unknown>, name = 'tags'): TagsRead {
  const raw = params[name];
  if (raw === undefined) return { ok: true, value: undefined };
  if (!Array.isArray(raw) || raw.some((tag) => typeof tag !== 'string')) {
    return {
      ok: false,
      failure: abilityFailed('invalid_value', `'${name}' must be an array of tag strings`),
    };
  }
  return { ok: true, value: normalizedTags(raw as string[]) };
}
