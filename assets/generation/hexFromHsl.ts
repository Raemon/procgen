const HUE_SECTORS = 6;

export function hexFromHsl(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const offset = lightness - chroma / 2;
  return `#${sectorChannels(hue, chroma).map((channel) => hexPair(channel + offset)).join('')}`;
}

function sectorChannels(hue: number, chroma: number): number[] {
  const sector = wrappedHue(hue) * HUE_SECTORS;
  const ramp = chroma * (1 - Math.abs((sector % 2) - 1));
  return sectorOrder(chroma, ramp)[Math.floor(sector) % HUE_SECTORS] as number[];
}

function sectorOrder(chroma: number, ramp: number): number[][] {
  return [
    [chroma, ramp, 0],
    [ramp, chroma, 0],
    [0, chroma, ramp],
    [0, ramp, chroma],
    [ramp, 0, chroma],
    [chroma, 0, ramp],
  ];
}

export function wrappedHue(hue: number): number {
  return ((hue % 1) + 1) % 1;
}

function hexPair(channel: number): string {
  const byte = Math.max(0, Math.min(255, Math.round(channel * 255)));
  return byte.toString(16).padStart(2, '0');
}
