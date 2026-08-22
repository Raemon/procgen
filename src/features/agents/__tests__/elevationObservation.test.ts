import { assetId } from '@/features/asset-library/asset';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { newTileWithId } from '@/features/asset-library/tiles/tileDef';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { buildObservation, type AgentObservation } from '../observation';
import { observationText } from '../observationText';

const MEADOW_TILE = assetId<'tiles'>(0);

const meadowTiles = new TileAssets([
  { ...newTileWithId(MEADOW_TILE), name: 'meadow', symbol: '"', walkable: true, height: 1 },
]);

export function checkElevationObservation(check: CheckReporter): void {
  const facingNorth = { x: 0, y: 0, facing: 0 as const };
  const flat = buildObservation(meadowAt(() => 5), meadowTiles, facingNorth, 'character');
  check('flat ground sends no elevation grid at all', flat.elevation === null && !observationText(flat).includes('elevation'));

  const sloped = buildObservation(meadowAt((_x, y) => Math.max(0, -y)), meadowTiles, facingNorth, 'character');
  check('varied ground sends one elevation row per view row, each as wide as the view', sloped.elevation !== null && sloped.elevation.length === sloped.viewSize && sloped.elevation.every((row) => row.length === sloped.viewSize));
  check('each digit is the rounded ground height written base-36', digitAt(sloped, 0, -8) === (8).toString(36) && digitAt(sloped, 0, -1) === '1');
  check('your own tile carries its height too', digitAt(sloped, 0, 0) === '0');
  check('the elevation grid is blank exactly where the view is unseen', blanksAlignWithTheView(sloped));
  check('the observation text carries the elevation grid under its own label', observationText(sloped).includes('elevation (') && observationText(sloped).includes(sloped.elevation!.join('\n')));

  const towering = buildObservation(meadowAt((_x, y) => Math.max(0, -y) * 20), meadowTiles, facingNorth, 'character');
  check('heights past 35 clamp to the tallest digit z', digitAt(towering, 0, -2) === 'z');

  const godView = buildObservation(meadowAt((_x, y) => Math.max(0, -y)), meadowTiles, facingNorth, 'god');
  check('a god observation carries heights for every cell, even behind the pose', digitAt(godView, 0, 5) === '0' && digitAt(godView, 0, -8) === (8).toString(36));
}

function meadowAt(elevationAt: (x: number, y: number) => number): WorldSampler {
  return {
    tileAt: () => MEADOW_TILE,
    elevationAt,
    markersIn: () => [],
    itemSpawnsIn: () => [],
  } as unknown as WorldSampler;
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
