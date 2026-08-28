import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { billboardFigureExtent } from '../../characters/billboardFigureExtent';
import {
  CHARACTER_ROTATIONS,
  framesOf,
  type CharacterBillboard,
} from '../../characters/characterBillboard';
import { builtInBillboard, GAUNT_ONE_ART } from '../art/builtInBillboards';
import { gauntOneBillboard } from '../art/gauntOne/gauntOneBillboard';
import { GAUNT_IDLE_FRAMES, GAUNT_WALK_FRAMES } from '../art/gauntOne/gauntOnePose';
import { GAUNT_ONE_INKS } from '../art/gauntOne/gauntOnePalette';

export function checkGauntOneBillboard(check: CheckReporter): void {
  const billboard = gauntOneBillboard();
  check(
    'every rotation carries a full idle clip and an 8-keyframe walk clip',
    CHARACTER_ROTATIONS.every(
      (rotation) =>
        framesOf(billboard, rotation, 'idle').length === GAUNT_IDLE_FRAMES &&
        framesOf(billboard, rotation, 'moving').length === GAUNT_WALK_FRAMES,
    ),
  );
  check(
    'the walk cycle actually moves: every consecutive pair of walking frames differs',
    CHARACTER_ROTATIONS.every((rotation) => framesAllDiffer(billboard, rotation)),
  );
  check(
    'the figure looms taller than wide, so it reads as a 2-unit-tall creature',
    loomsTall(billboard),
  );
  check(
    'building the billboard twice yields identical frames, so the art is deterministic',
    JSON.stringify(gauntOneBillboard()) === JSON.stringify(billboard),
  );
  check(
    'the gaunt one is registered as built-in billboard art',
    builtInBillboard(GAUNT_ONE_ART) !== null,
  );
  check(
    'the eyes glow toward the viewer and never through the back of the skull',
    hasEyes(billboard, 'front') && hasEyes(billboard, 'side') && !hasEyes(billboard, 'back') && !hasEyes(billboard, 'backQuarter'),
  );
}

function framesAllDiffer(billboard: CharacterBillboard, rotation: (typeof CHARACTER_ROTATIONS)[number]): boolean {
  const frames = framesOf(billboard, rotation, 'moving');
  return frames.every((frame, index) => {
    const next = frames[(index + 1) % frames.length]!;
    return JSON.stringify(frame) !== JSON.stringify(next);
  });
}

function loomsTall(billboard: CharacterBillboard): boolean {
  const extent = billboardFigureExtent(billboard);
  return extent !== null && extent.heightCells > extent.widthCells && extent.heightCells >= 40;
}

function hasEyes(billboard: CharacterBillboard, rotation: (typeof CHARACTER_ROTATIONS)[number]): boolean {
  return framesOf(billboard, rotation, 'idle').some((frame) => frame.includes(GAUNT_ONE_INKS.eye));
}
