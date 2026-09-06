import { ARCANE_CORE } from '@/features/asset-library/tiles/art/fixtures/crateArt';
import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import {
  CHARGED_CRATE_GLOW,
  CRATE_FACE_ART,
  CRATE_FOOTPRINT,
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
  PRESSED_PLATE_GLOW,
} from './fixtureFaceArt';
import type { PuzzleFixtureKind } from './fixtureKinds';

export interface FixtureLook {
  glyph: string;
  color: string;
  tag: string;
  faceArt: CubeFaceArt | null;
  standingHeight?: number;
  seeThroughUnpaintedArt?: boolean;
  glow?: number;
  footprint?: number;
}

export type DoorLock = 'key' | 'mechanism';

const DOOR_STANDS_OPEN: FixtureLook = {
  glyph: "'",
  color: '#6fb98a',
  tag: 'unlocked door, standing open',
  faceArt: DOOR_FACE_ART.on,
  standingHeight: DOOR_STANDS_TALL,
  seeThroughUnpaintedArt: true,
};

const GATE_LOOKS: Record<DoorLock, { off: FixtureLook; on: FixtureLook }> = {
  key: {
    off: {
      glyph: '+',
      color: '#e0b33c',
      tag: 'locked door, a keyhole in its brass plate',
      faceArt: DOOR_FACE_ART.key,
      standingHeight: DOOR_STANDS_TALL,
    },
    on: DOOR_STANDS_OPEN,
  },
  mechanism: {
    off: {
      glyph: '+',
      color: '#c05a4a',
      tag: 'door barred from within',
      faceArt: DOOR_FACE_ART.mechanism,
      standingHeight: DOOR_STANDS_TALL,
    },
    on: DOOR_STANDS_OPEN,
  },
};

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
      tag: 'pressure plate, weighted down and glowing',
      faceArt: PLATE_FACE_ART.on,
      standingHeight: PLATE_SINKS_UNDER_A_CRATE,
      glow: PRESSED_PLATE_GLOW,
    },
  },
  crate: {
    off: {
      glyph: '▣',
      color: ARCANE_CORE,
      tag: 'crate: a caged power core, push it by walking into it',
      faceArt: CRATE_FACE_ART.off,
      standingHeight: CRATE_STANDS_SQUAT,
      footprint: CRATE_FOOTPRINT,
    },
    on: {
      glyph: '▩',
      color: ARCANE_CORE,
      tag: 'crate, its power core charged on the pressure plate beneath it',
      faceArt: CRATE_FACE_ART.on,
      standingHeight: CRATE_STANDS_SQUAT,
      footprint: CRATE_FOOTPRINT,
      glow: CHARGED_CRATE_GLOW,
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
  gate: GATE_LOOKS.mechanism,
};

export function fixtureLook(kind: PuzzleFixtureKind, isOn: boolean): FixtureLook {
  return LOOKS[kind][isOn ? 'on' : 'off'];
}

export function gateLook(lock: DoorLock, isOn: boolean): FixtureLook {
  return GATE_LOOKS[lock][isOn ? 'on' : 'off'];
}

