import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { nearestFieldStone } from '../stoneField';
import { wrappedFbm } from '../wrappedNoise';

export const duneSand = rippled('duneSand', [188, 168, 128], [156, 138, 104], 9);
export const gravel = chipped('gravel', [132, 126, 114], [88, 84, 78], 18);
export const scree = chipped('scree', [122, 116, 108], [72, 70, 68], 11);

function rippled(id: string, lightTone: Rgb, darkTone: Rgb, waves: number): MaterialSynth {
  const seed = synthSeed(id, 'base');
  const ripple = (x: number, y: number) =>
    0.5 + 0.5 * Math.sin((y + 0.15 * wrappedFbm(x, y, 5, 2, seed)) * Math.PI * 2 * waves);
  return sameOnEveryFace(
    id,
    (x, y) => shaded(mixed(lightTone, darkTone, 0.6 * ripple(x, y)), 0.95 + 0.1 * wrappedFbm(x, y, 31, 2, seed + 3)),
    (x, y) => 0.35 + 0.5 * ripple(x, y),
  );
}

function chipped(id: string, lightTone: Rgb, darkTone: Rgb, cells: number): MaterialSynth {
  const seed = synthSeed(id, 'base');
  return sameOnEveryFace(
    id,
    (x, y) => chipColor(x, y, cells, seed, lightTone, darkTone),
    (x, y) => chipHeight(x, y, cells, seed),
  );
}

function chipColor(x: number, y: number, cells: number, seed: number, lightTone: Rgb, darkTone: Rgb): Rgb {
  const chip = nearestFieldStone(x, y, cells, seed);
  const shadowed = chip.rim > 0.85 ? 0.6 : 0.8 + 0.45 * (1 - chip.rim);
  const tinted = mixed(lightTone, darkTone, chip.id * 0.75 + 0.25 * wrappedFbm(x, y, 29, 2, seed + 3));
  return shaded(tinted, shadowed);
}

function chipHeight(x: number, y: number, cells: number, seed: number): number {
  const chip = nearestFieldStone(x, y, cells, seed);
  return chip.rim > 0.85 ? 0.2 : 0.3 + 0.6 * (1 - chip.rim) * (0.5 + chip.id * 0.5);
}
