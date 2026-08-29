export interface GauntPose {
  nearLegSwing: number;
  nearLegLift: number;
  farLegSwing: number;
  farLegLift: number;
  bodyLift: number;
  headDip: number;
  clawSwing: number;
}

export const GAUNT_WALK_FRAMES = 8;
export const GAUNT_IDLE_FRAMES = 4;
export const GAUNT_ATTACK_FRAMES = 6;

export function walkingGauntPose(phase: number): GauntPose {
  const near = legCycle(phase);
  const far = legCycle(phase + 0.5);
  return {
    nearLegSwing: near.swing,
    nearLegLift: near.lift,
    farLegSwing: far.swing,
    farLegLift: far.lift,
    bodyLift: Math.max(near.lift, far.lift),
    headDip: 0,
    clawSwing: 0,
  };
}

export function idleGauntPose(frame: number): GauntPose {
  const dip = frame === 2 || frame === 3 ? 1 : 0;
  return {
    nearLegSwing: 0,
    nearLegLift: 0,
    farLegSwing: 0,
    farLegLift: 0,
    bodyLift: 0,
    headDip: dip,
    clawSwing: 0,
  };
}

const ATTACK_BEATS: ReadonlyArray<
  readonly [clawSwing: number, headDip: number, bodyLift: number]
> = [
  [0, 1, 0],
  [-0.6, 0, 0.5],
  [-1, -1, 1.5],
  [1, 2, 0],
  [0.7, 2, 0],
  [0.3, 1, 0],
];

export function attackingGauntPose(frame: number): GauntPose {
  const [clawSwing, headDip, bodyLift] = ATTACK_BEATS[frame % ATTACK_BEATS.length]!;
  return {
    nearLegSwing: 0.5,
    nearLegLift: 0,
    farLegSwing: -0.5,
    farLegLift: 0,
    bodyLift,
    headDip,
    clawSwing,
  };
}

function legCycle(phase: number): { swing: number; lift: number } {
  const turn = (phase % 1) * Math.PI * 2;
  return {
    swing: -Math.cos(turn),
    lift: Math.max(0, Math.sin(turn)),
  };
}
