import { heightInk } from '../../faceArtHeight';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { ironBandsPainter, ironBandsReliefPainter, type IronBandStyle } from '../painters/ironBandPainter';
import { plankPainter } from '../painters/plankPainter';
import { clippedToRect, type PixelRect } from '../painters/shapePainters';
import { quarterTurned, stackedPainters, type PixelPainter } from '../pixelCanvas';

export const DOOR_TIMBER = '#6a4626';
export const DOOR_IRON = '#3d434b';

const DOOR_SEAM = '#2f1d0e';
const STUD = '#9aa2ab';
const BOARD_WIDTH = 7;
const BAND_HEIGHT = 5;
const BOARD_RELIEF = 0.58;
const SEAM_RELIEF = 0.44;
const BAND_RELIEF = 0.78;
const STUD_RELIEF = 0.96;

export interface DoorLeaf {
  within: PixelRect;
  seed: number;
}

export function bandsAcross(leaf: PixelRect): PixelRect[] {
  return [leaf.top + 3, leaf.top + leaf.height - 8].map((top) => ({
    left: leaf.left,
    top,
    width: leaf.width,
    height: BAND_HEIGHT,
  }));
}

export function doorLeafPainter(leaf: DoorLeaf): PixelPainter {
  return stackedPainters(
    boardsPainter(leaf, { base: DOOR_TIMBER, seam: DOOR_SEAM }),
    ironBandsPainter(bandsAcross(leaf.within), bandStyle(leaf.seed)),
  );
}

export function doorLeafReliefPainter(leaf: DoorLeaf): PixelPainter {
  return stackedPainters(
    boardsPainter(leaf, { base: heightInk(BOARD_RELIEF), seam: heightInk(SEAM_RELIEF) }),
    ironBandsReliefPainter(
      bandsAcross(leaf.within),
      BAND_RELIEF,
      STUD_RELIEF,
      bandStyle(leaf.seed),
    ),
  );
}

function boardsPainter(leaf: DoorLeaf, tone: { base: string; seam: string }): PixelPainter {
  const boards = plankPainter({
    base: tone.base,
    seam: tone.seam,
    seed: leaf.seed,
    size: SIZE,
    plankHeight: BOARD_WIDTH,
    plankLength: SIZE,
  });
  return clippedToRect(leaf.within, quarterTurned(boards));
}

function bandStyle(seed: number): IronBandStyle {
  return { iron: DOOR_IRON, stud: STUD, studSpacing: 6, studInset: 3, seed };
}
