import { pickByValue } from '../artNoise';
import { wrapped, type PixelPainter } from '../pixelCanvas';

export interface WaveStyle {
  palette: readonly string[];
  wavelength: number;
  amplitude: number;
  bandHeight: number;
  size: number;
  phase?: number;
}

export function wavePainter(style: WaveStyle): PixelPainter {
  return (x, y) => pickByValue(style.palette, bandProgress(x, y, style));
}

export function scrolledWaves(style: WaveStyle, phase: number): WaveStyle {
  return { ...style, phase };
}

function bandProgress(x: number, y: number, style: WaveStyle): number {
  const rippled = y + (style.phase ?? 0) + style.amplitude * Math.sin((2 * Math.PI * x) / style.wavelength);
  return (wrapped(Math.round(rippled), style.size) % style.bandHeight) / style.bandHeight;
}
