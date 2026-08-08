import { averageInk } from '../assets/tiles/mips/averageInk';
import { faceArtMips, mipLevelWithin, mipWithin } from '../assets/tiles/mips/faceArtMips';
import { blankFacePixels, type FacePixels } from '../assets/tiles/tileFaceArt';
import { drawsNormalMapAt, tileSideBudget } from '../world/render/view3d/tileDetailBudget';
import type { CheckReporter } from './checkReporter';

const VIEWPORT_HEIGHT_PIXELS = 900;
const VERTICAL_FOV_DEGREES = 50;
const CLOSEST_CAMERA_DISTANCE = 1.2;
const FARTHEST_CAMERA_DISTANCE = 800;

export function checkTileArtMipInvariants(check: CheckReporter): void {
  checkTheOnePixelIsTheColorTheFaceReadsAs(check);
  checkUnpaintedPixelsTakeTheTileColor(check);
  checkATransparentFaceScalesDownStillTransparent(check);
  checkDistanceBuysCoarserArtAndDropsRelief(check);
  checkTheChainIsBuiltOncePerFace(check);
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
  check(
    'a block with nothing painted in it stays unpainted instead of inventing a color',
    averageInk([null, null]) === null,
  );
}

function checkATransparentFaceScalesDownStillTransparent(check: CheckReporter): void {
  const halfPainted: FacePixels = ['#ff0000', null, null, null];
  check(
    'on a see-through tile the unpainted pixels stay out of the average',
    faceArtMips(halfPainted, null)[1]!.inks[0] === '#ff0000',
  );
  check(
    'a face painted with nothing at all scales down to nothing on a see-through tile',
    faceArtMips(blankFacePixels(4), null)[2]!.inks[0] === null,
  );
  check(
    'the same face on an opaque tile scales down to the tile color instead',
    faceArtMips(blankFacePixels(4), '#123456')[2]!.inks[0] === '#123456',
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
  check(
    'a see-through tile does not share the scaled down copies of an opaque one',
    faceArtMips(pixels, null) !== faceArtMips(pixels, '#abcdef'),
  );
}
