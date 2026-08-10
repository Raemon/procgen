import type { KnobParamSpec } from '../../nodeType';
import { CARVER_CHOICES, CARVER_DFS } from '../maze/mazeCarvers';

export const LABYRINTH_GEOMETRY_PARAMS: Record<string, KnobParamSpec> = {
    roomFraction: {
      kind: 'number',
      label: 'room share',
      help: 'Fraction of chunks beyond the tutorial rings that become puzzle rooms; the rest are carved into dense one-chunk warrens.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.75,
    },
    tutorialRings: {
      kind: 'int',
      label: 'tutorial rings',
      help: 'Rings of chunks around the origin forced to be rooms, so the opening minutes teach the puzzle kinds before any warren appears.',
      min: 1,
      max: 6,
      default: 3,
    },
    corridor: {
      kind: 'int',
      label: 'doorway width',
      help: 'Width in tiles of every doorway and of the warren passages. 1 is single file; 3 lets two walk abreast.',
      min: 1,
      max: 3,
      default: 1,
    },
    wall: {
      kind: 'int',
      label: 'wall thickness',
      help: 'Thickness of the wall ring around each room and of the warren walls, in tiles.',
      min: 1,
      max: 2,
      default: 1,
    },
    braid: {
      kind: 'number',
      label: 'braid',
      help: 'Fraction of warren dead ends opened into loops. 0 keeps each warren a perfect maze; higher values add alternate routes.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.15,
    },
    carver: {
      kind: 'choice',
      label: 'carver',
      help: 'The algorithm that carves each warren chunk; each has a distinct corridor character.',
      options: CARVER_CHOICES,
      default: CARVER_DFS,
    },
    doorJitter: {
      kind: 'number',
      label: 'door jitter',
      help: 'How far each ring’s outward door may wander from the pure golden-angle spiral. 0 is a strict spiral; 1 lets doors drift up to a half-octant.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
    },
};
