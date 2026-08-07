export type Rgb = [number, number, number];

export interface PixelSheet {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export function blankSheet(width: number, height: number, background: Rgb): PixelSheet {
  const pixels = new Uint8Array(width * height * 3);
  for (let index = 0; index < width * height; index++) pixels.set(background, index * 3);
  return { width, height, pixels };
}

export function putPixel(sheet: PixelSheet, x: number, y: number, color: Rgb): void {
  if (x < 0 || y < 0 || x >= sheet.width || y >= sheet.height) return;
  sheet.pixels.set(color, (y * sheet.width + x) * 3);
}

export function sheetPixelAt(sheet: PixelSheet): (x: number, y: number) => Rgb {
  return (x, y) => {
    const offset = (y * sheet.width + x) * 3;
    return [
      sheet.pixels[offset] ?? 0,
      sheet.pixels[offset + 1] ?? 0,
      sheet.pixels[offset + 2] ?? 0,
    ];
  };
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
