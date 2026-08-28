import type { SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  type CharacterBillboard,
} from '@/features/asset-library/characters/characterBillboard';
import { hexOfRgb, rgbOfHex } from './resampleSprite';

const CHANNELS = ['red', 'green', 'blue'] as const;

type Channel = (typeof CHANNELS)[number];

interface Swatch {
  red: number;
  green: number;
  blue: number;
  weight: number;
  hex: string;
}

export function quantizedBillboard(
  billboard: CharacterBillboard,
  maxColors: number,
): CharacterBillboard {
  const swatches = swatchesOf(billboard);
  if (swatches.length <= maxColors) return billboard;
  const mapping = medianCutMapping(swatches, maxColors);
  return mappedBillboard(billboard, mapping);
}

function mappedBillboard(
  billboard: CharacterBillboard,
  mapping: ReadonlyMap<string, string>,
): CharacterBillboard {
  const clips = {} as CharacterBillboard['clips'];
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation] = { idle: [], moving: [] };
    for (const animation of CHARACTER_ANIMATIONS) {
      clips[rotation][animation] = framesOf(billboard, rotation, animation).map((frame) =>
        mappedFrame(frame, mapping),
      );
    }
  }
  return { idleFps: billboard.idleFps, movingFps: billboard.movingFps, clips };
}

function mappedFrame(frame: SpriteArt, mapping: ReadonlyMap<string, string>): SpriteArt {
  return frame.map((pixel) => (pixel === null ? null : mapping.get(pixel) ?? pixel));
}

function swatchesOf(billboard: CharacterBillboard): Swatch[] {
  const counts = new Map<string, number>();
  for (const rotation of CHARACTER_ROTATIONS) {
    for (const animation of CHARACTER_ANIMATIONS) {
      for (const frame of framesOf(billboard, rotation, animation)) {
        for (const pixel of frame) {
          if (pixel !== null) counts.set(pixel, (counts.get(pixel) ?? 0) + 1);
        }
      }
    }
  }
  return [...counts]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([hex, weight]) => ({ ...rgbOfHex(hex), weight, hex }));
}

function medianCutMapping(swatches: Swatch[], maxColors: number): Map<string, string> {
  let boxes: Swatch[][] = [swatches];
  while (boxes.length < maxColors) {
    const splittable = boxes.filter((box) => box.length > 1);
    if (splittable.length === 0) break;
    const widest = splittable.reduce((a, b) => (spreadOf(a) >= spreadOf(b) ? a : b));
    boxes = boxes.flatMap((box) => (box === widest ? splitBox(box) : [box]));
  }
  const mapping = new Map<string, string>();
  for (const box of boxes) {
    const representative = averageOf(box);
    for (const swatch of box) mapping.set(swatch.hex, representative);
  }
  return mapping;
}

function splitBox(box: Swatch[]): Swatch[][] {
  const channel = widestChannelOf(box);
  const sorted = [...box].sort((a, b) => a[channel] - b[channel] || (a.hex < b.hex ? -1 : 1));
  const middle = Math.floor(sorted.length / 2);
  return [sorted.slice(0, middle), sorted.slice(middle)];
}

function spreadOf(box: Swatch[]): number {
  const channel = widestChannelOf(box);
  return rangeOf(box, channel) * box.length;
}

function widestChannelOf(box: Swatch[]): Channel {
  return CHANNELS.reduce((a, b) => (rangeOf(box, a) >= rangeOf(box, b) ? a : b));
}

function rangeOf(box: Swatch[], channel: Channel): number {
  let low = Infinity;
  let high = -Infinity;
  for (const swatch of box) {
    low = Math.min(low, swatch[channel]);
    high = Math.max(high, swatch[channel]);
  }
  return high - low;
}

function averageOf(box: Swatch[]): string {
  let red = 0;
  let green = 0;
  let blue = 0;
  let weight = 0;
  for (const swatch of box) {
    red += swatch.red * swatch.weight;
    green += swatch.green * swatch.weight;
    blue += swatch.blue * swatch.weight;
    weight += swatch.weight;
  }
  return hexOfRgb({ red: red / weight, green: green / weight, blue: blue / weight });
}
