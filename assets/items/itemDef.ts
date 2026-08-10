import { clampLightRadius, DEFAULT_LIGHT_INK } from '../../world/light/lightEmission';
import type { SpriteArt } from '../tiles/spriteArt';
import type { CubeFaceArt } from '../tiles/tileFaceArt';

export const BILLBOARD = 0;
const CUBE = 1;

export const RENDER_CHOICES = [
  {
    value: BILLBOARD,
    label: 'billboard',
    help: 'The sprite extruded into a slab. Transparent pixels stay see-through and the rim follows the painted outline, shaded from the pixels it was cut from.',
  },
  {
    value: CUBE,
    label: 'cube',
    help: 'The cube face art wrapped onto a floating cube, painted face by face exactly like a tile.',
  },
] as const;

const UPRIGHT = 0;
export const LYING_FLAT = 1;

export const ORIENTATION_CHOICES = [
  {
    value: UPRIGHT,
    label: 'vertical',
    help: 'The billboard stands up out of the ground, read face on.',
  },
  {
    value: LYING_FLAT,
    label: 'horizontal',
    help: 'The billboard lies flat on the ground, read from above.',
  },
] as const;

export const MAX_ITEM_GRID_SIDE = 8;

export interface ItemDef {
  id: number;
  name: string;
  symbol: string;
  color: string;
  render: number;
  orientation: number;
  thickness: number;
  edgeColor: string;
  size: number;
  hover: number;
  sprite: SpriteArt | null;
  faceArt: CubeFaceArt | null;
  gridWidth: number;
  gridHeight: number;
  tags: string[];
  light: number;
  lightInk: string;
}

export function newItemWithId(id: number): ItemDef {
  return {
    id,
    name: `item ${id}`,
    symbol: 'i',
    color: '#d9c27a',
    render: BILLBOARD,
    orientation: UPRIGHT,
    thickness: 0.12,
    edgeColor: '#6b5a34',
    size: 0.6,
    hover: 0.35,
    sprite: null,
    faceArt: null,
    gridWidth: 1,
    gridHeight: 1,
    tags: [],
    light: 0,
    lightInk: DEFAULT_LIGHT_INK,
  };
}

export function itemWithSanitizedLight(item: ItemDef): ItemDef {
  return {
    ...item,
    light: clampLightRadius(item.light),
    lightInk: typeof item.lightInk === 'string' ? item.lightInk : DEFAULT_LIGHT_INK,
  };
}

export function renderLabel(render: number): string {
  return RENDER_CHOICES.find((choice) => choice.value === render)?.label ?? 'billboard';
}

export function orientationLabel(orientation: number): string {
  return ORIENTATION_CHOICES.find((choice) => choice.value === orientation)?.label ?? 'vertical';
}

export function isItemRender(value: number): boolean {
  return RENDER_CHOICES.some((choice) => choice.value === value);
}

export function isItemOrientation(value: number): boolean {
  return ORIENTATION_CHOICES.some((choice) => choice.value === value);
}

export function clampGridSide(side: number): number {
  return Math.max(1, Math.min(MAX_ITEM_GRID_SIDE, Math.round(side)));
}

export function normalizedTags(tags: readonly string[]): string[] {
  const cleaned = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag !== '');
  return [...new Set(cleaned)];
}
