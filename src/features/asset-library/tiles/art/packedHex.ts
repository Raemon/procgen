const packedByHex = new Map<string, number>();
const hexByPacked = new Map<number, string>();

export function packHex(hex: string): number {
  const cached = packedByHex.get(hex);
  if (cached !== undefined) return cached;
  const packed = Number.parseInt(hex.slice(1, 7), 16) & 0xffffff;
  packedByHex.set(hex, packed);
  return packed;
}

export function hexOfPacked(packed: number): string {
  const cached = hexByPacked.get(packed);
  if (cached !== undefined) return cached;
  const hex = `#${packed.toString(16).padStart(6, '0')}`;
  hexByPacked.set(packed, hex);
  return hex;
}

export function packRgb(red: number, green: number, blue: number): number {
  return (byte(red) << 16) | (byte(green) << 8) | byte(blue);
}

export function mixPacked(from: number, to: number, amount: number): number {
  const t = clampUnit(amount);
  if (t <= 0) return from;
  if (t >= 1) return to;
  return packRgb(
    channelBetween(from, to, 16, t),
    channelBetween(from, to, 8, t),
    channelBetween(from, to, 0, t),
  );
}

export function mixInk(fromHex: string, toHex: string, amount: number): number {
  return mixPacked(packHex(fromHex), packHex(toHex), amount);
}

export function clampUnit(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function channelBetween(from: number, to: number, shift: number, t: number): number {
  const start = (from >> shift) & 255;
  return start + (((to >> shift) & 255) - start) * t;
}

function byte(value: number): number {
  const rounded = Math.round(value);
  return rounded < 0 ? 0 : rounded > 255 ? 255 : rounded;
}
