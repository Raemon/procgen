import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { CLIMB_STEPS_PER_JUMP, LEVEL_STEP } from '@/features/game/climbing';
import { buildObservation, type AgentObservation } from '../observation';
import { observationText } from '../observationText';
import { meadowTiles, MEADOW_TILE, stubSampler } from './observationTestKit';

export function checkElevationObservation(check: CheckReporter): void {
  const facingNorth = { x: 0, y: 0, facing: 0 as const };
  const flat = buildObservation(meadowAt(() => 5), meadowTiles, facingNorth, 'character');
  check('flat ground sends no elevation grid at all', flat.elevation === null && !observationText(flat).includes('elevation'));

  const sloped = buildObservation(meadowAt((_x, y) => Math.max(0, -y)), meadowTiles, facingNorth, 'character');
  check('varied ground sends one elevation row per view row, each as wide as the view', sloped.elevation !== null && sloped.elevation.length === sloped.viewSize && sloped.elevation.every((row) => row.length === sloped.viewSize));
  check('each digit counts the climb steps that tile stands above the lowest ground in view, written base-36', digitAt(sloped, 0, -8) === 'g' && digitAt(sloped, 0, -1) === '2');
  check('the lowest ground in view carries digit zero and the label states how high it stands', sloped.elevationFloorSteps === 0 && observationText(sloped).includes('stands 0 steps above the world floor'));

  const highPlateau = buildObservation(meadowAt((_x, y) => 24 + Math.max(0, -y)), meadowTiles, facingNorth, 'character');
  check('ground far above the world floor still reads as relief rather than clamping flat', digitAt(highPlateau, 0, 0) === '0' && digitAt(highPlateau, 0, -8) === 'g');
  check('the label carries the floor that the digits are measured from', highPlateau.elevationFloorSteps === 48 && observationText(highPlateau).includes('stands 48 steps above the world floor'));

  const sunken = buildObservation(meadowAt((_x, y) => -6 + Math.max(0, -y)), meadowTiles, facingNorth, 'character');
  check('ground below the world floor keeps its relief instead of clamping to zero', digitAt(sunken, 0, 0) === '0' && digitAt(sunken, 0, -8) === 'g' && sunken.elevationFloorSteps === -12);

  const halfSteps = buildObservation(meadowAt((_x, y) => Math.max(0, -y) * LEVEL_STEP), meadowTiles, facingNorth, 'character');
  check('a rise a step can walk moves the digit by exactly one', digitAt(halfSteps, 0, -1) === '1' && digitAt(halfSteps, 0, -2) === '2');
  check('a rise only a jump can climb moves the digit by two', digitAt(halfSteps, 0, 0) === '0' && digitAt(halfSteps, 0, -2) === String(CLIMB_STEPS_PER_JUMP));
  check('your own tile carries its height too', digitAt(sloped, 0, 0) === '0');
  check('the elevation grid is blank exactly where the view is unseen', blanksAlignWithTheView(sloped));
  check('the observation text carries the elevation grid under its own label', observationText(sloped).includes('elevation (') && observationText(sloped).includes(sloped.elevation!.join('\n')));

  const towering = buildObservation(meadowAt((_x, y) => Math.max(0, -y) * 20), meadowTiles, facingNorth, 'character');
  check('relief past 35 steps clamps to the tallest digit z', digitAt(towering, 0, -2) === 'z');

  const godView = buildObservation(meadowAt((_x, y) => Math.max(0, -y)), meadowTiles, facingNorth, 'god');
  check('a god observation carries heights for every cell, even behind the pose', digitAt(godView, 0, 5) === '0' && digitAt(godView, 0, -8) === 'g');
}

function meadowAt(elevationAt: (x: number, y: number) => number): WorldSampler {
  return stubSampler(() => MEADOW_TILE, elevationAt);
}

function digitAt(observation: AgentObservation, dx: number, dy: number): string {
  const center = Math.floor(observation.viewSize / 2);
  return observation.elevation![center + dy]![center + dx]!;
}

function blanksAlignWithTheView(observation: AgentObservation): boolean {
  for (let row = 0; row < observation.viewSize; row++) {
    for (let column = 0; column < observation.viewSize; column++) {
      const viewBlank = observation.view[row]![column] === ' ';
      const heightBlank = observation.elevation![row]![column] === ' ';
      if (viewBlank !== heightBlank) return false;
    }
  }
  return true;
}
