import { mkdirSync, writeFileSync } from 'node:fs';
import { MATERIAL_SYNTHS } from '../assets/textures/materialCatalog';
import type { MaterialSynth, TextureFace } from '../assets/textures/materialSynth';
import { normalRgbAt } from '../assets/textures/normalFromHeightGrid';
import { pngBuffer, type RgbImage } from './png/writePng';

const TEXTURE_SIZE = 256;
const NORMAL_SLOPE_STRENGTH = 5;

for (const material of MATERIAL_SYNTHS) bakeMaterial(material);
console.log(`baked ${MATERIAL_SYNTHS.length} materials into public/textures`);

function bakeMaterial(material: MaterialSynth): void {
  mkdirSync(`public/textures/${material.id}`, { recursive: true });
  for (const face of material.faces) bakeFace(material, face);
}

function bakeFace(material: MaterialSynth, face: TextureFace): void {
  assertSeamless(material, face);
  writeFileSync(`public/textures/${material.id}/${face}.png`, pngBuffer(colorImage(material, face)));
  writeFileSync(`public/textures/${material.id}/${face}_n.png`, pngBuffer(normalImage(material, face)));
}

function colorImage(material: MaterialSynth, face: TextureFace): RgbImage {
  return {
    width: TEXTURE_SIZE,
    height: TEXTURE_SIZE,
    pixelAt: (x, y) => material.colorAt(x / TEXTURE_SIZE, y / TEXTURE_SIZE, face),
  };
}

function normalImage(material: MaterialSynth, face: TextureFace): RgbImage {
  const heightAt = (x: number, y: number) =>
    material.heightAt(x / TEXTURE_SIZE, y / TEXTURE_SIZE, face);
  return {
    width: TEXTURE_SIZE,
    height: TEXTURE_SIZE,
    pixelAt: (x, y) => normalRgbAt(heightAt, x, y, TEXTURE_SIZE, NORMAL_SLOPE_STRENGTH),
  };
}

function assertSeamless(material: MaterialSynth, face: TextureFace): void {
  const seam = worstSeamDelta(material, face);
  const interior = worstInteriorDelta(material, face);
  if (seam > Math.max(60, interior * 1.25))
    throw new Error(`${material.id}/${face} seam delta ${seam} vs interior ${interior}`);
}

function worstSeamDelta(material: MaterialSynth, face: TextureFace): number {
  let worst = 0;
  for (let along = 0; along < TEXTURE_SIZE; along++) {
    const u = along / TEXTURE_SIZE;
    const edge = (TEXTURE_SIZE - 1) / TEXTURE_SIZE;
    worst = Math.max(worst, pixelDelta(material, face, [0, u], [edge, u]));
    worst = Math.max(worst, pixelDelta(material, face, [u, 0], [u, edge]));
  }
  return worst;
}

function worstInteriorDelta(material: MaterialSynth, face: TextureFace): number {
  let worst = 0;
  for (let row = 8; row < TEXTURE_SIZE; row += 16) {
    for (let along = 1; along < TEXTURE_SIZE; along++) {
      const u = along / TEXTURE_SIZE;
      const previous = (along - 1) / TEXTURE_SIZE;
      const v = row / TEXTURE_SIZE;
      worst = Math.max(worst, pixelDelta(material, face, [previous, v], [u, v]));
      worst = Math.max(worst, pixelDelta(material, face, [v, previous], [v, u]));
    }
  }
  return worst;
}

function pixelDelta(
  material: MaterialSynth,
  face: TextureFace,
  a: [number, number],
  b: [number, number],
): number {
  const first = material.colorAt(a[0] % 1, a[1] % 1, face);
  const second = material.colorAt(b[0] % 1, b[1] % 1, face);
  return Math.max(...first.map((channel, i) => Math.abs(channel - second[i]!)));
}
