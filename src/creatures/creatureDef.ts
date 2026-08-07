import { blankInventory, type InventoryDef } from '../items/inventory/inventoryDef';
import { BLANK_CHARACTER_ART, builtInBillboard } from './art/builtInBillboards';
import type { CharacterBillboard } from './character/characterBillboard';
import type { CubeFaceArt } from '../world/tiles/tileFaceArt';
import { WANDER } from './behaviorKinds';
import { CHARACTER, CREATURE } from './entityKinds';

export const CREATURE_BODY = { width: 0.7, height: 0.7 };
export const CHARACTER_BODY = { width: 1, height: 2 };

export interface CreatureDef {
  id: number;
  name: string;
  symbol: string;
  color: string;
  faceArt: CubeFaceArt | null;
  behavior: number;
  speed: number;
  sight: number;
  roam: number;
  bodyWidth: number;
  bodyHeight: number;
  phasing: 0 | 1;
  kind: number;
  inventory: InventoryDef | null;
  billboardArt: string | null;
  billboard: CharacterBillboard | null;
}

export function newCreatureWithId(id: number): CreatureDef {
  return {
    id,
    name: `creature ${id}`,
    symbol: 'c',
    color: '#e0a05a',
    faceArt: null,
    behavior: WANDER,
    speed: 1.5,
    sight: 8,
    roam: 6,
    bodyWidth: CREATURE_BODY.width,
    bodyHeight: CREATURE_BODY.height,
    phasing: 0,
    kind: CREATURE,
    inventory: null,
    billboardArt: null,
    billboard: null,
  };
}

export function newCharacterWithId(id: number): CreatureDef {
  return {
    ...newCreatureWithId(id),
    name: `character ${id}`,
    symbol: 'C',
    color: '#8ab4e8',
    bodyWidth: CHARACTER_BODY.width,
    bodyHeight: CHARACTER_BODY.height,
    kind: CHARACTER,
    inventory: blankInventory(),
    billboardArt: BLANK_CHARACTER_ART,
    billboard: builtInBillboard(BLANK_CHARACTER_ART),
  };
}

export function isCharacter(creature: CreatureDef): boolean {
  return creature.kind === CHARACTER;
}
