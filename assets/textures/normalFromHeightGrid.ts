export function normalRgbAt(
  heightAt: (x: number, y: number) => number,
  x: number,
  y: number,
  size: number,
  slopeStrength: number,
): [number, number, number] {
  const wrapped = (v: number) => ((v % size) + size) % size;
  const slopeX = heightAt(wrapped(x + 1), y) - heightAt(wrapped(x - 1), y);
  const slopeY = heightAt(x, wrapped(y + 1)) - heightAt(x, wrapped(y - 1));
  return encodeNormal(-slopeX * slopeStrength, -slopeY * slopeStrength);
}

function encodeNormal(nx: number, ny: number): [number, number, number] {
  const length = Math.sqrt(nx * nx + ny * ny + 1);
  return [channelOf(nx / length), channelOf(ny / length), channelOf(1 / length)];
}

function channelOf(component: number): number {
  return Math.round((component * 0.5 + 0.5) * 255);
}
