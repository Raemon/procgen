import * as THREE from 'three';
import { heightOfInk } from '../../../assets/tiles/faceArtHeight';
import { faceGridSize, type FacePixels } from '../../../assets/tiles/tileFaceArt';

const SLOPE_STRENGTH = 3;
const CHANNELS = 4;

export function normalTextureFromHeights(pixels: FacePixels): THREE.DataTexture {
  const size = faceGridSize(pixels);
  const heights = pixels.map(heightOfInk);
  const data = new Uint8Array(size * size * CHANNELS);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) writeNormal(data, heights, size, x, y);
  return normalMapTexture(data, size);
}

function writeNormal(
  data: Uint8Array,
  heights: number[],
  size: number,
  x: number,
  y: number,
): void {
  const alongU = heightAt(heights, size, x + 1, y) - heightAt(heights, size, x - 1, y);
  const alongV = heightAt(heights, size, x, y + 1) - heightAt(heights, size, x, y - 1);
  const [nx, ny, nz] = unitNormal(-alongU * SLOPE_STRENGTH, alongV * SLOPE_STRENGTH);
  const offset = (y * size + x) * CHANNELS;
  data[offset] = encodeChannel(nx);
  data[offset + 1] = encodeChannel(ny);
  data[offset + 2] = encodeChannel(nz);
  data[offset + 3] = 255;
}

function unitNormal(x: number, y: number): [number, number, number] {
  const length = Math.hypot(x, y, 1);
  return [x / length, y / length, 1 / length];
}

function encodeChannel(component: number): number {
  return Math.round((component * 0.5 + 0.5) * 255);
}

function heightAt(heights: number[], size: number, x: number, y: number): number {
  const wrappedX = ((x % size) + size) % size;
  const wrappedY = ((y % size) + size) % size;
  return heights[wrappedY * size + wrappedX] ?? 0.5;
}

function normalMapTexture(data: Uint8Array, size: number): THREE.DataTexture {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
