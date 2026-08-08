const SEARCH_BOUND_PIXELS = 8000;
const SEARCH_STEPS = 40;

export function wheelPixelsReaching(
  target: number,
  measureAfterWheelPixels: (wheelPixels: number) => number,
): number {
  let below = -SEARCH_BOUND_PIXELS;
  let above = SEARCH_BOUND_PIXELS;
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const middle = (below + above) / 2;
    if (measureAfterWheelPixels(middle) < target) below = middle;
    else above = middle;
  }
  return (below + above) / 2;
}
