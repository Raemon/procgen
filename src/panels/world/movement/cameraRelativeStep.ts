export type Step = readonly [number, number];

const FORWARD_PER_QUADRANT: readonly Step[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export function cameraRelativeStep(
  yawQuadrant: number,
  forwardInput: number,
  strafeInput: number,
): Step {
  const quadrant = ((yawQuadrant % 4) + 4) % 4;
  const [forwardX, forwardY] = FORWARD_PER_QUADRANT[quadrant]!;
  const [rightX, rightY] = FORWARD_PER_QUADRANT[(quadrant + 1) % 4]!;
  return [
    forwardInput * forwardX + strafeInput * rightX,
    forwardInput * forwardY + strafeInput * rightY,
  ];
}

export function slideAlongEachAxis([dx, dy]: Step, step: (dx: number, dy: number) => void): void {
  if (dx === 0 && dy === 0) return;
  if (dx !== 0 && dy !== 0) {
    step(dx, 0);
    step(0, dy);
    return;
  }
  step(dx, dy);
}
