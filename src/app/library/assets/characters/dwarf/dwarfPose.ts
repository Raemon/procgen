export interface DwarfPose {
  bob: number;
  lean: number;
  stride: number;
  armSwing: number;
  breath: number;
  cloakSway: number;
  cloakLift: number;
  braidSway: number;
  lanternSwing: number;
  lanternFlare: number;
  auraPulse: number;
  motePhase: number;
}

export function idleDwarfPose(phase: number): DwarfPose {
  const breathTurns = turns(phase);
  return {
    bob: Math.sin(breathTurns) * 0.9,
    lean: Math.sin(breathTurns - 0.9) * 0.35,
    stride: 0,
    armSwing: Math.sin(breathTurns - 1.2) * 0.12,
    breath: Math.sin(breathTurns) * 0.5 + 0.5,
    cloakSway: Math.sin(breathTurns - 1.1) * 0.45,
    cloakLift: Math.sin(breathTurns - 1.6) * 0.3,
    braidSway: Math.sin(breathTurns - 1.5) * 0.5,
    lanternSwing: Math.sin(breathTurns - 1.9) * 0.35,
    lanternFlare: flicker(phase),
    auraPulse: Math.sin(turns(phase * 0.5)) * 0.5 + 0.5,
    motePhase: phase,
  };
}

export function walkingDwarfPose(phase: number): DwarfPose {
  const strideTurns = turns(phase);
  return {
    bob: 1.6 - Math.abs(Math.sin(strideTurns)) * 3.2,
    lean: 0.8 + Math.sin(strideTurns * 2) * 0.3,
    stride: Math.sin(strideTurns),
    armSwing: -Math.sin(strideTurns),
    breath: Math.abs(Math.sin(strideTurns)),
    cloakSway: Math.sin(strideTurns - 1.0) * 1,
    cloakLift: 0.55 + Math.sin(strideTurns - 1.4) * 0.45,
    braidSway: Math.sin(strideTurns - 0.7) * 1,
    lanternSwing: Math.sin(strideTurns - 1.3) * 0.9,
    lanternFlare: flicker(phase * 2),
    auraPulse: Math.sin(turns(phase)) * 0.5 + 0.5,
    motePhase: phase,
  };
}

function flicker(phase: number): number {
  const fast = Math.sin(turns(phase * 3.7));
  const slow = Math.sin(turns(phase * 1.3) + 1.7);
  return (fast * 0.6 + slow * 0.4) * 0.5 + 0.5;
}

function turns(phase: number): number {
  return phase * Math.PI * 2;
}
