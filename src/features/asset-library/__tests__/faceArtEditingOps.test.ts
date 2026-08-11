import { floodFillFacePixels } from '@/features/asset-library/pixelArtEditor/ops/floodFillFacePixels';
import {
  copyFaceToAllSides,
  sideFacesMatch,
} from '@/features/asset-library/pixelArtEditor/ops/linkedSideFaces';
import { mirroredPixelIndices } from '@/features/asset-library/pixelArtEditor/ops/mirroredPixelIndices';
import { resizeCubeFaceArt } from '@/features/asset-library/pixelArtEditor/ops/resizeFaceArt';
import { shiftFacePixelsWithWrap } from '@/features/asset-library/pixelArtEditor/ops/shiftFacePixelsWithWrap';
import { faceArtFromStoredShape } from '@/features/asset-library/tiles/storage/storedFaceArt';
import {
  blankCubeFaceArt,
  blankFacePixels,
  cloneCubeFaceArt,
  isCubeFaceArt,
  isEntirelyBlank,
  SIDE_FACES,
} from '@/features/asset-library/tiles/tileFaceArt';
import {
  faceArtWithFrameInserted,
  faceArtWithFrameRemoved,
  faceArtWithPixelsAt,
  facePixelsAt,
  frameCount,
} from '@/features/asset-library/tiles/faceArtFrames';
import { FLAT_HEIGHT_INK, heightInk, heightOfInk } from '@/features/asset-library/tiles/faceArtHeight';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkFaceArtEditingOps(check: CheckReporter): void {
  const art = blankCubeFaceArt();
  check('blank face art validates and counts as blank', isCubeFaceArt(art) && isEntirelyBlank(art));
  art.top[0] = '#ff0000';
  check('painting a pixel makes face art non-blank', !isEntirelyBlank(art));
  check('cloned face art does not share pixel arrays', cloneCubeFaceArt(art).top !== art.top);
  check('malformed face art is rejected', !isCubeFaceArt({ top: [], sides: [], bottom: [] }));

  const legacySides = blankFacePixels(8);
  legacySides[1] = '#00ff00';
  const upgraded = faceArtFromStoredShape({
    top: blankFacePixels(8),
    sides: legacySides,
    bottom: blankFacePixels(8),
  });
  check('legacy top/sides/bottom art upgrades to six faces', isCubeFaceArt(upgraded) && upgraded!.size === 8);
  check(
    'legacy sides spread to all four compass faces',
    SIDE_FACES.every((face) => upgraded![face][1] === '#00ff00'),
  );
  check('garbage stored art is dropped', faceArtFromStoredShape({ top: [] }) === null);

  const grown = resizeCubeFaceArt(art, 16);
  check(
    'resizing up rescales painted pixels',
    grown.size === 16 && grown.top[0] === '#ff0000' && grown.top[1] === '#ff0000' && grown.top[16] === '#ff0000' && grown.top[2] === null,
  );
  check('resizing back down keeps the art', resizeCubeFaceArt(grown, 8).top[0] === '#ff0000');

  const edgePixels = blankFacePixels(4);
  edgePixels[3] = '#0000ff';
  check('shifting wraps pixels around the edge', shiftFacePixelsWithWrap(edgePixels, 4, 1, 0)[0] === '#0000ff');
  check('shifting down moves rows', shiftFacePixelsWithWrap(edgePixels, 4, 0, 1)[7] === '#0000ff');

  const walledFace = blankFacePixels(4);
  for (let col = 0; col < 4; col++) walledFace[4 + col] = '#ffffff';
  const filled = floodFillFacePixels(walledFace, 4, 0, '#00ff00');
  check(
    'flood fill stops at other colors',
    filled.slice(0, 4).every((p) => p === '#00ff00') && filled.slice(8).every((p) => p === null),
  );

  check(
    'mirrored painting hits both columns',
    String([...mirroredPixelIndices(0, 8, true, false)].sort((a, b) => a - b)) === '0,7',
  );
  check(
    'double mirror paints four corners',
    mirroredPixelIndices(0, 8, true, true).length === 4,
  );

  const splitSides = blankCubeFaceArt();
  check('blank art has matching sides', sideFacesMatch(splitSides));
  splitSides.north[0] = '#ff0000';
  check('painting one side unmatches the sides', !sideFacesMatch(splitSides));
  const relinked = copyFaceToAllSides(splitSides, 'north');
  check('relinking copies one side everywhere', sideFacesMatch(relinked) && relinked.west[0] === '#ff0000');

  const stillArt = blankCubeFaceArt(4);
  const twoFrames = faceArtWithFrameInserted(stillArt, 0);
  check('adding a frame leaves the first one alone and starts a loop', frameCount(twoFrames) === 2);
  const paintedSecondFrame = faceArtWithPixelsAt(
    twoFrames,
    { face: 'top', frame: 1, layer: 'color' },
    blankFacePixels(4).map((_, index) => (index === 0 ? '#ff0000' : null)),
  );
  check(
    'painting a later frame does not disturb the first',
    facePixelsAt(paintedSecondFrame, { face: 'top', frame: 1, layer: 'color' })[0] === '#ff0000' &&
      facePixelsAt(paintedSecondFrame, { face: 'top', frame: 0, layer: 'color' })[0] === null,
  );
  check(
    'a face a later frame leaves out is read from the first frame',
    facePixelsAt(paintedSecondFrame, { face: 'north', frame: 1, layer: 'color' }) ===
      facePixelsAt(paintedSecondFrame, { face: 'north', frame: 0, layer: 'color' }),
  );
  check(
    'animated art validates and survives a clone',
    isCubeFaceArt(paintedSecondFrame) &&
      frameCount(cloneCubeFaceArt(paintedSecondFrame)) === 2 &&
      isCubeFaceArt(JSON.parse(JSON.stringify(paintedSecondFrame))),
  );
  check(
    'dropping the first frame promotes the next one whole',
    facePixelsAt(faceArtWithFrameRemoved(paintedSecondFrame, 0), {
      face: 'north',
      frame: 0,
      layer: 'color',
    }).length === 16,
  );
  check('the last frame cannot be removed', frameCount(faceArtWithFrameRemoved(stillArt, 0)) === 1);
  check('malformed frames are rejected', !isCubeFaceArt({ ...stillArt, framesAfterFirst: [{ color: { top: [] } }] }));

  const reliefArt = faceArtWithPixelsAt(
    blankCubeFaceArt(4),
    { face: 'top', frame: 0, layer: 'height' },
    blankFacePixels(4).map((_, index) => (index === 0 ? heightInk(1) : null)),
  );
  check('a relief layer rides alongside the colours', isCubeFaceArt(reliefArt) && isEntirelyBlank(reliefArt) === false);
  check(
    'unpainted relief pixels read as the same flat height as the flat ink',
    heightOfInk(FLAT_HEIGHT_INK) === heightOfInk(null) && heightOfInk(heightInk(1)) === 1,
  );
  check(
    'resizing carries the relief layer and every frame with it',
    facePixelsAt(resizeCubeFaceArt(reliefArt, 8), { face: 'top', frame: 0, layer: 'height' })[0] ===
      heightInk(1) &&
      frameCount(resizeCubeFaceArt(paintedSecondFrame, 8)) === 2,
  );
  check(
    'a difference painted on a later frame unmatches the sides',
    !sideFacesMatch(
      faceArtWithPixelsAt(faceArtWithFrameInserted(blankCubeFaceArt(4), 0), { face: 'north', frame: 1, layer: 'color' }, blankFacePixels(4).map(() => '#ff0000')),
    ),
  );
}
