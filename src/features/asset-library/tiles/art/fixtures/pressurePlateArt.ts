import { stoneShade } from '@/features/asset-library/textures/synth/dungeonStone';
import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { cubeArtFrom } from '../cubeArtFrom';
import type { PixelPainter } from '../pixelCanvas';
import { rememberedArt } from '../rememberedArt';

const WAITING_SIGNAL = '#f0b043';
const PRESSED_SIGNAL = '#6fe08a';
const SET_INTO: Rgb = [54, 70, 106];
const UNDERSIDE = '#14161c';
const STONE_CEILING = 1.2544;
const STONE_GROUT = 0.07;
const RING_RADIUS = 0.32;
const RING_HALF = 0.03;
const RING_FEATHER = 0.04;
const DISH_RADIUS = 0.27;
const DOT_FROM = 0.07;
const DOT_TO = 0.1;
const RELIEF_CEILING = 1.9;

interface PlateGlow {
  signal: string;
  lit: number;
}

const waitingArt = new Map<string, CubeFaceArt>();
const pressedArt = new Map<string, CubeFaceArt>();

export function plateWaitingFaceArt(signal: string = WAITING_SIGNAL): CubeFaceArt {
  return rememberedArt(waitingArt, signal, () => plateArt({ signal, lit: 0.35 }));
}

export function platePressedFaceArt(signal: string = PRESSED_SIGNAL): CubeFaceArt {
  return rememberedArt(pressedArt, signal, () => plateArt({ signal, lit: 0.8 }));
}

function plateArt(glow: PlateGlow): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    { top: dishPainter(glow), sides: rimPainter(), bottom: () => UNDERSIDE },
    { top: dishReliefPainter(), sides: () => heightInk(0.5) },
  );
}

function dishPainter(glow: PlateGlow): PixelPainter {
  const accent = hexToRgb(glow.signal);
  return (x, y) => {
    const [u, v] = faceUv(x, y);
    const radius = Math.hypot(u - 0.5, v - 0.5);
    const ring = ringAt(radius);
    const dish = smoothstep(RING_RADIUS, DISH_RADIUS, radius);
    const dot = 1 - smoothstep(DOT_FROM, DOT_TO, radius);
    const stone = stoneShade(u, v, 1, STONE_GROUT) / STONE_CEILING;
    return rgbToHex(
      accent.map((channel, band) => {
        const inner = mix(channel * 0.3, channel * 0.9, dot);
        const sunk = mix(SET_INTO[band]! * stone, inner, dish);
        return mix(sunk, channel, ring) + channel * glow.lit * (0.35 * ring + 0.5 * dot);
      }) as Rgb,
    );
  };
}

function rimPainter(): PixelPainter {
  return (x, y) => {
    const [u, v] = faceUv(x, y);
    const stone = 0.8 * (stoneShade(u, v, 1, STONE_GROUT) / STONE_CEILING);
    return rgbToHex(SET_INTO.map((channel) => channel * stone) as Rgb);
  };
}

function dishReliefPainter(): PixelPainter {
  return (x, y) => {
    const [u, v] = faceUv(x, y);
    const radius = Math.hypot(u - 0.5, v - 0.5);
    const stone = stoneShade(u, v, 1, STONE_GROUT) / STONE_CEILING;
    const relief = stone + 0.9 * ringAt(radius) - 0.5 * smoothstep(RING_RADIUS, DISH_RADIUS - 0.01, radius);
    return heightInk((relief + 0.5) / RELIEF_CEILING);
  };
}

function ringAt(radius: number): number {
  return 1 - smoothstep(0, RING_FEATHER, Math.abs(radius - RING_RADIUS) - RING_HALF);
}

function faceUv(x: number, y: number): [number, number] {
  return [(x + 0.5) / SIZE, (y + 0.5) / SIZE];
}

function smoothstep(from: number, to: number, at: number): number {
  const held = Math.min(1, Math.max(0, (at - from) / (to - from)));
  return held * held * (3 - 2 * held);
}

function mix(from: number, to: number, at: number): number {
  return from + (to - from) * at;
}

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')).join('')}`;
}
