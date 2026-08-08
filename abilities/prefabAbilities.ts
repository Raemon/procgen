import { prefabFromWorldRegion, regionSize, type WorldRegion } from '../assets/prefabs/captureRegionAsPrefab';
import {
  isInsidePrefab,
  MAX_PREFAB_LAYERS,
  MAX_PREFAB_SIDE,
  withCenteredAnchor,
  type Prefab,
} from '../assets/prefabs/prefabDef';
import { paintVoxel } from '../assets/prefabs/prefabPainting';
import { floodFilledIndices } from '../assets/prefabs/editor/ops/floodFillLayer';
import { resizedPrefab } from '../assets/prefabs/prefabResize';
import { rotatedPrefab } from '../assets/prefabs/prefabRotation';
import type { PrefabPatch } from '../assets/prefabs/prefabAssets';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityResult,
  type AbilitySpec,
} from './ability';
import { listOf, readInt, readOptionalInt, readText } from './abilityParams';
import { registerAbility } from './abilityRegistry';

const PREFAB_ID_HELP = 'id of an existing prefab — see GET /api/v1/prefabs';

function registerPrefabAbility(
  spec: Omit<AbilitySpec, 'mode' | 'group' | 'changesWorld'>,
): AbilitySpec {
  return registerAbility({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerPrefabAbility({
  action: 'add_prefab',
  humanControl: 'assets panel, prefabs tab: + add prefab',
  description:
    'Create an empty prefab: a width × depth × layers box of tile ids you fill with paint_prefab.',
  params: {},
  example: { action: 'add_prefab' },
  apply: (context) => {
    const prefab = context.prefabs.add();
    return abilitySucceeded(`added prefab ${prefab.id} ('${prefab.name}')`);
  },
});

registerPrefabAbility({
  action: 'duplicate_prefab',
  humanControl: 'assets panel, prefabs tab: ⧉ on a prefab row',
  description: 'Copy a prefab with all its voxels.',
  params: { prefab_id: { kind: 'int', help: PREFAB_ID_HELP } },
  example: { action: 'duplicate_prefab', prefab_id: 0 },
  apply: (context, params) =>
    withPrefab(context, params, (prefab) => {
      const copy = context.prefabs.duplicate(prefab.id);
      return copy
        ? abilitySucceeded(`duplicated prefab ${prefab.id} as ${copy.id}`)
        : abilityFailed('unknown_prefab', `could not duplicate prefab ${prefab.id}`);
    }),
});

registerPrefabAbility({
  action: 'rename_prefab',
  humanControl: 'assets panel, prefabs tab: the name field on a prefab row',
  description: 'Rename a prefab. Nodes bind prefabs by id, so renaming is safe.',
  params: {
    prefab_id: { kind: 'int', help: PREFAB_ID_HELP },
    name: { kind: 'text', help: 'the new name' },
  },
  example: { action: 'rename_prefab', prefab_id: 0, name: 'gatehouse' },
  apply: (context, params) =>
    withPrefab(context, params, (prefab) => {
      const name = readText(params, 'name');
      if (!name.ok) return name.failure;
      context.prefabs.update(prefab.id, { name: name.value });
      return abilitySucceeded(`prefab ${prefab.id} renamed to '${name.value}'`);
    }),
});

registerPrefabAbility({
  action: 'resize_prefab',
  humanControl: 'assets panel, prefabs tab: the size steppers',
  description:
    'Change a prefab\'s box. Voxels outside the new box are dropped; new space starts empty.',
  params: {
    prefab_id: { kind: 'int', help: PREFAB_ID_HELP },
    width: { kind: 'int', help: `east-west tiles, 1 to ${MAX_PREFAB_SIDE}`, optional: true },
    depth: { kind: 'int', help: `north-south tiles, 1 to ${MAX_PREFAB_SIDE}`, optional: true },
    layers: { kind: 'int', help: `height in tiles, 1 to ${MAX_PREFAB_LAYERS}`, optional: true },
  },
  example: { action: 'resize_prefab', prefab_id: 0, width: 7, depth: 7, layers: 5 },
  apply: (context, params) =>
    withPrefab(context, params, (prefab) => {
      const resized = resizedPrefab(prefab, {
        width: clampSide(readOptionalInt(params, 'width', prefab.width), MAX_PREFAB_SIDE),
        depth: clampSide(readOptionalInt(params, 'depth', prefab.depth), MAX_PREFAB_SIDE),
        layers: clampSide(readOptionalInt(params, 'layers', prefab.layers), MAX_PREFAB_LAYERS),
      });
      context.prefabs.update(prefab.id, patchOf(resized));
      return abilitySucceeded(
        `prefab ${prefab.id} is now ${resized.width}×${resized.depth}×${resized.layers}`,
      );
    }),
});

registerPrefabAbility({
  action: 'rotate_prefab',
  humanControl: 'assets panel, prefabs tab: the rotate button',
  description: 'Turn a prefab a quarter turn clockwise, swapping its width and depth.',
  params: { prefab_id: { kind: 'int', help: PREFAB_ID_HELP } },
  example: { action: 'rotate_prefab', prefab_id: 0 },
  apply: (context, params) =>
    withPrefab(context, params, (prefab) => {
      context.prefabs.update(prefab.id, patchOf(rotatedPrefab(prefab, 1)));
      return abilitySucceeded(`prefab ${prefab.id} rotated a quarter turn`);
    }),
});

registerPrefabAbility({
  action: 'paint_prefab',
  humanControl: 'assets panel, prefabs tab: painting on the layer canvas',
  description:
    'Paint one voxel of a prefab. Layer 0 is the ground layer; tile_id -1 erases the voxel.',
  params: {
    prefab_id: { kind: 'int', help: PREFAB_ID_HELP },
    x: { kind: 'int', help: 'east-west cell, 0 at the west edge' },
    y: { kind: 'int', help: 'north-south cell, 0 at the north edge' },
    layer: { kind: 'int', help: 'height, 0 at the ground' },
    tile_id: { kind: 'int', help: 'a tile asset id to place, or -1 to erase' },
  },
  example: { action: 'paint_prefab', prefab_id: 0, x: 2, y: 2, layer: 1, tile_id: 8 },
  apply: (context, params) => withPrefab(context, params, (prefab) => paintPrefab(context, prefab, params)),
});

registerPrefabAbility({
  action: 'flood_fill_prefab',
  humanControl: 'assets panel, prefabs tab: the fill tool on the layer canvas',
  description:
    'Flood fill one layer of a prefab from a starting cell, replacing every connected voxel that matches it.',
  params: {
    prefab_id: { kind: 'int', help: PREFAB_ID_HELP },
    x: { kind: 'int', help: 'east-west cell to start from' },
    y: { kind: 'int', help: 'north-south cell to start from' },
    layer: { kind: 'int', help: 'height, 0 at the ground' },
    tile_id: { kind: 'int', help: 'a tile asset id to flood with, or -1 to erase' },
  },
  example: { action: 'flood_fill_prefab', prefab_id: 0, x: 0, y: 0, layer: 0, tile_id: 8 },
  apply: (context, params) =>
    withPrefab(context, params, (prefab) =>
      writeVoxels(context, prefab, params, (cell) =>
        floodFilledIndices(prefab, cell.layer, cell.x, cell.y),
      ),
    ),
});

registerPrefabAbility({
  action: 'fill_prefab_layer',
  humanControl: 'assets panel, prefabs tab: the clear-layer button',
  description: 'Set every voxel of one layer of a prefab at once. tile_id -1 clears the layer.',
  params: {
    prefab_id: { kind: 'int', help: PREFAB_ID_HELP },
    layer: { kind: 'int', help: 'height, 0 at the ground' },
    tile_id: { kind: 'int', help: 'a tile asset id to fill with, or -1 to clear' },
  },
  example: { action: 'fill_prefab_layer', prefab_id: 0, layer: 0, tile_id: -1 },
  apply: (context, params) =>
    withPrefab(context, params, (prefab) =>
      writeVoxels(context, prefab, { ...params, x: 0, y: 0 }, (cell) =>
        layerIndices(prefab, cell.layer),
      ),
    ),
});

registerPrefabAbility({
  action: 'set_prefab_voxels',
  humanControl: 'assets panel, prefabs tab: paste layer and undo',
  description:
    "Replace a prefab's whole voxel array — the bulk write behind paste and undo. It must be exactly width × depth × layers long.",
  params: {
    prefab_id: { kind: 'int', help: PREFAB_ID_HELP },
    voxels: { kind: 'json', help: 'an array of tile ids, -1 for empty, in x-then-y-then-layer order' },
  },
  example: { action: 'set_prefab_voxels', prefab_id: 0, voxels: [-1, -1, -1, -1] },
  apply: (context, params) => withPrefab(context, params, (prefab) => setVoxels(context, prefab, params)),
});

registerPrefabAbility({
  action: 'remove_prefab',
  humanControl: 'assets panel, prefabs tab: ✕ on a prefab row',
  description: 'Delete a prefab. Nodes bound to it stop stamping anything.',
  params: { prefab_id: { kind: 'int', help: PREFAB_ID_HELP } },
  example: { action: 'remove_prefab', prefab_id: 2 },
  apply: (context, params) =>
    withPrefab(context, params, (prefab) => {
      context.prefabs.remove(prefab.id);
      return abilitySucceeded(`removed prefab ${prefab.id}`);
    }),
});

registerPrefabAbility({
  action: 'capture_region',
  humanControl: 'world view: the capture button, then drag a rectangle',
  description:
    'Lift a rectangle of the world — tiles, standing prefab voxels and terrain height — into a new prefab.',
  params: {
    min_x: { kind: 'int', help: 'west edge of the rectangle, in world tiles' },
    min_y: { kind: 'int', help: 'north edge of the rectangle, in world tiles' },
    max_x: { kind: 'int', help: 'east edge of the rectangle, in world tiles' },
    max_y: { kind: 'int', help: 'south edge of the rectangle, in world tiles' },
    name: { kind: 'text', help: 'a name for the captured prefab', optional: true },
  },
  example: { action: 'capture_region', min_x: -4, min_y: -4, max_x: 4, max_y: 4 },
  apply: (context, params) => captureRegion(context, params),
});

function withPrefab(
  context: AbilityContext,
  params: Record<string, unknown>,
  use: (prefab: Prefab) => AbilityResult,
): AbilityResult {
  const read = readInt(params, 'prefab_id');
  if (!read.ok) return read.failure;
  const prefab = context.prefabs.byId(read.value);
  if (!prefab) {
    return abilityFailed(
      'unknown_prefab',
      `prefab_id must be one of: ${listOf(context.prefabs.all().map((each) => each.id))}`,
    );
  }
  return use(prefab);
}

function clampSide(value: number, max: number): number {
  return Math.max(1, Math.min(max, value));
}

function patchOf(prefab: Prefab): PrefabPatch {
  return {
    width: prefab.width,
    depth: prefab.depth,
    layers: prefab.layers,
    anchorX: prefab.anchorX,
    anchorY: prefab.anchorY,
    voxels: prefab.voxels,
  };
}

function paintPrefab(
  context: AbilityContext,
  prefab: Prefab,
  params: Record<string, unknown>,
): AbilityResult {
  const cell = paintCellFrom(params);
  if (!cell.ok) return cell.failure;
  const rejection = rejectUnpaintableCell(context, prefab, cell.value);
  if (rejection) return rejection;
  const { x, y, layer, tileId } = cell.value;
  const painted = structuredClone(prefab);
  paintVoxel(painted, x, y, layer, tileId);
  context.prefabs.update(prefab.id, { voxels: painted.voxels });
  return abilitySucceeded(`prefab ${prefab.id} (${x},${y},${layer}) = ${tileId}`);
}

type PaintCell =
  | { ok: true; value: { x: number; y: number; layer: number; tileId: number } }
  | { ok: false; failure: AbilityResult };

function paintCellFrom(params: Record<string, unknown>): PaintCell {
  const x = readInt(params, 'x');
  if (!x.ok) return x;
  const y = readInt(params, 'y');
  if (!y.ok) return y;
  const layer = readInt(params, 'layer');
  if (!layer.ok) return layer;
  const tileId = readInt(params, 'tile_id');
  if (!tileId.ok) return tileId;
  return { ok: true, value: { x: x.value, y: y.value, layer: layer.value, tileId: tileId.value } };
}

function writeVoxels(
  context: AbilityContext,
  prefab: Prefab,
  params: Record<string, unknown>,
  indicesOf: (cell: { x: number; y: number; layer: number }) => number[],
): AbilityResult {
  const cell = paintCellFrom(params);
  if (!cell.ok) return cell.failure;
  const rejection = rejectUnpaintableCell(context, prefab, cell.value);
  if (rejection) return rejection;
  const voxels = [...prefab.voxels];
  for (const index of indicesOf(cell.value)) voxels[index] = cell.value.tileId;
  context.prefabs.update(prefab.id, { voxels });
  return abilitySucceeded(`prefab ${prefab.id} layer ${cell.value.layer} filled with ${cell.value.tileId}`);
}

function rejectUnpaintableCell(
  context: AbilityContext,
  prefab: Prefab,
  cell: { x: number; y: number; layer: number; tileId: number },
): AbilityResult | null {
  if (!isInsidePrefab(prefab, cell.x, cell.y, cell.layer)) {
    return abilityFailed(
      'invalid_value',
      `(${cell.x},${cell.y},${cell.layer}) is outside prefab ${prefab.id} — it is ${prefab.width}×${prefab.depth}×${prefab.layers}`,
    );
  }
  if (cell.tileId !== -1 && !context.tileAssets.byId(cell.tileId)) {
    return abilityFailed(
      'invalid_value',
      `tile_id must be -1 or one of: ${listOf(context.tileAssets.all().map((tile) => tile.id))}`,
    );
  }
  return null;
}

function layerIndices(prefab: Prefab, layer: number): number[] {
  const cells = prefab.width * prefab.depth;
  return Array.from({ length: cells }, (_, cell) => layer * cells + cell);
}

function setVoxels(
  context: AbilityContext,
  prefab: Prefab,
  params: Record<string, unknown>,
): AbilityResult {
  const voxels = params.voxels;
  const expected = prefab.width * prefab.depth * prefab.layers;
  if (!Array.isArray(voxels) || voxels.some((voxel) => typeof voxel !== 'number')) {
    return abilityFailed('invalid_value', "'voxels' must be an array of tile ids");
  }
  if (voxels.length !== expected) {
    return abilityFailed(
      'invalid_value',
      `prefab ${prefab.id} is ${prefab.width}×${prefab.depth}×${prefab.layers}, so 'voxels' must be ${expected} long, not ${voxels.length}`,
    );
  }
  context.prefabs.update(prefab.id, { voxels: voxels as number[] });
  return abilitySucceeded(`prefab ${prefab.id} voxels replaced`);
}

function captureRegion(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const region = regionFrom(params);
  if (!region.ok) return region.failure;
  const name = readText(params, 'name');
  const captured = prefabFromWorldRegion(
    context.regionSampler,
    region.value,
    name.ok ? name.value : capturedName(region.value),
  );
  const added = context.prefabs.insert(withCenteredAnchor({ ...captured, id: 0 }));
  const { width, depth } = regionSize(region.value);
  return abilitySucceeded(`captured ${width}×${depth} of world into prefab ${added.id} ('${added.name}')`);
}

type RegionRead = { ok: true; value: WorldRegion } | { ok: false; failure: AbilityResult };

function regionFrom(params: Record<string, unknown>): RegionRead {
  const minX = readInt(params, 'min_x');
  if (!minX.ok) return minX;
  const minY = readInt(params, 'min_y');
  if (!minY.ok) return minY;
  const maxX = readInt(params, 'max_x');
  if (!maxX.ok) return maxX;
  const maxY = readInt(params, 'max_y');
  if (!maxY.ok) return maxY;
  return {
    ok: true,
    value: {
      minX: Math.min(minX.value, maxX.value),
      minY: Math.min(minY.value, maxY.value),
      maxX: Math.max(minX.value, maxX.value),
      maxY: Math.max(minY.value, maxY.value),
    },
  };
}

function capturedName(region: WorldRegion): string {
  return `capture ${region.minX},${region.minY}`;
}
