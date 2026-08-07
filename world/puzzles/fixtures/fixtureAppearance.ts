import type { PuzzleFixtureKind } from './puzzleFixture';

export interface FixtureLook {
  glyph: string;
  color: string;
  tag: string;
}

const LOOKS: Record<PuzzleFixtureKind, { off: FixtureLook; on: FixtureLook }> = {
  lever: {
    off: { glyph: '⌐', color: '#9aa7b4', tag: 'lever, not yet pulled' },
    on: { glyph: '¬', color: '#7fdc6a', tag: 'lever, pulled' },
  },
  key: {
    off: { glyph: '♦', color: '#ffd24a', tag: 'key' },
    on: { glyph: '♦', color: '#5a5a4a', tag: 'key, already taken' },
  },
  plate: {
    off: { glyph: '▫', color: '#b08f5a', tag: 'pressure plate, unweighted' },
    on: { glyph: '▪', color: '#7fdc6a', tag: 'pressure plate, weighted' },
  },
  crate: {
    off: { glyph: '▣', color: '#a9743f', tag: 'crate, push it by walking into it' },
    on: { glyph: '▣', color: '#a9743f', tag: 'crate, push it by walking into it' },
  },
  pillar: {
    off: { glyph: '■', color: '#6d6d6d', tag: 'pillar, immovable' },
    on: { glyph: '■', color: '#6d6d6d', tag: 'pillar, immovable' },
  },
  gate: {
    off: { glyph: '+', color: '#c05a4a', tag: 'locked door' },
    on: { glyph: "'", color: '#6fb98a', tag: 'unlocked door' },
  },
};

export function fixtureLook(kind: PuzzleFixtureKind, isOn: boolean): FixtureLook {
  return LOOKS[kind][isOn ? 'on' : 'off'];
}

export function everyFixtureLook(): FixtureLook[] {
  return Object.values(LOOKS).flatMap((pair) => [pair.off, pair.on]);
}
