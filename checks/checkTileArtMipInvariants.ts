import { averageInk } from '../assets/tiles/mips/averageInk';
import { faceArtMips, mipLevelWithin, mipWithin } from '../assets/tiles/mips/faceArtMips';
import { defaultTiles } from '../assets/tiles/defaultTiles';
import { blankFacePixels, type FacePixels } from '../assets/tiles/tileFaceArt';
import { drawsNormalMapAt, tileSideBudget } from '../world/render/view3d/tileDetailBudget';
import type { CheckReporter } from './checkCharacterBillboardInvariants';

const VIEWPORT_HEIGHT_PIXELS = 900;
const VERTICAL_FOV_DEGREES = 50;
const CLOSEST_CAMERA_DISTANCE = 1.2;
const FARTHEST_CAMERA_DISTANCE = 800;

export function checkTileArtMipInvariants(check: CheckReporter): void {
  checkEveryChainEndsAtOnePixelOfAverageColor(check);
  checkTheOnePixelIsTheColorTheFaceReadsAs(check);
  checkUnpaintedPixelsTakeTheTileColor(check);
  checkDistanceBuysCoarserArtAndDropsRelief(check);
  checkTheChainIsBuiltOncePerFace(check);
}

function checkEveryChainEndsAtOnePixelOfAverageColor(check: CheckReporter): void {
  const faces = defaultTiles()
    .filter((tile) => tile.faceArt)
    .map((tile) => faceArtMips(tile.faceArt!.top, tile.color));
  check(
    'every tile face scales down to a single pixel, however large its art started',
    faces.length > 0 && faces.every((mips) => mips[mips.length - 1]!.side === 1),
  );
  check(
    'each step down the chain halves the side, so no level is skipped',
    faces.every((mips) =>
      mips.every((mip, level) => level === 0 || mip.side === Math.max(1, mips[level - 1]!.side / 2)),
    ),
  );
}

function checkTheOnePixelIsTheColorTheFaceReadsAs(check: CheckReporter): void {
  const half: FacePixels = ['#ff0000', '#ff0000', '#0000ff', '#0000ff'];
  const mips = faceArtMips(half, '#000000');
  check(
    'the last mip of a half-red half-blue face is the average of the two',
    mips[mips.length - 1]!.inks[0] === averageInk(['#ff0000', '#0000ff']),
  );
  check(
    'averaging ignores a fully transparent ink rather than dragging the color to black',
    averageInk(['#ffffff', '#00000000']) === '#ffffff',
  );
}

function checkUnpaintedPixelsTakeTheTileColor(check: CheckReporter): void {
  const mips = faceArtMips(blankFacePixels(4), '#123456');
  check(
    'an unpainted face scales down to the tile color, the same color it renders as',
    mips[mips.length - 1]!.inks[0] === '#123456',
  );
}

function checkDistanceBuysCoarserArtAndDropsRelief(check: CheckReporter): void {
  const near = tileSideBudget(VERTICAL_FOV_DEGREES, VIEWPORT_HEIGHT_PIXELS, CLOSEST_CAMERA_DISTANCE);
  const far = tileSideBudget(VERTICAL_FOV_DEGREES, VIEWPORT_HEIGHT_PIXELS, FARTHEST_CAMERA_DISTANCE);
  check('a tile under the camera is drawn at more texels than one on the horizon', near > far);
  const art = faceArtMips(blankFacePixels(32), '#123456');
  check(
    'zoomed all the way out, a tile covers under a pixel and falls to its single pixel',
    mipWithin(art, far).side === 1,
  );
  check(
    'relief survives at the finest level and is dropped as soon as the art is scaled down',
    drawsNormalMapAt(mipLevelWithin(art, near)) && !drawsNormalMapAt(mipLevelWithin(art, far)),
  );
}

function checkTheChainIsBuiltOncePerFace(check: CheckReporter): void {
  const pixels = blankFacePixels(8);
  check(
    'the scaled down copies are kept, not rebuilt every time a chunk asks for them',
    faceArtMips(pixels, '#abcdef') === faceArtMips(pixels, '#abcdef'),
  );
  check(
    'a face redrawn in a different tile color gets its own scaled down copies',
    faceArtMips(pixels, '#abcdef') !== faceArtMips(pixels, '#fedcba'),
  );
}
