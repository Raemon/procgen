import { readFileSync } from 'node:fs';
import { allAbilities } from '../abilities/abilityRegistry';
import {
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
} from '../world/vision/characterSight';

const PROTOCOL_SOURCE = 'multiplayer/client/protocol.ts';
const TERRAIN_WORDS = ['tile', 'chunk', 'voxel', 'height', 'elevation', 'prefab', 'terrain'];
const VIEW_STATE_WORDS = ['camera', 'zoom', 'pan', 'panel_width', 'view_mode', 'collapse'];

export function checkDesignBetsStillHold(check: (name: string, condition: boolean) => void): void {
  checkTerrainNeverCrossesTheWire(check);
  checkSightRadiusCostsGrowWithItsSquare(check);
  checkViewStateIsNotAnAbility(check);
}

function checkTerrainNeverCrossesTheWire(check: (name: string, condition: boolean) => void): void {
  const source = readFileSync(PROTOCOL_SOURCE, 'utf8');
  const messageFields = fieldNamesOfMessageTypes(source);
  check(
    'the wire carries poses and speech, never terrain, because both ends regenerate the world from its seed',
    messageFields.every(
      (field) => !TERRAIN_WORDS.some((word) => field.toLowerCase().includes(word)),
    ),
  );
  check(
    'a snapshot row is six numbers, so its cost is per player rather than per tile',
    /export type SnapshotRow = \[number, number, number, number, number, number\]/.test(source),
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

function checkViewStateIsNotAnAbility(check: (name: string, condition: boolean) => void): void {
  check(
    'no ability changes what you are looking at, only what is there for an observation to report',
    allAbilities().every(
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

function fieldNamesOfMessageTypes(source: string): string[] {
  const names: string[] = [];
  for (const line of source.split('\n')) {
    const match = line.match(/^\s{2}(\w+)\??:/);
    if (match) names.push(match[1]!);
  }
  return names;
}
