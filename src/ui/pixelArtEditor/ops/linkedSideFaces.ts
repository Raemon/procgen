import {
  faceArtWithPixelsAt,
  facePixelsAt,
  frameCount,
  type ArtLayer,
  type ArtSlot,
} from '../../../world/tiles/faceArtFrames';
import {
  SIDE_FACES,
  type CubeFace,
  type CubeFaceArt,
  type FacePixels,
} from '../../../world/tiles/tileFaceArt';

const LAYERS: readonly ArtLayer[] = ['color', 'height'];

export function sideFacesMatch(art: CubeFaceArt): boolean {
  return sideSlotsFollowing(art, SIDE_FACES[0]).every(({ slot, sourceSlot }) =>
    facePixelsEqual(facePixelsAt(art, slot), facePixelsAt(art, sourceSlot)),
  );
}

export function copyFaceToAllSides(art: CubeFaceArt, source: CubeFace): CubeFaceArt {
  return sideSlotsFollowing(art, source).reduce(
    (linked, { slot, sourceSlot }) =>
      faceArtWithPixelsAt(linked, slot, [...facePixelsAt(linked, sourceSlot)]),
    art,
  );
}

function sideSlotsFollowing(
  art: CubeFaceArt,
  source: CubeFace,
): { slot: ArtSlot; sourceSlot: ArtSlot }[] {
  const slots: { slot: ArtSlot; sourceSlot: ArtSlot }[] = [];
  for (let frame = 0; frame < frameCount(art); frame++)
    for (const layer of LAYERS)
      for (const face of SIDE_FACES)
        if (face !== source)
          slots.push({ slot: { face, frame, layer }, sourceSlot: { face: source, frame, layer } });
  return slots;
}

function facePixelsEqual(a: FacePixels, b: FacePixels): boolean {
  return a.length === b.length && a.every((pixel, index) => pixel === b[index]);
}
