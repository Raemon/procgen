import { blankFacePixels } from '../assets/tiles/tileFaceArt';
import { FLAT_HEIGHT_INK, heightInk } from '../assets/tiles/faceArtHeight';
import { scrolledWaves, wavePainter } from '../assets/tiles/art/painters/wavePainter';
import { normalTextureFromHeights } from '../world/render/view3d/normalTextureFromHeights';
import { tileBoxGeometry } from '../world/render/view3d/tileBoxGeometry';
import type { CheckReporter } from './checkReporter';

export function checkTileSurfaceRendering(check: CheckReporter): void {
  checkAReliefLayerTiltsTheLightItCatches(check);
  checkATileBoxShowsAsMuchOfItsSideArtAsItIsTall(check);
  checkTheWaterSwellLoopsWithoutASeamOrARepeat(check);
}

function checkAReliefLayerTiltsTheLightItCatches(check: CheckReporter): void {
  const RAISED_PIXEL = 5;
  const bumpyNormalBytes = normalTextureFromHeights(
    blankFacePixels(4).map((_, index) => (index === RAISED_PIXEL ? heightInk(1) : FLAT_HEIGHT_INK)),
  ).image.data as Uint8Array;
  check(
    'a raised pixel tilts the normals of its neighbours away from straight up',
    bumpyNormalBytes[(RAISED_PIXEL - 1) * 4] !== 128 && bumpyNormalBytes[RAISED_PIXEL * 4] === 128,
  );
  check(
    'flat relief leaves every normal pointing straight up',
    [...(normalTextureFromHeights(blankFacePixels(4)).image.data as Uint8Array)].every(
      (channel, index) => (index % 4 === 2 || index % 4 === 3 ? channel === 255 : channel === 128),
    ),
  );
}

function checkATileBoxShowsAsMuchOfItsSideArtAsItIsTall(check: CheckReporter): void {
  const slabUvs = tileBoxGeometry(1, 0.1, 1).attributes.uv!;
  const slabSideV = [...Array(4).keys()].map((corner) => slabUvs.getY(corner));
  check(
    'a thin slab shows a thin band of its side art rather than the whole face squashed',
    Math.abs(Math.max(...slabSideV) - Math.min(...slabSideV) - 0.1) < 1e-6 &&
      Math.abs(Math.max(...slabSideV) - 1) < 1e-6,
  );
  const cubeUvs = tileBoxGeometry(1, 1, 1).attributes.uv!;
  check(
    'a full cube still shows every face whole',
    [...Array(cubeUvs.count).keys()].every((vertex) =>
      [cubeUvs.getX(vertex), cubeUvs.getY(vertex)].every((coordinate) => coordinate === 0 || coordinate === 1),
    ),
  );
}

function checkTheWaterSwellLoopsWithoutASeamOrARepeat(check: CheckReporter): void {
  const shallowWaves ={ palette: ['#1', '#2', '#3', '#4'], wavelength: 16, amplitude: 2.2, bandHeight: 4, size: 32 };
  const wavesAt = (phase: number) => wavePainter(scrolledWaves(shallowWaves, phase));
  const everyWaterPixel = [...Array(32 * 32).keys()].map((index) => [index % 32, Math.floor(index / 32)] as const);
  check(
    'each wave frame tiles seamlessly in both directions',
    everyWaterPixel.every(
      ([x, y]) => wavesAt(0)(x + 32, y) === wavesAt(0)(x, y) && wavesAt(0)(x, y + 32) === wavesAt(0)(x, y),
    ),
  );
  check(
    'the wave loop closes: scrolling a whole band lands back on the first frame',
    everyWaterPixel.every(([x, y]) => wavesAt(shallowWaves.bandHeight)(x, y) === wavesAt(0)(x, y)),
  );
  check(
    'no two frames of the swell are the same picture',
    new Set([0, 1, 2, 3].map((phase) => everyWaterPixel.map(([x, y]) => wavesAt(phase)(x, y)).join())).size === 4,
  );
}
