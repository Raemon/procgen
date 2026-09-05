import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import {
  MAX_WORLDS_ZOOM,
  MIN_WORLDS_ZOOM,
  clampedGridSide,
  familySeeds,
  formattedWorldsZoom,
  pipelineStructureKey,
  steppedWorldsZoom,
  worldsZoomAtExponent,
  worldsZoomExponent,
} from '../seedFamily';

export function checkSeedFamily(check: CheckReporter): void {
  const first = familySeeds(1234, 6);
  const again = familySeeds(1234, 6);
  check(
    'a seed family is determined by its origin, so the same origin always offers the same rolls',
    first.join() === again.join(),
  );
  check('the first cell is the origin seed itself', first[0] === 1234);
  check('every cell in the family has a different seed', new Set(first).size === first.length);
  check(
    'asking for more cells keeps the rolls already shown',
    familySeeds(1234, 8).slice(0, 6).join() === first.join(),
  );
  check(
    'a different origin grows a different family',
    familySeeds(1234, 6).join() !== familySeeds(5678, 6).join(),
  );
  check(
    'the structure key names each node by id and type, so a rewired pipeline is a new family',
    pipelineStructureKey({
      nodes: () => [
        { id: 'a', type: 'noiseField' },
        { id: 'b', type: 'threshold' },
      ],
    }) === 'a:noiseField,b:threshold',
  );
  check(
    'the grid can be one cell and cannot be pushed past the widest side',
    clampedGridSide(0) === 1 && clampedGridSide(99) === clampedGridSide(6),
  );
  check(
    'zoom reaches far enough out to see a whole region, at least a hundredth of unit distance',
    MIN_WORLDS_ZOOM <= 0.01,
  );
  check(
    'the zoom ladder is logarithmic, so every step is the same fraction of the distance',
    Math.abs(worldsZoomExponent(0.25) + 2) < 1e-9 &&
      Math.abs(worldsZoomAtExponent(-2) - 0.25) < 1e-9,
  );
  check(
    'a step out halves the zoom and a step in puts it back',
    Math.abs(steppedWorldsZoom(1, -1) - 0.5) < 1e-9 &&
      Math.abs(steppedWorldsZoom(0.5, 1) - 1) < 1e-9,
  );
  check(
    'a step from an off-notch zoom lands on a notch, so the readout stays a clean fraction',
    Math.abs(steppedWorldsZoom(0.7, -1) - 0.5) < 1e-9 &&
      Math.abs(steppedWorldsZoom(0.7, 1) - 1) < 1e-9,
  );
  check(
    'stepping stops at the ends instead of running off them',
    steppedWorldsZoom(MIN_WORLDS_ZOOM, -1) === MIN_WORLDS_ZOOM &&
      steppedWorldsZoom(MAX_WORLDS_ZOOM, 1) === MAX_WORLDS_ZOOM,
  );
  check(
    'zoom reads as a fraction once it is below one',
    formattedWorldsZoom(1) === '1' && formattedWorldsZoom(1 / 64) === '1/64',
  );
}
