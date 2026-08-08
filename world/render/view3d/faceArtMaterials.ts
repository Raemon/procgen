import * as THREE from 'three';
import { faceArtPlan, type FaceArtPlan } from '../../../library/tiles/faceArtFacePlan';
import { facePixelsAt, frameMsOf } from '../../../library/tiles/faceArtFrames';
import { isTransparentInk } from '../../../library/tiles/inkColor';
import {
  faceGridSize,
  type CubeFace,
  type CubeFaceArt,
  type FacePixels,
} from '../../../library/tiles/tileFaceArt';
import { paintFacePixels } from '../paintFacePixels';
import { playFaceArtFrames, type FaceArtFrameTextures } from './faceArtAnimations';
import { normalTextureFromHeights } from './normalTextureFromHeights';

const BOX_FACE_ORDER = ['east', 'west', 'top', 'bottom', 'south', 'north'] as const;
const NORMAL_RELIEF = 0.85;

export function cubeFaceMaterials(art: CubeFaceArt, baseColor: string): THREE.Material[] {
  return BOX_FACE_ORDER.map((face) => faceMaterial(art, face, baseColor));
}

export function sideFaceMaterial(art: CubeFaceArt, baseColor: string): THREE.Material {
  return faceMaterial(art, 'north', baseColor);
}

function faceMaterial(
  art: CubeFaceArt,
  face: CubeFace,
  baseColor: string,
): THREE.MeshLambertMaterial {
  const seeThrough = isTransparentInk(baseColor);
  const frames = faceFrameTextures(art, face, baseColor, faceArtPlan(art, face));
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
  baseColor: string,
  plan: FaceArtPlan,
): FaceArtFrameTextures[] {
  return plan.frames.map((frame) => ({
    map: facePixelsTexture(facePixelsAt(art, { face, frame, layer: 'color' }), unpaintedAs(baseColor)),
    normalMap: plan.embossed
      ? normalTextureFromHeights(facePixelsAt(art, { face, frame, layer: 'height' }))
      : null,
  }));
}

function unpaintedAs(baseColor: string): string | null {
  return isTransparentInk(baseColor) ? null : baseColor;
}

function facePixelsTexture(pixels: FacePixels, unpainted: string | null): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = faceGridSize(pixels);
  paintFacePixels(canvas.getContext('2d')!, pixels, unpainted, 1);
  return pixelCrispTexture(canvas);
}

function pixelCrispTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
