import type { CharacterRotation } from '@/features/asset-library/characters/characterBillboard';

export interface DwarfAnatomy {
  headCenterX: number;
  headHalfWidth: number;
  faceTurn: number;
  showsFace: boolean;
  torsoCenterX: number;
  shoulderHalfWidth: number;
  chestHalfWidth: number;
  waistHalfWidth: number;
  hipHalfWidth: number;
  legCenterX: readonly [number, number];
  legsSwingSideways: boolean;
  armCenterX: readonly [number, number];
  lanternHand: 0 | 1;
  braidsInFront: boolean;
  cloakHalfWidth: number;
  cloakOverBody: boolean;
}

const ANATOMIES: Readonly<Record<CharacterRotation, DwarfAnatomy>> = {
  front: {
    headCenterX: 0,
    headHalfWidth: 15,
    faceTurn: 0,
    showsFace: true,
    torsoCenterX: 0,
    shoulderHalfWidth: 25,
    chestHalfWidth: 21,
    waistHalfWidth: 17,
    hipHalfWidth: 19,
    legCenterX: [-9, 9],
    legsSwingSideways: false,
    armCenterX: [-24, 24],
    lanternHand: 1,
    braidsInFront: true,
    cloakHalfWidth: 32,
    cloakOverBody: false,
  },
  frontQuarter: {
    headCenterX: 3,
    headHalfWidth: 13,
    faceTurn: 0.55,
    showsFace: true,
    torsoCenterX: 2,
    shoulderHalfWidth: 21,
    chestHalfWidth: 18,
    waistHalfWidth: 15,
    hipHalfWidth: 16,
    legCenterX: [-6, 7],
    legsSwingSideways: true,
    armCenterX: [-18, 20],
    lanternHand: 1,
    braidsInFront: true,
    cloakHalfWidth: 27,
    cloakOverBody: false,
  },
  side: {
    headCenterX: 4,
    headHalfWidth: 12,
    faceTurn: 1,
    showsFace: true,
    torsoCenterX: 1,
    shoulderHalfWidth: 14,
    chestHalfWidth: 14,
    waistHalfWidth: 12,
    hipHalfWidth: 13,
    legCenterX: [-2, 2],
    legsSwingSideways: true,
    armCenterX: [-4, 6],
    lanternHand: 1,
    braidsInFront: false,
    cloakHalfWidth: 20,
    cloakOverBody: false,
  },
  backQuarter: {
    headCenterX: 2,
    headHalfWidth: 13,
    faceTurn: 0.55,
    showsFace: false,
    torsoCenterX: 1,
    shoulderHalfWidth: 21,
    chestHalfWidth: 19,
    waistHalfWidth: 15,
    hipHalfWidth: 16,
    legCenterX: [-7, 6],
    legsSwingSideways: true,
    armCenterX: [-20, 18],
    lanternHand: 0,
    braidsInFront: false,
    cloakHalfWidth: 28,
    cloakOverBody: true,
  },
  back: {
    headCenterX: 0,
    headHalfWidth: 15,
    faceTurn: 0,
    showsFace: false,
    torsoCenterX: 0,
    shoulderHalfWidth: 25,
    chestHalfWidth: 21,
    waistHalfWidth: 17,
    hipHalfWidth: 19,
    legCenterX: [-9, 9],
    legsSwingSideways: false,
    armCenterX: [-24, 24],
    lanternHand: 0,
    braidsInFront: false,
    cloakHalfWidth: 33,
    cloakOverBody: true,
  },
};

export function dwarfAnatomy(rotation: CharacterRotation): DwarfAnatomy {
  return ANATOMIES[rotation];
}
