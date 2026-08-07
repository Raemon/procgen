import { blankInventory, type InventoryDef } from '../items/inventory/inventoryDef';
import type { CubeFaceArt } from '../world/tiles/tileFaceArt';
import { WANDER } from './behaviorKinds';
import { CHARACTER, CREATURE } from './entityKinds';

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
  size: number;
  phasing: 0 | 1;
  kind: number;
  inventory: InventoryDef | null;
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
    size: 0.7,
    phasing: 0,
    kind: CREATURE,
    inventory: null,
  };
}

export function newCharacterWithId(id: number): CreatureDef {
  return {
    ...newCreatureWithId(id),
    name: `character ${id}`,
    symbol: 'C',
    color: '#8ab4e8',
    size: 0.8,
    kind: CHARACTER,
    inventory: blankInventory(),
  };
}

export function isCharacter(creature: CreatureDef): boolean {
  return creature.kind === CHARACTER;
}
