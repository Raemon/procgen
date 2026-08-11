type Rgb = [number, number, number];

export function mixHex(from: string, to: string, amount: number): string {
  const [fromRed, fromGreen, fromBlue] = hexToRgb(from);
  const [toRed, toGreen, toBlue] = hexToRgb(to);
  const blend = (start: number, end: number): number => start + (end - start) * amount;
  return rgbToHex([blend(fromRed, toRed), blend(fromGreen, toGreen), blend(fromBlue, toBlue)]);
}

export function lighten(hex: string, amount: number): string {
  return mixHex(hex, '#ffffff', amount);
}

export function darken(hex: string, amount: number): string {
  return mixHex(hex, '#000000', amount);
}

export function shadedRamp(hex: string, steps: number, spread: number): string[] {
  return Array.from({ length: steps }, (_, step) =>
    mixHex(darken(hex, spread), lighten(hex, spread), step / Math.max(1, steps - 1)),
  );
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map(channelToHexPair).join('')}`;
}

function channelToHexPair(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0');
}
