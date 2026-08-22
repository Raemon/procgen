import type { TileId } from '@/features/asset-library/asset';
import type { TileIdBySlot } from './tileIdBySlot';
import { DEFAULT_LIGHT_INK } from '@/features/game/light/lightEmission';
import { newTileWithId, type TileDef } from '../tiles/tileDef';
import { defaultHeightForTile } from '../tiles/tileHeight';
import type { KitPalette } from './kitPalette';
import { kitStream } from './kitRandom';
import { harmonizedTileColors } from './kitTileColors';
import { composedTileNames } from './kitTileNames';
import { tileSlotsOfKit, type TileSlot } from './kitTileSlots';
import { chosenTileSymbols } from './kitTileSymbols';

export interface GeneratedTiles {
  tiles: TileDef[];
  idBySlot: TileIdBySlot;
}

export interface TileNamingContext {
  takenNames: readonly string[];
  takenSymbols: readonly string[];
  firstId: number;
}

export function generateKitTiles(
  seed: number,
  palette: KitPalette,
  context: TileNamingContext,
): GeneratedTiles {
  const slots = tileSlotsOfKit(kitStream(seed, 'tileSlots'));
  const fields = tileFieldsOf(seed, slots, palette, context);
  return {
    tiles: slots.map((slot, index) => tileOfSlot(slot, index, palette, fields)),
    idBySlot: idsBySlotKey(slots, context.firstId),
  };
}

interface TileFields {
  names: string[];
  symbols: string[];
  colors: string[];
  firstId: number;
}

function tileFieldsOf(
  seed: number,
  slots: readonly TileSlot[],
  palette: KitPalette,
  context: TileNamingContext,
): TileFields {
  return {
    names: composedTileNames(kitStream(seed, 'tileNames'), slots, palette, context.takenNames),
    symbols: chosenTileSymbols(kitStream(seed, 'tileSymbols'), slots.length, context.takenSymbols),
    colors: harmonizedTileColors(kitStream(seed, 'tileColors'), slots, palette.hueBias),
    firstId: context.firstId,
  };
}

function tileOfSlot(
  slot: TileSlot,
  index: number,
  palette: KitPalette,
  fields: TileFields,
): TileDef {
  return {
    ...newTileWithId((fields.firstId + index) as TileId),
    name: fields.names[index] as string,
    symbol: fields.symbols[index] as string,
    color: fields.colors[index] as string,
    walkable: slot.walkable,
    height: slot.height ?? defaultHeightForTile(slot),
    shape: slot.shape,
    textureId: palette.materials[slot.material],
    light: slot.light,
    lightInk: slot.lightInk ?? DEFAULT_LIGHT_INK,
  };
}

function idsBySlotKey(slots: readonly TileSlot[], firstId: number): TileIdBySlot {
  return new Map(slots.map((slot, index) => [slot.key, (firstId + index) as TileId]));
}
