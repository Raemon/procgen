const READABLE_LUMINANCE = 150;

export function asciiTileInk(hex: string): string {
  const [r, g, b] = channelsOf(hex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luminance >= READABLE_LUMINANCE) return hex;
  const lift = (READABLE_LUMINANCE - luminance) / (255 - luminance);
  const [lr, lg, lb] = [r, g, b].map((channel) => Math.round(channel + (255 - channel) * lift));
  return `rgb(${lr},${lg},${lb})`;
}

function channelsOf(hex: string): [number, number, number] {
  const digits = hex.replace('#', '');
  const wide = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits;
  const channel = (offset: number): number => parseInt(wide.slice(offset, offset + 2), 16) || 0;
  return [channel(0), channel(2), channel(4)];
}
