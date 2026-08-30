import type { FacingIndex } from '@/features/game/facing';
import type { CommandActor } from '@/features/app-shell/runtime/commands/command';
import { clampSightRadiusTiles } from '@/features/game/vision/characterSight';
import { clampGodViewSizeTiles } from '@/features/game/vision/godViewSize';
import { godViewSizeOf, sightRadiusOf, type ViewVision } from '../observation';
import type { AgentMode, AgentPose } from '../agentMode';
import { jumpLandingDelta } from '@/features/game/sim/jumpLanding';
import { stepIsAllowed, type StepRules } from '@/features/game/sim/stepIsAllowed';
import { newNotebook, type AgentNotebook } from './agentNotebook';

export interface AgentSession {
  id: string;
  name: string;
  mode: AgentMode;
  x: number;
  y: number;
  facing: FacingIndex;
  sightRadiusTiles: number;
  godViewSizeTiles: number;
  createdAt: number;
  lastAction: { action: string; outcome: string } | null;
  notebook: AgentNotebook;
  run: AutopilotRun | null;
}

export interface TranscriptEntry {
  seq: number;
  type: 'status' | 'thinking' | 'message' | 'tool_use' | 'tool_result' | 'error';
  text: string;
}

export type RunStatus = 'running' | 'stopped' | 'finished' | 'error';

export interface AutopilotRun {
  goal: string;
  model: string;
  status: RunStatus;
  steps: number;
  budgetUsd: number;
  spentUsd: number;
  transcript: TranscriptEntry[];
  stopRequested: boolean;
}

export type SessionStore = Map<string, AgentSession>;

export function newSession(
  id: string,
  name: string,
  mode: AgentMode,
  spawn: { x: number; y: number },
  vision: ViewVision = {},
): AgentSession {
  return {
    id,
    name,
    mode,
    x: spawn.x,
    y: spawn.y,
    facing: 0,
    sightRadiusTiles: sightRadiusOf(vision),
    godViewSizeTiles: godViewSizeOf(vision),
    createdAt: Date.now(),
    lastAction: null,
    notebook: newNotebook(),
    run: null,
  };
}

export function sessionVision(session: AgentSession): ViewVision {
  return {
    sightRadiusTiles: session.sightRadiusTiles,
    godViewSizeTiles: session.godViewSizeTiles,
  };
}

export function sessionPose(session: AgentSession): AgentPose {
  return { x: session.x, y: session.y, facing: session.facing };
}

export function sessionActor(session: AgentSession, rules: StepRules): CommandActor {
  return {
    pose: () => sessionPose(session),
    snapTo: (x, y, facing) => {
      session.x = x;
      session.y = y;
      session.facing = facing;
    },
    tryStep: (dx, dy, mayPush = true) => {
      const nextX = session.x + dx;
      const nextY = session.y + dy;
      if (!stepIsAllowed(rules, nextX, nextY, dx, dy, mayPush)) return false;
      session.x = nextX;
      session.y = nextY;
      return true;
    },
    tryJump: (dx, dy) => {
      const delta = jumpLandingDelta(rules, session.x, session.y, dx, dy);
      if (!delta) return false;
      session.x += delta.dx;
      session.y += delta.dy;
      return true;
    },
    turn: (eighthTurns) => {
      session.facing = ((((session.facing + eighthTurns) % 8) + 8) % 8) as FacingIndex;
    },
    sightRadiusTiles: () => session.sightRadiusTiles,
    setSightRadiusTiles: (radius) => {
      session.sightRadiusTiles = clampSightRadiusTiles(radius);
    },
    godViewSizeTiles: () => session.godViewSizeTiles,
    setGodViewSizeTiles: (sizeTiles) => {
      session.godViewSizeTiles = clampGodViewSizeTiles(sizeTiles);
    },
  };
}

export function appendTranscript(
  run: AutopilotRun,
  type: TranscriptEntry['type'],
  text: string,
): void {
  const seq = (run.transcript[run.transcript.length - 1]?.seq ?? 0) + 1;
  run.transcript.push({ seq, type, text });
}
