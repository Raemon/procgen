import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import {
  CRATE_FACE_ART,
  CRATE_STANDS_SQUAT,
  DOOR_FACE_ART,
  DOOR_STANDS_TALL,
  LEVER_FACE_ART,
  LEVER_STANDS_LOW,
  PILLAR_FACE_ART,
  PILLAR_STANDS_TALL,
  PLATE_FACE_ART,
  PLATE_LIES_FLAT,
  PLATE_SINKS_UNDER_A_CRATE,
} from './fixtureFaceArt';
import type { PuzzleFixtureKind } from './puzzleFixture';

export interface FixtureLook {
  glyph: string;
  color: string;
  tag: string;
  faceArt: CubeFaceArt | null;
  standingHeight?: number;
  seeThroughUnpaintedArt?: boolean;
}

const FLAT = { faceArt: null };

const LOOKS: Record<PuzzleFixtureKind, { off: FixtureLook; on: FixtureLook }> = {
  lever: {
    off: {
      glyph: '⌐',
      color: '#9aa7b4',
      tag: 'lever, not yet pulled',
      faceArt: LEVER_FACE_ART.off,
      standingHeight: LEVER_STANDS_LOW,
    },
    on: {
      glyph: '¬',
      color: '#7fdc6a',
      tag: 'lever, pulled',
      faceArt: LEVER_FACE_ART.on,
      standingHeight: LEVER_STANDS_LOW,
    },
  },
  key: {
    off: { glyph: '♦', color: '#ffd24a', tag: 'key', ...FLAT },
    on: { glyph: '♦', color: '#5a5a4a', tag: 'key, already taken', ...FLAT },
  },
  plate: {
    off: {
      glyph: '◻',
      color: '#f0b043',
      tag: 'pressure plate, waiting for a crate',
      faceArt: PLATE_FACE_ART.off,
      standingHeight: PLATE_LIES_FLAT,
    },
    on: {
      glyph: '◼',
      color: '#6fe08a',
      tag: 'pressure plate, weighted down',
      faceArt: PLATE_FACE_ART.on,
      standingHeight: PLATE_SINKS_UNDER_A_CRATE,
    },
  },
  crate: {
    off: {
      glyph: '▣',
      color: '#a06a33',
      tag: 'crate, push it by walking into it',
      faceArt: CRATE_FACE_ART.off,
      standingHeight: CRATE_STANDS_SQUAT,
    },
    on: {
      glyph: '▩',
      color: '#a06a33',
      tag: 'crate, settled on a pressure plate',
      faceArt: CRATE_FACE_ART.on,
      standingHeight: CRATE_STANDS_SQUAT,
    },
  },
  pillar: {
    off: {
      glyph: '■',
      color: '#7b7368',
      tag: 'pillar, immovable',
      faceArt: PILLAR_FACE_ART,
      standingHeight: PILLAR_STANDS_TALL,
    },
    on: {
      glyph: '■',
      color: '#7b7368',
      tag: 'pillar, immovable',
      faceArt: PILLAR_FACE_ART,
      standingHeight: PILLAR_STANDS_TALL,
    },
  },
  gate: {
    off: {
      glyph: '+',
      color: '#c05a4a',
      tag: 'locked door',
      faceArt: DOOR_FACE_ART.off,
      standingHeight: DOOR_STANDS_TALL,
    },
    on: {
      glyph: "'",
      color: '#6fb98a',
      tag: 'unlocked door, standing open',
      faceArt: DOOR_FACE_ART.on,
      standingHeight: DOOR_STANDS_TALL,
      seeThroughUnpaintedArt: true,
    },
  },
};

export function fixtureLook(kind: PuzzleFixtureKind, isOn: boolean): FixtureLook {
  return LOOKS[kind][isOn ? 'on' : 'off'];
}

