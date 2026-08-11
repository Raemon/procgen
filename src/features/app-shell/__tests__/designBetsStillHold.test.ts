import { readFileSync } from 'node:fs';
import { allCommands } from '@/features/app-shell/runtime/commands/commandCatalog';
import { decodeServer, encodeServer } from '@/features/game/multiplayer/client/codec';
import { Op, type SnapshotMsg } from '@/features/game/multiplayer/client/protocol';
import {
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
} from '@/features/game/vision/characterSight';

const PROTOCOL_SOURCE = 'src/features/game/multiplayer/client/protocol.ts';
const TERRAIN_WORDS = ['tile', 'chunk', 'voxel', 'height', 'elevation', 'piece', 'terrain'];
const VIEW_STATE_WORDS = ['camera', 'zoom', 'pan', 'panel_width', 'view_mode', 'collapse'];

export function checkDesignBetsStillHold(check: (name: string, condition: boolean) => void): void {
  checkTerrainNeverCrossesTheWire(check);
  checkSightRadiusCostsGrowWithItsSquare(check);
  checkViewStateIsNotACommand(check);
}

function checkTerrainNeverCrossesTheWire(check: (name: string, condition: boolean) => void): void {
  const messageFields = fieldNamesOfMessageTypes(readFileSync(PROTOCOL_SOURCE, 'utf8'));
  check(
    'the wire protocol still declares fields this check can read, so it cannot pass by finding nothing',
    messageFields.length >= 10,
  );
  check(
    'the wire carries poses and speech, never terrain, because both ends regenerate the world from its seed',
    messageFields.every(
      (field) => !TERRAIN_WORDS.some((word) => field.toLowerCase().includes(word)),
    ),
  );
  check(
    'a snapshot row survives the wire as six numbers, so its cost is per player rather than per tile',
    everyRowOfARoundTrippedSnapshotIsSixNumbers(),
  );
}

function checkSightRadiusCostsGrowWithItsSquare(
  check: (name: string, condition: boolean) => void,
): void {
  const cellsAt = (radius: number) => characterViewSize(radius) ** 2;
  check(
    'doubling sight radius roughly quadruples the tiles an agent must read, so seeing farther is a trade',
    cellsAt(24) > 3.5 * cellsAt(12) && cellsAt(24) < 4.5 * cellsAt(12),
  );
  check(
    'every sight radius in range yields an odd-sided window, so the agent stays centred on it',
    everyRadiusInRange().every((radius) => characterViewSize(radius) % 2 === 1),
  );
}

function checkViewStateIsNotACommand(check: (name: string, condition: boolean) => void): void {
  check(
    'no command changes what you are looking at, only what is there for an observation to report',
    allCommands().every(
      (spec) => !VIEW_STATE_WORDS.some((word) => spec.action.toLowerCase().includes(word)),
    ),
  );
}

function everyRadiusInRange(): number[] {
  const radii: number[] = [];
  for (
    let radius = MIN_CHARACTER_SIGHT_RADIUS_TILES;
    radius <= MAX_CHARACTER_SIGHT_RADIUS_TILES;
    radius += 1
  ) {
    radii.push(radius);
  }
  return radii;
}

function everyRowOfARoundTrippedSnapshotIsSixNumbers(): boolean {
  const sent: SnapshotMsg = [Op.Snapshot, 7, [[1, 2, 3, 4, 5, 6]]];
  const received = decodeServer(encodeServer(sent));
  if (!Array.isArray(received) || received[0] !== Op.Snapshot) return false;
  return received[2].every(
    (row) => row.length === 6 && row.every((value) => typeof value === 'number'),
  );
}

function fieldNamesOfMessageTypes(source: string): string[] {
  const names: string[] = [];
  for (const line of source.split('\n')) {
    const match = line.match(/^\s{2}(\w+)\??:/);
    if (match) names.push(match[1]!);
  }
  return names;
}
