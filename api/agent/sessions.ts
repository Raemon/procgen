import type { FacingIndex } from '../../world/facing';
import type { AbilityActor } from '../../abilities/ability';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from '../../world/vision/characterSight';
import type { AgentMode, AgentPose } from '../../agents/agentMode';
import { stepIsAllowed, type StepRules } from '../../world/sim/stepIsAllowed';
import { newNotebook, type AgentNotebook } from './agentNotebook';

export interface AgentSession {
  id: string;
  name: string;
  mode: AgentMode;
  x: number;
  y: number;
  facing: FacingIndex;
  sightRadiusTiles: number;
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
  sightRadiusTiles: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
): AgentSession {
  return {
    id,
    name,
    mode,
    x: spawn.x,
    y: spawn.y,
    facing: 0,
    sightRadiusTiles: clampSightRadiusTiles(sightRadiusTiles),
    createdAt: Date.now(),
    lastAction: null,
    notebook: newNotebook(),
    run: null,
  };
}

export function sessionPose(session: AgentSession): AgentPose {
  return { x: session.x, y: session.y, facing: session.facing };
}

export function sessionActor(session: AgentSession, rules: StepRules): AbilityActor {
  return {
    pose: () => sessionPose(session),
    tryStep: (dx, dy) => {
      const nextX = session.x + dx;
      const nextY = session.y + dy;
      if (!stepIsAllowed(rules, nextX, nextY, dx, dy)) return false;
      session.x = nextX;
      session.y = nextY;
      return true;
    },
    turn: (eighthTurns) => {
      session.facing = ((((session.facing + eighthTurns) % 8) + 8) % 8) as FacingIndex;
    },
    sightRadiusTiles: () => session.sightRadiusTiles,
    setSightRadiusTiles: (radius) => {
      session.sightRadiusTiles = clampSightRadiusTiles(radius);
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
