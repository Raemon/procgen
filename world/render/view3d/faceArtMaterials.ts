import * as THREE from 'three';
import { faceArtPlan, type FaceArtPlan } from '../../../assets/tiles/faceArtFacePlan';
import { facePixelsAt, frameMsOf } from '../../../assets/tiles/faceArtFrames';
import { isTransparentInk, unpaintedInk } from '../../../assets/tiles/inkColor';
import {
  MAX_FACE_ART_SIZE,
  type CubeFace,
  type CubeFaceArt,
} from '../../../assets/tiles/tileFaceArt';
import { playFaceArtFrames, type FaceArtFrameTextures } from './faceArtAnimations';
import { faceArtColorTexture, faceArtMipLevel, faceArtNormalTexture } from './faceArtTextures';
import { drawsNormalMapAt } from './tileDetailBudget';

const BOX_FACE_ORDER = ['east', 'west', 'top', 'bottom', 'south', 'north'] as const;
const NORMAL_RELIEF = 0.85;

export function cubeFaceMaterials(
  art: CubeFaceArt,
  baseColor: string,
  sideBudget: number = MAX_FACE_ART_SIZE,
): THREE.Material[] {
  return BOX_FACE_ORDER.map((face) => faceMaterial(art, face, baseColor, sideBudget));
}

export function sideFaceMaterial(
  art: CubeFaceArt,
  baseColor: string,
  sideBudget: number = MAX_FACE_ART_SIZE,
): THREE.Material {
  return faceMaterial(art, 'north', baseColor, sideBudget);
}

function faceMaterial(
  art: CubeFaceArt,
  face: CubeFace,
  baseColor: string,
  sideBudget: number,
): THREE.MeshLambertMaterial {
  const seeThrough = isTransparentInk(baseColor);
  const frames = faceFrameTextures(art, face, unpaintedInk(baseColor), sideBudget, faceArtPlan(art, face));
  const material = new THREE.MeshLambertMaterial({
    map: frames[0]!.map,
    normalMap: frames[0]!.normalMap,
    normalScale: new THREE.Vector2(NORMAL_RELIEF, NORMAL_RELIEF),
    transparent: seeThrough,
    alphaTest: seeThrough ? 0.5 : 0,
    side: seeThrough ? THREE.DoubleSide : THREE.FrontSide,
  });
  playFaceArtFrames(material, frames, frameMsOf(art));
  return material;
}

function faceFrameTextures(
  art: CubeFaceArt,
  face: CubeFace,
  unpainted: string | null,
  sideBudget: number,
  plan: FaceArtPlan,
): FaceArtFrameTextures[] {
  return plan.frames.map((frame) => ({
    map: faceArtColorTexture(
      facePixelsAt(art, { face, frame, layer: 'color' }),
      unpainted,
      sideBudget,
    ),
    normalMap: reliefTexture(art, { face, frame }, unpainted, sideBudget, plan),
  }));
}

function reliefTexture(
  art: CubeFaceArt,
  slot: { face: CubeFace; frame: number },
  unpainted: string | null,
  sideBudget: number,
  plan: FaceArtPlan,
): THREE.Texture | null {
  const colorPixels = facePixelsAt(art, { ...slot, layer: 'color' });
  if (!plan.embossed || !drawsNormalMapAt(faceArtMipLevel(colorPixels, unpainted, sideBudget))) {
    return null;
  }
  return faceArtNormalTexture(facePixelsAt(art, { ...slot, layer: 'height' }));
}
