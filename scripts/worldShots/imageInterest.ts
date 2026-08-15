import type { RgbImage } from '../png/writePng';

const QUANT_BITS = 4;
const EDGE_THRESHOLD = 18;
const COARSE_BLOCK = 16;
const COARSE_EDGE_THRESHOLD = 10;
const DULL_COLOR_BITS = 2;
const DULL_EDGE_SHARE = 0.01;
const DULL_COARSE_SHARE = 0.04;
const MONOTONE_FLAT_SHARE = 0.7;
const NOISY_FINE_SHARE = 0.55;
const NOISY_COARSE_SHARE = 0.05;

export interface ImageInterest {
  colorEntropyBits: number;
  edgeShare: number;
  coarseStructureShare: number;
  largestFlatShare: number;
  largestRegionShare: number;
  confettiShare: number;
  verdict: 'interesting' | 'monotonous' | 'noisy' | 'dull' | 'uniform';
}

const REGION_QUANT_BITS = 3;
const CONFETTI_REGION_SHARE = 0.001;
const UNIFORM_CONFETTI_ABOVE = 0.4;
const COMPOSED_REGION_SHARE = 0.08;

export function imageInterest(image: RgbImage): ImageInterest {
  const pixels = rasterOf(image);
  const colorEntropyBits = entropyBitsOf(quantizedHistogram(pixels));
  const edgeShare = edgeShareOf(pixels, image.width);
  const coarseStructureShare = coarseEdgeShareOf(pixels, image.width);
  const largestFlatShare = largestBinShare(quantizedHistogram(pixels), pixels.length / 3);
  const regions = regionSizeStats(pixels, image.width);
  return {
    colorEntropyBits,
    edgeShare,
    coarseStructureShare,
    largestFlatShare,
    ...regions,
    verdict: verdictOf(colorEntropyBits, edgeShare, coarseStructureShare, largestFlatShare, regions),
  };
}

interface RegionStats {
  largestRegionShare: number;
  confettiShare: number;
}

function verdictOf(
  colorEntropyBits: number,
  edgeShare: number,
  coarseStructureShare: number,
  largestFlatShare: number,
  regions: RegionStats,
): ImageInterest['verdict'] {
  if (largestFlatShare > MONOTONE_FLAT_SHARE) return 'monotonous';
  if (edgeShare > NOISY_FINE_SHARE && coarseStructureShare < NOISY_COARSE_SHARE) return 'noisy';
  if (colorEntropyBits < DULL_COLOR_BITS) return 'dull';
  if (edgeShare < DULL_EDGE_SHARE && coarseStructureShare < DULL_COARSE_SHARE) return 'dull';
  if (regions.confettiShare > UNIFORM_CONFETTI_ABOVE && regions.largestRegionShare < COMPOSED_REGION_SHARE) {
    return 'uniform';
  }
  return 'interesting';
}

function regionSizeStats(pixels: Uint8Array, width: number): RegionStats {
  const height = pixels.length / 3 / width;
  const total = width * height;
  const labels = new Int32Array(total).fill(-1);
  const keys = regionKeysOf(pixels, total);
  let largest = 0;
  let confetti = 0;
  for (let start = 0; start < total; start++) {
    if (labels[start] !== -1) continue;
    const size = floodRegion(labels, keys, width, height, start);
    largest = Math.max(largest, size);
    if (size < total * CONFETTI_REGION_SHARE) confetti += size;
  }
  return { largestRegionShare: largest / total, confettiShare: confetti / total };
}

function regionKeysOf(pixels: Uint8Array, total: number): Int32Array {
  const keys = new Int32Array(total);
  const shift = 8 - REGION_QUANT_BITS;
  for (let at = 0; at < total; at++) {
    keys[at] =
      ((pixels[at * 3]! >> shift) << (2 * REGION_QUANT_BITS)) |
      ((pixels[at * 3 + 1]! >> shift) << REGION_QUANT_BITS) |
      (pixels[at * 3 + 2]! >> shift);
  }
  return keys;
}

