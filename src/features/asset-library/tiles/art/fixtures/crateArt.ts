import { vnoise } from '@/features/asset-library/textures/synth/dungeonStone';
import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { cubeArtFrom } from '../cubeArtFrom';
import type { PixelPainter } from '../pixelCanvas';
import { rememberedArt } from '../rememberedArt';

export const ARCANE_CORE = '#4fd8ff';

const UNDERSIDE = '#14161c';
const STUD = [217, 209, 179] as const;
const PANEL_SHADE = 0.72;
const FRAME_FROM = 0.2;
const FRAME_TO = 0.25;
const BEVEL_REACH = 0.09;
const STUD_FROM_CENTRE = 0.36;
const STUD_INNER = 0.04;
const STUD_OUTER = 0.08;
const SETTLED_WASH = 0.12;
const SETTLED_RIM = 0.7;
const SETTLED_FLOOR = 0.25;
const RELIEF_CEILING = 1.7;

const plainArt = new Map<string, CubeFaceArt>();
const settledArt = new Map<string, CubeFaceArt>();

export function crateFaceArt(core: string = ARCANE_CORE): CubeFaceArt {
  return rememberedArt(plainArt, core, () => crateArt(core, false));
}

export function crateOnPlateFaceArt(core: string = ARCANE_CORE): CubeFaceArt {
  return rememberedArt(settledArt, core, () => crateArt(core, true));
}

function crateArt(core: string, settled: boolean): CubeFaceArt {
  const panel = panelPainter(core, settled);
  return cubeArtFrom(
    SIZE,
    { top: panel, sides: panel, bottom: () => UNDERSIDE },
    { top: panelReliefPainter(), sides: panelReliefPainter() },
  );
}

function panelPainter(core: string, settled: boolean): PixelPainter {
  const base = hexToRgb(core);
  return (x, y) => {
    const [u, v] = faceUv(x, y);
    const edge = edgeDistance(u, v);
    const frame = 1 - smoothstep(FRAME_FROM, FRAME_TO, edge);
    const grain = 0.86 + 0.28 * vnoise(u * 2, v * 22, 32);
    const lit = mix(PANEL_SHADE, 1, frame) * grain;
    const glow = settled ? SETTLED_FLOOR + SETTLED_RIM * smoothstep(BEVEL_REACH, 0, edge) : 0;
    const stud = studAt(u, v);
    return rgbToHex(
      base.map((channel, band) => {
        const plain = channel * lit;
        const washed = settled ? mix(plain, 255, SETTLED_WASH) + channel * glow : plain;
        return mix(washed, STUD[band]!, stud * 0.8);
      }) as Rgb,
    );
  };
}

function panelReliefPainter(): PixelPainter {
  return (x, y) => {
    const [u, v] = faceUv(x, y);
    const edge = edgeDistance(u, v);
    const relief =
      smoothstep(0, BEVEL_REACH, edge) - 0.45 * smoothstep(FRAME_FROM, FRAME_TO, edge) + 0.7 * studAt(u, v);
    return heightInk(relief / RELIEF_CEILING);
  };
}

function studAt(u: number, v: number): number {
  const across = Math.abs(u - 0.5) - STUD_FROM_CENTRE;
  const down = Math.abs(v - 0.5) - STUD_FROM_CENTRE;
  return 1 - smoothstep(STUD_INNER, STUD_OUTER, Math.hypot(across, down));
}

function faceUv(x: number, y: number): [number, number] {
  return [(x + 0.5) / SIZE, (y + 0.5) / SIZE];
}

function edgeDistance(u: number, v: number): number {
  return Math.min(u, 1 - u, v, 1 - v);
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
