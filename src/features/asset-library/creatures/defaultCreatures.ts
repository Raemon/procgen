import { assetId, type CreatureId } from '@/features/asset-library/asset';
import { builtInBillboard, GAUNT_ONE_ART, MOONLIT_DWARF_ART } from './art/builtInBillboards';
import { wolfFaceArt } from './art/wolfFaceArt';
import { CHASE, FLEE, GUARD, WANDER } from './behaviorKinds';
import { newCharacterWithId, newCreatureWithId, type CreatureDef } from './creatureDef';

export const GAUNT_ONE_ID = creatureId(8);

export function defaultCreatures(): CreatureDef[] {
  return [
    {
      ...newCreatureWithId(creatureId(0)),
      name: 'deer',
      symbol: 'd',
      color: '#c9a06a',
      behavior: WANDER,
      speed: 1.4,
      sight: 9,
      roam: 10,
      bodyWidth: 0.75,
      bodyHeight: 0.75,
    },
    {
      ...newCreatureWithId(creatureId(1)),
      name: 'rabbit',
      symbol: 'r',
      color: '#d8d2c4',
      behavior: FLEE,
      speed: 3.2,
      sight: 7,
      roam: 5,
      bodyWidth: 0.4,
      bodyHeight: 0.4,
    },
    {
      ...newCreatureWithId(creatureId(2)),
      name: 'wolf',
      symbol: 'w',
      color: '#8f95a3',
      faceArt: wolfFaceArt(),
      behavior: CHASE,
      speed: 2.6,
      sight: 12,
      roam: 14,
    },
    {
      ...newCreatureWithId(creatureId(3)),
      name: 'sentry',
      symbol: 's',
      color: '#c05a4a',
      behavior: GUARD,
      speed: 1.8,
      sight: 8,
      roam: 6,
      bodyWidth: 0.9,
      bodyHeight: 0.9,
    },
    {
      ...newCreatureWithId(creatureId(4)),
      name: 'ash hound',
      symbol: 'h',
      color: '#c25b3d',
      behavior: CHASE,
      speed: 3,
      sight: 13,
      roam: 13,
      bodyWidth: 0.65,
      bodyHeight: 0.65,
    },
    {
      ...newCreatureWithId(creatureId(5)),
      name: 'ember wisp',
      symbol: '✦',
      color: '#ffb347',
      behavior: WANDER,
      phasing: 1,
      speed: 1.1,
      sight: 6,
      roam: 8,
      bodyWidth: 0.35,
      bodyHeight: 0.35,
    },
    {
      ...newCreatureWithId(creatureId(6)),
      name: 'fen heron',
      symbol: 'y',
      color: '#a8bfb2',
      behavior: FLEE,
      speed: 2.4,
      sight: 8,
      roam: 6,
      bodyWidth: 0.6,
      bodyHeight: 0.6,
    },
    {
      ...newCharacterWithId(creatureId(7)),
      name: 'lanternbearer',
      symbol: '@',
      color: '#c3b8ad',
      behavior: WANDER,
      speed: 1.5,
      sight: 8,
      roam: 6,
      billboardArt: MOONLIT_DWARF_ART,
      billboard: builtInBillboard(MOONLIT_DWARF_ART),
    },
    {
      ...newCreatureWithId(GAUNT_ONE_ID),
      name: 'gaunt one',
      symbol: 'G',
      color: '#9db98a',
      behavior: CHASE,
      speed: 2.2,
      sight: 14,
      roam: 9,
      bodyWidth: 0.9,
      bodyHeight: 2,
      billboardArt: GAUNT_ONE_ART,
      billboard: builtInBillboard(GAUNT_ONE_ART),
    },
  ];
}

function creatureId(id: number): CreatureId {
  return assetId<'creatures'>(id);
}
