import * as THREE from 'three';
import { isTransparentInk } from '../../world/tiles/inkColor';
import { faceGridSize, type CubeFaceArt, type FacePixels } from '../../world/tiles/tileFaceArt';
import { paintFacePixels } from '../paintFacePixels';

const BOX_FACE_ORDER = ['east', 'west', 'top', 'bottom', 'south', 'north'] as const;

export function cubeFaceMaterials(art: CubeFaceArt, baseColor: string): THREE.Material[] {
  return BOX_FACE_ORDER.map((face) => faceMaterial(art[face], baseColor));
}

export function sideFaceMaterial(art: CubeFaceArt, baseColor: string): THREE.Material {
  return faceMaterial(art.north, baseColor);
}

function faceMaterial(pixels: FacePixels, baseColor: string): THREE.MeshLambertMaterial {
  const seeThrough = isTransparentInk(baseColor);
  return new THREE.MeshLambertMaterial({
    map: facePixelsTexture(pixels, baseColor),
    transparent: seeThrough,
    alphaTest: seeThrough ? 0.5 : 0,
    side: seeThrough ? THREE.DoubleSide : THREE.FrontSide,
  });
}

function facePixelsTexture(pixels: FacePixels, baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = faceGridSize(pixels);
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
