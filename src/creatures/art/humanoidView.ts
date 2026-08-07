import type { CharacterRotation } from '../character/characterBillboard';

export interface HumanoidView {
  headX: number;
  headWidth: number;
  bodyX: number;
  bodyWidth: number;
  eyeColumns: number[];
  hairFront: boolean;
  armColumns: number[];
  legColumns: number[];
  legsSwingSideways: boolean;
  noseColumn: number | null;
}

const VIEWS: Readonly<Record<CharacterRotation, HumanoidView>> = {
  front: {
    headX: 6,
    headWidth: 4,
    bodyX: 5,
    bodyWidth: 6,
    eyeColumns: [6, 9],
    hairFront: false,
    armColumns: [4, 10],
    legColumns: [6, 8],
    legsSwingSideways: false,
    noseColumn: null,
  },
  frontQuarter: {
    headX: 6,
    headWidth: 4,
    bodyX: 5,
    bodyWidth: 5,
    eyeColumns: [7, 9],
    hairFront: false,
    armColumns: [4, 9],
    legColumns: [6, 8],
    legsSwingSideways: true,
    noseColumn: 10,
  },
  side: {
    headX: 6,
    headWidth: 4,
    bodyX: 6,
    bodyWidth: 4,
    eyeColumns: [9],
    hairFront: false,
    armColumns: [7],
    legColumns: [7, 7],
    legsSwingSideways: true,
    noseColumn: 10,
  },
  backQuarter: {
    headX: 6,
    headWidth: 4,
    bodyX: 6,
    bodyWidth: 5,
    eyeColumns: [],
    hairFront: true,
    armColumns: [5, 10],
    legColumns: [7, 9],
    legsSwingSideways: true,
    noseColumn: null,
  },
  back: {
    headX: 6,
    headWidth: 4,
    bodyX: 5,
    bodyWidth: 6,
    eyeColumns: [],
    hairFront: true,
    armColumns: [4, 10],
    legColumns: [6, 8],
    legsSwingSideways: false,
    noseColumn: null,
  },
};

export function humanoidView(rotation: CharacterRotation): HumanoidView {
  return VIEWS[rotation];
}
