import type { TileShapeKind } from '../tiles/tileShapeKind';
import type { RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import { intBetween, rotated } from './kitRandom';
import type { MaterialRole } from './materialRoleAffinity';

export interface TileSlot {
  key: string;
  form: string;
  material: MaterialRole;
  shape: TileShapeKind;
  walkable: boolean;
  height: number | null;
  lightness: number;
  light: number;
  lightInk: string | null;
}

const KNEE_HEIGHT = 0.5;
const EMBER_INK = '#ff8a3c';
const LANTERN_INK = '#ffcf7a';
const FEWEST_ACCENTS = 1;
const MOST_ACCENTS = 2;

export const BUILDING_TILE_SLOTS: readonly TileSlot[] = [
  slot('wall', 'wall', 'wall', 'cube', false, 0.55),
  slot('footing', 'footing', 'wall', 'slabLower', true, 0.45),
  slot('roofSlope', 'roof', 'roof', 'stairs', false, 0.5),
  slot('roofRidge', 'roof ridge', 'roof', 'ramp', false, 0.56),
  slot('floor', 'floor', 'floor', 'slabLower', true, 0.5),
  slot('beam', 'beam', 'trim', 'panel', false, 0.4),
  slot('window', 'window', 'trim', 'panel', false, 0.62),
  slot('door', 'door', 'trim', 'panel', false, 0.42),
  slot('chimney', 'chimney', 'wall', 'cube', false, 0.52),
  slot('stair', 'stair', 'wall', 'stairs', true, 0.58),
  slot('path', 'path', 'ground', 'cube', true, 0.6),
];

const ACCENT_TILE_SLOTS: readonly TileSlot[] = [
  { ...slot('bench', 'bench', 'trim', 'slabLower', false, 0.48), height: KNEE_HEIGHT },
  { ...slot('lanternPost', 'lantern post', 'trim', 'panel', false, 0.6), light: 7, lightInk: LANTERN_INK },
  { ...slot('hearth', 'hearth', 'wall', 'slabLower', false, 0.45), height: KNEE_HEIGHT, light: 5, lightInk: EMBER_INK },
  slot('markerStone', 'marker stone', 'wall', 'cube', false, 0.5),
  { ...slot('trough', 'water trough', 'trim', 'slabLower', false, 0.5), height: KNEE_HEIGHT },
  slot('planter', 'planter box', 'ground', 'cube', false, 0.5),
];

export function tileSlotsOfKit(random: RandomStream): TileSlot[] {
  return [...BUILDING_TILE_SLOTS, ...chosenAccentSlots(random)];
}

function chosenAccentSlots(random: RandomStream): TileSlot[] {
  const wanted = intBetween(random, FEWEST_ACCENTS, MOST_ACCENTS);
  const start = Math.floor(random() * ACCENT_TILE_SLOTS.length);
  return rotated(ACCENT_TILE_SLOTS, start).slice(0, wanted);
}

function slot(
  key: string,
  form: string,
  material: MaterialRole,
  shape: TileShapeKind,
  walkable: boolean,
  lightness: number,
): TileSlot {
  return { key, form, material, shape, walkable, height: null, lightness, light: 0, lightInk: null };
}
