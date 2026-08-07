import { facePixelsAt, frameCount, type ArtLayer } from './faceArtFrames';
import { isFlatHeightField } from './faceArtHeight';
import type { CubeFace, CubeFaceArt, FacePixels } from './tileFaceArt';

const LAYERS: readonly ArtLayer[] = ['color', 'height'];

export interface FaceArtPlan {
  frames: number[];
  embossed: boolean;
}

/** A face that never changes across the art's frames is drawn once, as a still. */
export function faceArtPlan(art: CubeFaceArt, face: CubeFace): FaceArtPlan {
  const everyFrame = [...Array(frameCount(art)).keys()];
  return {
    frames: everyFrame.every((frame) => matchesFirstFrame(art, face, frame)) ? [0] : everyFrame,
    embossed: everyFrame.some((frame) => hasRelief(art, face, frame)),
  };
}

function matchesFirstFrame(art: CubeFaceArt, face: CubeFace, frame: number): boolean {
  return LAYERS.every((layer) =>
    samePixels(
      facePixelsAt(art, { face, frame, layer }),
      facePixelsAt(art, { face, frame: 0, layer }),
    ),
  );
}

function hasRelief(art: CubeFaceArt, face: CubeFace, frame: number): boolean {
  return !isFlatHeightField(facePixelsAt(art, { face, frame, layer: 'height' }));
}

function samePixels(a: FacePixels, b: FacePixels): boolean {
  return a === b || (a.length === b.length && a.every((pixel, index) => pixel === b[index]));
}
