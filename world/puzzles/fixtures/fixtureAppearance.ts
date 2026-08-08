import type { CubeFaceArt } from '../../../assets/tiles/tileFaceArt';
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

export function everyFixtureLook(): FixtureLook[] {
  return Object.values(LOOKS).flatMap((pair) => [pair.off, pair.on]);
}