function floodRegion(
  labels: Int32Array,
  keys: Int32Array,
  width: number,
  height: number,
  start: number,
): number {
  const wanted = keys[start]!;
  const queue = [start];
  labels[start] = start;
  let size = 0;
  while (queue.length > 0) {
    const at = queue.pop()!;
    size++;
    const x = at % width;
    const y = Math.floor(at / width);
    if (x > 0) tryGrow(labels, keys, queue, at - 1, wanted, start);
    if (x < width - 1) tryGrow(labels, keys, queue, at + 1, wanted, start);
    if (y > 0) tryGrow(labels, keys, queue, at - width, wanted, start);
    if (y < height - 1) tryGrow(labels, keys, queue, at + width, wanted, start);
  }
  return size;
}

function tryGrow(
  labels: Int32Array,
  keys: Int32Array,
  queue: number[],
  at: number,
  wanted: number,
  label: number,
): void {
  if (labels[at] !== -1 || keys[at] !== wanted) return;
  labels[at] = label;
  queue.push(at);
}

function coarseEdgeShareOf(pixels: Uint8Array, width: number): number {
  const height = pixels.length / 3 / width;
  const blocksX = Math.floor(width / COARSE_BLOCK);
  const blocksY = Math.floor(height / COARSE_BLOCK);
  if (blocksX < 2 || blocksY < 2) return 0;
  const blocks = blockLuminances(pixels, width, blocksX, blocksY);
  let edges = 0;
  let sampled = 0;
  for (let by = 0; by < blocksY - 1; by++) {
    for (let bx = 0; bx < blocksX - 1; bx++) {
      const here = blocks[by * blocksX + bx]!;
      sampled++;
      if (
        Math.abs(here - blocks[by * blocksX + bx + 1]!) > COARSE_EDGE_THRESHOLD ||
        Math.abs(here - blocks[(by + 1) * blocksX + bx]!) > COARSE_EDGE_THRESHOLD
      ) {
        edges++;
      }
    }
  }
  return sampled === 0 ? 0 : edges / sampled;
}

function blockLuminances(
  pixels: Uint8Array,
  width: number,
  blocksX: number,
  blocksY: number,
): Float32Array {
  const blocks = new Float32Array(blocksX * blocksY);
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let total = 0;
      for (let dy = 0; dy < COARSE_BLOCK; dy++) {
        for (let dx = 0; dx < COARSE_BLOCK; dx++) {
          total += luminanceAt(pixels, width, bx * COARSE_BLOCK + dx, by * COARSE_BLOCK + dy);
        }
      }
      blocks[by * blocksX + bx] = total / (COARSE_BLOCK * COARSE_BLOCK);
    }
  }
  return blocks;
}

function rasterOf(image: RgbImage): Uint8Array {
  const pixels = new Uint8Array(image.width * image.height * 3);
  let at = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const [r, g, b] = image.pixelAt(x, y);
      pixels[at++] = r;
      pixels[at++] = g;
      pixels[at++] = b;
    }
  }
  return pixels;
}

function quantizedHistogram(pixels: Uint8Array): Map<number, number> {
  const histogram = new Map<number, number>();
  const shift = 8 - QUANT_BITS;
  for (let at = 0; at < pixels.length; at += 3) {
    const key =
      ((pixels[at]! >> shift) << (2 * QUANT_BITS)) |
      ((pixels[at + 1]! >> shift) << QUANT_BITS) |
      (pixels[at + 2]! >> shift);
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }
  return histogram;
}

function entropyBitsOf(histogram: Map<number, number>): number {
  const total = [...histogram.values()].reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  let bits = 0;
  for (const count of histogram.values()) {
    const share = count / total;
    bits -= share * Math.log2(share);
  }
  return bits;
}

function largestBinShare(histogram: Map<number, number>, total: number): number {
  if (total === 0) return 1;
  return Math.max(0, ...histogram.values()) / total;
}

function edgeShareOf(pixels: Uint8Array, width: number): number {
  const height = pixels.length / 3 / width;
  let edges = 0;
  let sampled = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const here = luminanceAt(pixels, width, x, y);
      const right = luminanceAt(pixels, width, x + 1, y);
      const below = luminanceAt(pixels, width, x, y + 1);
      sampled++;
      if (Math.abs(here - right) > EDGE_THRESHOLD || Math.abs(here - below) > EDGE_THRESHOLD) edges++;
    }
  }
  return sampled === 0 ? 0 : edges / sampled;
}

function luminanceAt(pixels: Uint8Array, width: number, x: number, y: number): number {
  const at = (y * width + x) * 3;
  return 0.299 * pixels[at]! + 0.587 * pixels[at + 1]! + 0.114 * pixels[at + 2]!;
}
