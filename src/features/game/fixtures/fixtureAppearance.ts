import type { PuzzleFixtureKind } from './fixtureKinds';
import { CRATE_LOOKS } from './looks/crate';
import { GATE_LOOKS } from './looks/door';
import { LEVER_LOOKS } from './looks/lever';
import type { DoorLock, FixtureLook, LookPair } from './looks/look';
import { PILLAR_LOOKS } from './looks/pillar';
import { PLATE_LOOKS } from './looks/plate';

export type { DoorLock, FixtureLook } from './looks/look';

const LOOKS: Record<PuzzleFixtureKind, LookPair> = {
  lever: LEVER_LOOKS,
  plate: PLATE_LOOKS,
  crate: CRATE_LOOKS,
  pillar: PILLAR_LOOKS,
  gate: GATE_LOOKS.mechanism,
};

export function fixtureLook(kind: PuzzleFixtureKind, isOn: boolean): FixtureLook {
  return LOOKS[kind][isOn ? 'on' : 'off'];
}

export function gateLook(lock: DoorLock, isOn: boolean): FixtureLook {
  return GATE_LOOKS[lock][isOn ? 'on' : 'off'];
}
