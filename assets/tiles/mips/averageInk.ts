const OPAQUE = 255;
const WITH_ALPHA_LENGTH = 9;

interface Rgba {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export function averageInk(inks: readonly string[]): string {
  const samples = inks.map(rgbaOfInk);
  const totalAlpha = samples.reduce((sum, sample) => sum + sample.alpha, 0);
  const weightOf = totalAlpha > 0 ? (sample: Rgba) => sample.alpha : () => 1;
  return inkOfChannels(
    weightedChannel(samples, (sample) => sample.red, weightOf),
    weightedChannel(samples, (sample) => sample.green, weightOf),
    weightedChannel(samples, (sample) => sample.blue, weightOf),
  );
}

function weightedChannel(
  samples: readonly Rgba[],
  channelOf: (sample: Rgba) => number,
  weightOf: (sample: Rgba) => number,
): number {
  const weighted = samples.reduce((sum, sample) => sum + channelOf(sample) * weightOf(sample), 0);
  return weighted / samples.reduce((sum, sample) => sum + weightOf(sample), 0);
}

function rgbaOfInk(ink: string): Rgba {
  const packed = Number.parseInt(ink.slice(1, 7), 16);
  return {
    red: (packed >> 16) & 255,
    green: (packed >> 8) & 255,
    blue: packed & 255,
    alpha: ink.length === WITH_ALPHA_LENGTH ? Number.parseInt(ink.slice(7), 16) : OPAQUE,
  };
}

function inkOfChannels(red: number, green: number, blue: number): string {
  return `#${hexPair(red)}${hexPair(green)}${hexPair(blue)}`;
}

function hexPair(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0');
}
