import * as THREE from 'three';
import { FACE_ART_SIZE, type CubeFaceArt, type FacePixels } from '../../world/tiles/tileFaceArt';
import { paintFacePixels } from '../paintFacePixels';

export function cubeFaceMaterials(art: CubeFaceArt, baseColor: string): THREE.Material[] {
  const sides = faceMaterial(art.sides, baseColor);
  const top = faceMaterial(art.top, baseColor);
  const bottom = faceMaterial(art.bottom, baseColor);
  return [sides, sides, top, bottom, sides, sides];
}

export function sideFaceMaterial(art: CubeFaceArt, baseColor: string): THREE.Material {
  return faceMaterial(art.sides, baseColor);
}

function faceMaterial(pixels: FacePixels, baseColor: string): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ map: facePixelsTexture(pixels, baseColor) });
}

function facePixelsTexture(pixels: FacePixels, baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = FACE_ART_SIZE;
  canvas.height = FACE_ART_SIZE;
  paintFacePixels(canvas.getContext('2d')!, pixels, baseColor, 1);
  return pixelCrispTexture(canvas);
}

function pixelCrispTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
