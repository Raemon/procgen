import type { PuzzleFixtureKind } from '@/features/game/fixtures/fixtureKinds';

const ACTIONS: Record<PuzzleFixtureKind, { off: string | null; on: string | null }> = {
  lever: { off: 'pull the lever', on: null },
  gate: { off: 'try the locked door', on: null },
  plate: { off: null, on: null },
  crate: { off: null, on: null },
  pillar: { off: null, on: null },
};

export function fixtureAction(kind: PuzzleFixtureKind, isOn: boolean): string | null {
  return ACTIONS[kind][isOn ? 'on' : 'off'];
}
