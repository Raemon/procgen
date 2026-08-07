import { blankInventory } from '../items/inventory/inventoryDef';
import { PLAYER_CHARACTER_ID } from './playerCharacter';
import {
  builtInBillboard,
  MOONLIT_DWARF_ART,
  WANDERING_TRADER_ART,
} from './art/builtInBillboards';
import { CHASE, FLEE, GUARD, WANDER } from './behaviorKinds';
import type { CreatureDef } from './creatureDef';
import { newCharacterWithId } from './creatureDef';
import { CREATURE } from './entityKinds';

export function defaultCreatures(): CreatureDef[] {
  return [
    creature(0, 'deer', 'd', '#c9a06a', WANDER, { speed: 1.4, sight: 9, roam: 10, size: 0.75 }),
    creature(1, 'rabbit', 'r', '#d8d2c4', FLEE, { speed: 3.2, sight: 7, roam: 5, size: 0.4 }),
    creature(2, 'wolf', 'w', '#8f95a3', CHASE, { speed: 2.6, sight: 12, roam: 14, size: 0.7 }),
    creature(3, 'sentry', 's', '#c05a4a', GUARD, { speed: 1.8, sight: 8, roam: 6, size: 0.9 }),
    creature(4, 'ash hound', 'h', '#c25b3d', CHASE, { speed: 3.0, sight: 13, roam: 13, size: 0.65 }),
    creature(5, 'ember wisp', '✦', '#ffb347', WANDER, { speed: 1.1, sight: 6, roam: 8, size: 0.35, phasing: 1 }),
    creature(6, 'fen heron', 'y', '#a8bfb2', FLEE, { speed: 2.4, sight: 8, roam: 6, size: 0.6 }),
    wanderingTrader(7),
    moonlitDwarf(PLAYER_CHARACTER_ID),
  ];
}

function wanderingTrader(id: number): CreatureDef {
  return {
    ...newCharacterWithId(id),
    name: 'wandering trader',
    symbol: 'T',
    color: '#9ec7a5',
    behavior: WANDER,
    speed: 1.2,
    sight: 10,
    roam: 12,
    billboardArt: WANDERING_TRADER_ART,
    billboard: builtInBillboard(WANDERING_TRADER_ART),
    inventory: {
      ...blankInventory(6, 4),
      placements: [
        { itemId: 1, x: 0, y: 0 },
        { itemId: 0, x: 1, y: 0 },
        { itemId: 3, x: 1, y: 1 },
      ],
    },
  };
}

function moonlitDwarf(id: number): CreatureDef {
  return {
    ...newCharacterWithId(id),
    name: 'lanternbearer',
    symbol: '@',
    color: '#c3b8ad',
    behavior: WANDER,
    speed: 1.6,
    sight: 12,
    roam: 8,
    size: 1.4,
    billboardArt: MOONLIT_DWARF_ART,
    billboard: builtInBillboard(MOONLIT_DWARF_ART),
    inventory: blankInventory(8, 5),
  };
}

function creature(
  id: number,
  name: string,
  symbol: string,
  color: string,
  behavior: number,
  motion: { speed: number; sight: number; roam: number; size: number; phasing?: 0 | 1 },
): CreatureDef {
  return {
    id,
    name,
    symbol,
    color,
    faceArt: null,
    behavior,
    phasing: 0,
    kind: CREATURE,
    inventory: null,
    billboardArt: null,
    billboard: null,
    ...motion,
  };
}
