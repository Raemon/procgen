import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import {
  DOOR_FACE_ART,
  DOOR_STANDS_TALL,
  LEVER_FACE_ART,
  LEVER_STANDS_LOW,
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
    off: { glyph: '▫', color: '#b08f5a', tag: 'pressure plate, unweighted', ...FLAT },
    on: { glyph: '▪', color: '#7fdc6a', tag: 'pressure plate, weighted', ...FLAT },
  },
  crate: {
    off: { glyph: '▣', color: '#a9743f', tag: 'crate, push it by walking into it', ...FLAT },
    on: { glyph: '▣', color: '#a9743f', tag: 'crate, push it by walking into it', ...FLAT },
  },
  pillar: {
    off: { glyph: '■', color: '#6d6d6d', tag: 'pillar, immovable', ...FLAT },
    on: { glyph: '■', color: '#6d6d6d', tag: 'pillar, immovable', ...FLAT },
  },
  gate: GATE_LOOKS.mechanism,
};

export function fixtureLook(kind: PuzzleFixtureKind, isOn: boolean): FixtureLook {
  return LOOKS[kind][isOn ? 'on' : 'off'];
}

export function gateLook(lock: DoorLock, isOn: boolean): FixtureLook {
  return GATE_LOOKS[lock][isOn ? 'on' : 'off'];
}

