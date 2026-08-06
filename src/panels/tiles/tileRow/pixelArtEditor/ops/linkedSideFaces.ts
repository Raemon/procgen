import {
  cloneCubeFaceArt,
  SIDE_FACES,
  type CubeFace,
  type CubeFaceArt,
  type FacePixels,
} from '../../../../../world/tiles/tileFaceArt';

export function sideFacesMatch(art: CubeFaceArt): boolean {
  const [first, ...rest] = SIDE_FACES;
  return rest.every((face) => facePixelsEqual(art[face], art[first]));
}

export function copyFaceToAllSides(art: CubeFaceArt, source: CubeFace): CubeFaceArt {
  const linked = cloneCubeFaceArt(art);
  for (const face of SIDE_FACES) linked[face] = [...art[source]];
  return linked;
}

function facePixelsEqual(a: FacePixels, b: FacePixels): boolean {
  return a.length === b.length && a.every((pixel, index) => pixel === b[index]);
}
